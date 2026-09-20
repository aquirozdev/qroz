import test from "node:test"
import assert from "node:assert/strict"

import application, { deliveredNotifications } from "../dist/app.js"
import { DeliverNotification } from "../dist/notifications.js"
import { createAwsLambdaHandler } from "../../../packages/runtime-aws/dist/index.js"
import { createSqsQueue } from "../../../packages/queue-sqs/dist/index.js"
import { createAwsSqsJobConsumer } from "../../../packages/jobs-aws-sqs/dist/index.js"
import { createS3Storage } from "../../../packages/storage-s3/dist/index.js"
import { probeStorageContract } from "../../../packages/storage/dist/index.js"

test("AWS HTTP API v2 adapter executes the same Qroz application", async () => {
  const handler = createAwsLambdaHandler(application)
  const result = await handler({
    version: "2.0",
    rawPath: "/users/123",
    rawQueryString: "",
    headers: { host: "example.test", "x-forwarded-proto": "https" },
    requestContext: { http: { method: "GET" } }
  }, { awsRequestId: "req-1" })

  assert.equal(result.statusCode, 200)
  assert.deepEqual(JSON.parse(result.body), { id: "123", name: "Angel" })
})

test("SQS queue adapter serializes messages, chunks batches and enforces AWS delay limits", async () => {
  const calls = []
  const queue = createSqsQueue({
    async sendMessage(input) { calls.push({ type: "single", input }) },
    async sendMessageBatch(input) { calls.push({ type: "batch", input }); return {} }
  }, { queueUrl: "https://sqs.test/jobs" })

  await queue.send({ hello: "world" }, { delaySeconds: 5 })
  await queue.sendBatch(Array.from({ length: 12 }, (_, i) => ({ body: { i } })))

  assert.equal(calls[0].input.DelaySeconds, 5)
  assert.equal(calls.filter((call) => call.type === "batch").length, 2)
  await assert.rejects(() => queue.send({ bad: true }, { delaySeconds: 901 }), /0 and 900/)
})

test("AWS SQS consumer maps Qroz retry outcomes to Lambda partial batch failures", async () => {
  const before = deliveredNotifications.length
  const consumer = createAwsSqsJobConsumer(application)

  const goodEnvelope = {
    kind: "qroz.job-message",
    schemaVersion: 1,
    id: "aws-job-1",
    job: DeliverNotification.name,
    version: DeliverNotification.version,
    payload: { message: "hello from sqs" },
    idempotencyKey: "aws-job-1",
    createdAt: new Date().toISOString()
  }

  const response = await consumer({
    Records: [
      { messageId: "good", body: JSON.stringify(goodEnvelope), attributes: { ApproximateReceiveCount: "1" } },
      { messageId: "poison", body: "{not-json", attributes: { ApproximateReceiveCount: "1" } }
    ]
  })

  assert.deepEqual(response, { batchItemFailures: [] })
  assert.equal(deliveredNotifications.length, before + 1)
})

test("S3 adapter satisfies Qroz storage contract", async () => {
  const objects = new Map()
  const operations = {
    async putObject(input) {
      const bytes = typeof input.Body === "string"
        ? new TextEncoder().encode(input.Body)
        : input.Body instanceof Uint8Array
          ? input.Body
          : new Uint8Array(await new Response(input.Body).arrayBuffer())
      objects.set(input.Key, {
        bytes,
        ContentType: input.ContentType,
        Metadata: input.Metadata,
        ETag: '"etag"'
      })
      return { ETag: '"etag"' }
    },
    async getObject({ Key }) {
      const item = objects.get(Key)
      if (!item) return null
      return {
        Body: item.bytes,
        ContentLength: item.bytes.byteLength,
        ContentType: item.ContentType,
        Metadata: item.Metadata,
        ETag: item.ETag
      }
    },
    async headObject({ Key }) {
      const item = objects.get(Key)
      if (!item) return null
      return {
        ContentLength: item.bytes.byteLength,
        ContentType: item.ContentType,
        Metadata: item.Metadata,
        ETag: item.ETag
      }
    },
    async deleteObject({ Key }) { objects.delete(Key) }
  }

  const storage = createS3Storage(operations, "bucket")
  assert.deepEqual(await probeStorageContract(storage), {
    put: true, get: true, head: true, delete: true
  })
})


test("AWS runtime resolves an authenticated principal from the HTTP request", async () => {
  const { app, endpoint, module } = await import("@qroz/core")
  const { object, string } = await import("../dist/schema.js")
  const Output = object({ principal: string() })
  const secured = endpoint({
    method: "GET",
    path: "/aws-auth",
    auth: { required: true },
    output: Output,
    handler(ctx) {
      return { principal: ctx.principal.id }
    }
  })
  const definition = app({
    name: "aws-auth",
    modules: [module({ name: "auth", endpoints: { secured } })]
  })

  const handler = createAwsLambdaHandler(definition, {
    authenticate(request) {
      const principal = request.headers.get("x-test-principal")
      return principal ? { id: principal, type: "test" } : undefined
    }
  })

  const allowed = await handler({
    version: "2.0",
    rawPath: "/aws-auth",
    rawQueryString: "",
    headers: {
      host: "example.test",
      "x-forwarded-proto": "https",
      "x-test-principal": "aws-user"
    },
    requestContext: { http: { method: "GET" } }
  }, { awsRequestId: "req-auth" })

  assert.equal(allowed.statusCode, 200)
  assert.deepEqual(JSON.parse(allowed.body), { principal: "aws-user" })

  const anonymous = await handler({
    version: "2.0",
    rawPath: "/aws-auth",
    rawQueryString: "",
    headers: { host: "example.test", "x-forwarded-proto": "https" },
    requestContext: { http: { method: "GET" } }
  }, { awsRequestId: "req-anon" })
  assert.equal(anonymous.statusCode, 401)
})
