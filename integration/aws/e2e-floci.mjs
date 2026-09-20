import assert from "node:assert/strict"
import { mkdtemp, readFile } from "node:fs/promises"
import { spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  ApiGatewayV2Client,
  CreateApiCommand,
  CreateIntegrationCommand,
  CreateRouteCommand,
  CreateStageCommand
} from "@aws-sdk/client-apigatewayv2"
import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient
} from "@aws-sdk/client-dynamodb"
import {
  CreateEventSourceMappingCommand,
  CreateFunctionCommand,
  GetFunctionCommand,
  LambdaClient
} from "@aws-sdk/client-lambda"
import {
  CreateBucketCommand,
  HeadObjectCommand,
  S3Client
} from "@aws-sdk/client-s3"
import {
  CreateQueueCommand,
  GetQueueAttributesCommand,
  GetQueueUrlCommand,
  SQSClient
} from "@aws-sdk/client-sqs"
import { build } from "esbuild"

const hostEndpoint = process.env.AWS_ENDPOINT ?? "http://127.0.0.1:4566"
const lambdaEndpoint = process.env.FLOCI_LAMBDA_ENDPOINT ?? "http://floci:4566"
const region = "us-east-1"
const credentials = { accessKeyId: "test", secretAccessKey: "test" }
const clientOptions = { region, endpoint: hostEndpoint, credentials }

const lambda = new LambdaClient(clientOptions)
const apigw = new ApiGatewayV2Client(clientOptions)
const sqs = new SQSClient(clientOptions)
const s3 = new S3Client({ ...clientOptions, forcePathStyle: true })
const dynamodb = new DynamoDBClient(clientOptions)

const suffix = String(Date.now())
const queueName = `arc-jobs-${suffix}`
const tableName = `arc-idempotency-${suffix}`
const bucket = `arc-delivery-${suffix}`
const apiFunctionName = `arc-api-${suffix}`
const consumerFunctionName = `arc-consumer-${suffix}`

await sqs.send(new CreateQueueCommand({ QueueName: queueName }))
const queueUrl = (await sqs.send(new GetQueueUrlCommand({ QueueName: queueName }))).QueueUrl
assert.ok(queueUrl)

const queueArn = (await sqs.send(new GetQueueAttributesCommand({
  QueueUrl: queueUrl,
  AttributeNames: ["QueueArn"]
}))).Attributes?.QueueArn
assert.ok(queueArn)

await s3.send(new CreateBucketCommand({ Bucket: bucket }))
await dynamodb.send(new CreateTableCommand({
  TableName: tableName,
  BillingMode: "PAY_PER_REQUEST",
  AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
  KeySchema: [{ AttributeName: "id", KeyType: "HASH" }]
}))

for (let attempt = 0; attempt < 30; attempt += 1) {
  const status = (await dynamodb.send(new DescribeTableCommand({ TableName: tableName }))).Table?.TableStatus
  if (status === "ACTIVE") break
  await new Promise((resolve) => setTimeout(resolve, 200))
}

async function bundleAndZip(entry, name) {
  const dir = await mkdtemp(join(tmpdir(), `arc-${name}-`))
  const outfile = join(dir, "index.js")
  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node24",
    sourcemap: false,
    minify: false
  })
  const zip = join(dir, "function.zip")
  const zipped = spawnSync("zip", ["-q", zip, "index.js"], { cwd: dir, stdio: "inherit" })
  if (zipped.status !== 0) throw new Error(`zip failed for ${name}`)
  return readFile(zip)
}

const apiZip = await bundleAndZip(new URL("./lambda-api.mjs", import.meta.url).pathname, "api")
const consumerZip = await bundleAndZip(new URL("./lambda-consumer.mjs", import.meta.url).pathname, "consumer")
const role = "arn:aws:iam::000000000000:role/arc-lambda"

const apiFunction = await lambda.send(new CreateFunctionCommand({
  FunctionName: apiFunctionName,
  Runtime: "nodejs24.x",
  Handler: "index.handler",
  Role: role,
  Code: { ZipFile: apiZip },
  Timeout: 15,
  Environment: {
    Variables: {
      FLOCI_ENDPOINT: lambdaEndpoint,
      JOBS_QUEUE_URL: queueUrl.replace("127.0.0.1", "floci").replace("localhost", "floci")
    }
  }
}))
assert.ok(apiFunction.FunctionArn)

const consumerFunction = await lambda.send(new CreateFunctionCommand({
  FunctionName: consumerFunctionName,
  Runtime: "nodejs24.x",
  Handler: "index.handler",
  Role: role,
  Code: { ZipFile: consumerZip },
  Timeout: 15,
  Environment: {
    Variables: {
      FLOCI_ENDPOINT: lambdaEndpoint,
      IDEMPOTENCY_TABLE: tableName,
      DELIVERY_BUCKET: bucket
    }
  }
}))
assert.ok(consumerFunction.FunctionArn)

for (const name of [apiFunctionName, consumerFunctionName]) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const state = (await lambda.send(new GetFunctionCommand({ FunctionName: name }))).Configuration?.State
      if (!state || state === "Active") break
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
}

await lambda.send(new CreateEventSourceMappingCommand({
  FunctionName: consumerFunctionName,
  EventSourceArn: queueArn,
  BatchSize: 1,
  FunctionResponseTypes: ["ReportBatchItemFailures"],
  Enabled: true
}))

const api = await apigw.send(new CreateApiCommand({
  Name: `arc-http-${suffix}`,
  ProtocolType: "HTTP"
}))
assert.ok(api.ApiId)

const integration = await apigw.send(new CreateIntegrationCommand({
  ApiId: api.ApiId,
  IntegrationType: "AWS_PROXY",
  IntegrationUri: apiFunction.FunctionArn,
  PayloadFormatVersion: "2.0"
}))
assert.ok(integration.IntegrationId)

await apigw.send(new CreateRouteCommand({
  ApiId: api.ApiId,
  RouteKey: "POST /notification-jobs",
  Target: `integrations/${integration.IntegrationId}`
}))
await apigw.send(new CreateStageCommand({
  ApiId: api.ApiId,
  StageName: "prod",
  AutoDeploy: true
}))

const message = `floci-e2e-${suffix}`
const response = await fetch(`${hostEndpoint}/execute-api/${api.ApiId}/prod/notification-jobs`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ message })
})

const responseText = await response.text()
assert.equal(response.status, 200, `API Gateway/Lambda response: ${response.status} ${responseText}`)
const apiResult = JSON.parse(responseText)
assert.equal(typeof apiResult.id, "string")

const key = `deliveries/${Buffer.from(message).toString("base64url")}.json`
let delivered = false

for (let attempt = 0; attempt < 90; attempt += 1) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    delivered = true
    break
  } catch (error) {
    if (error?.name !== "NotFound" && error?.$metadata?.httpStatusCode !== 404) throw error
  }
  await new Promise((resolve) => setTimeout(resolve, 1000))
}

assert.equal(delivered, true, "SQS event source should invoke Arc job consumer and produce delivery marker")

console.log("Floci end-to-end passed: API Gateway v2 -> Lambda -> Arc -> SQS -> Lambda -> Arc Job -> DynamoDB/S3.")
