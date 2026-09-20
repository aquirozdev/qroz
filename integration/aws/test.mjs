import assert from "node:assert/strict"

import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3"
import {
  CreateQueueCommand,
  GetQueueUrlCommand,
  ReceiveMessageCommand,
  SendMessageBatchCommand,
  SendMessageCommand,
  SQSClient
} from "@aws-sdk/client-sqs"
import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient
} from "@aws-sdk/client-dynamodb"
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand
} from "@aws-sdk/lib-dynamodb"

import { createS3Storage } from "../../packages/storage-s3/dist/index.js"
import { probeStorageContract } from "../../packages/storage/dist/index.js"
import { createSqsQueue } from "../../packages/queue-sqs/dist/index.js"
import { createDynamoDbIdempotencyStore } from "../../packages/idempotency-dynamodb/dist/index.js"

const endpoint = process.env.AWS_ENDPOINT ?? "http://127.0.0.1:4566"
const region = "us-east-1"
const credentials = { accessKeyId: "test", secretAccessKey: "test" }

const s3 = new S3Client({ region, endpoint, forcePathStyle: true, credentials })
const sqs = new SQSClient({ region, endpoint, credentials })
const ddb = new DynamoDBClient({ region, endpoint, credentials })
const document = DynamoDBDocumentClient.from(ddb)

const bucket = `qroz-${Date.now()}`
await s3.send(new CreateBucketCommand({ Bucket: bucket }))

const storage = createS3Storage({
  async putObject(input) {
    const result = await s3.send(new PutObjectCommand(input))
    return { ETag: result.ETag }
  },
  async getObject(input) {
    try {
      const result = await s3.send(new GetObjectCommand(input))
      const body = result.Body?.transformToWebStream
        ? result.Body.transformToWebStream()
        : undefined
      return {
        ...(body ? { Body: body } : {}),
        ...(result.ContentLength === undefined ? {} : { ContentLength: result.ContentLength }),
        ...(result.ETag === undefined ? {} : { ETag: result.ETag }),
        ...(result.ContentType === undefined ? {} : { ContentType: result.ContentType }),
        ...(result.Metadata === undefined ? {} : { Metadata: result.Metadata })
      }
    } catch (error) {
      if (error?.name === "NoSuchKey" || error?.$metadata?.httpStatusCode === 404) return null
      throw error
    }
  },
  async headObject(input) {
    try {
      const result = await s3.send(new HeadObjectCommand(input))
      return {
        ...(result.ContentLength === undefined ? {} : { ContentLength: result.ContentLength }),
        ...(result.ETag === undefined ? {} : { ETag: result.ETag }),
        ...(result.ContentType === undefined ? {} : { ContentType: result.ContentType }),
        ...(result.Metadata === undefined ? {} : { Metadata: result.Metadata })
      }
    } catch (error) {
      if (error?.name === "NotFound" || error?.$metadata?.httpStatusCode === 404) return null
      throw error
    }
  },
  async deleteObject(input) {
    await s3.send(new DeleteObjectCommand(input))
  }
}, bucket)

assert.deepEqual(await probeStorageContract(storage), {
  put: true,
  get: true,
  head: true,
  delete: true
})

const queueName = `qroz-${Date.now()}`
await sqs.send(new CreateQueueCommand({ QueueName: queueName }))
const queueUrl = (await sqs.send(new GetQueueUrlCommand({ QueueName: queueName }))).QueueUrl
assert.ok(queueUrl)

const queue = createSqsQueue({
  async sendMessage(input) {
    return sqs.send(new SendMessageCommand(input))
  },
  async sendMessageBatch(input) {
    return sqs.send(new SendMessageBatchCommand(input))
  }
}, { queueUrl })

await queue.send({ kind: "single" })
await queue.sendBatch(Array.from({ length: 12 }, (_, index) => ({ body: { kind: "batch", index } })))

let received = 0
for (let attempt = 0; attempt < 5 && received < 13; attempt += 1) {
  const result = await sqs.send(new ReceiveMessageCommand({
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 1
  }))
  received += result.Messages?.length ?? 0
}
assert.ok(received > 0, "SQS integration should receive messages sent through Qroz adapter")

const tableName = `qroz-idempotency-${Date.now()}`
await ddb.send(new CreateTableCommand({
  TableName: tableName,
  BillingMode: "PAY_PER_REQUEST",
  AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
  KeySchema: [{ AttributeName: "id", KeyType: "HASH" }]
}))

for (let attempt = 0; attempt < 20; attempt += 1) {
  const status = (await ddb.send(new DescribeTableCommand({ TableName: tableName }))).Table?.TableStatus
  if (status === "ACTIVE") break
  await new Promise((resolve) => setTimeout(resolve, 250))
}

const operations = {
  isConditionalCheckFailed(error) {
    return error?.name === "ConditionalCheckFailedException"
  },
  async put(input) {
    await document.send(new PutCommand(input))
  },
  async get(input) {
    return document.send(new GetCommand(input))
  },
  async update(input) {
    await document.send(new UpdateCommand(input))
  },
  async delete(input) {
    await document.send(new DeleteCommand(input))
  }
}

let tokenSequence = 0
let now = Date.now()
const idempotency = createDynamoDbIdempotencyStore(operations, {
  tableName,
  now: () => now,
  token: () => `token-${++tokenSequence}`
})

assert.deepEqual(await idempotency.claim("job:1", { leaseSeconds: 10 }), {
  acquired: true,
  token: "token-1"
})
assert.equal(await idempotency.complete("job:1", "token-1", { ttlSeconds: 1 }), true)
assert.deepEqual(await idempotency.claim("job:1", { leaseSeconds: 10 }), {
  acquired: false,
  state: "completed"
})
now += 2_000
assert.deepEqual(await idempotency.claim("job:1", { leaseSeconds: 10 }), {
  acquired: true,
  token: "token-3"
})

console.log("AWS SDK + LocalStack integration passed: S3, SQS and DynamoDB idempotency.")
