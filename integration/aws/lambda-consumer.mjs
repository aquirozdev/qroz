import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

import { provide } from "../../packages/core/src/index.ts"
import { provideIdempotencyStore } from "../../packages/idempotency/src/index.ts"
import { createDynamoDbIdempotencyStore } from "../../packages/idempotency-dynamodb/src/index.ts"
import { createAwsSqsJobConsumer } from "../../packages/jobs-aws-sqs/src/index.ts"
import { application } from "../../examples/hello-world/src/app.ts"
import { notificationDeliverySink, notificationIdempotency } from "../../examples/hello-world/src/notifications.ts"

const endpoint = process.env.FLOCI_ENDPOINT
const region = process.env.AWS_REGION ?? "us-east-1"
const credentials = { accessKeyId: "test", secretAccessKey: "test" }

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({
  region,
  ...(endpoint ? { endpoint } : {}),
  credentials
}))

const s3 = new S3Client({
  region,
  ...(endpoint ? { endpoint } : {}),
  forcePathStyle: Boolean(endpoint),
  credentials
})

const idempotency = createDynamoDbIdempotencyStore({
  isConditionalCheckFailed(error) {
    return error?.name === "ConditionalCheckFailedException"
  },
  async put(input) {
    await dynamo.send(new PutCommand(input))
  },
  async get(input) {
    return dynamo.send(new GetCommand(input))
  },
  async update(input) {
    await dynamo.send(new UpdateCommand(input))
  },
  async delete(input) {
    await dynamo.send(new DeleteCommand(input))
  }
}, {
  tableName: process.env.IDEMPOTENCY_TABLE
})

const delivery = {
  async deliver(message) {
    const safe = Buffer.from(message).toString("base64url")
    await s3.send(new PutObjectCommand({
      Bucket: process.env.DELIVERY_BUCKET,
      Key: `deliveries/${safe}.json`,
      Body: JSON.stringify({
        message,
        deliveredAt: new Date().toISOString()
      }),
      ContentType: "application/json"
    }))
  }
}

export const handler = createAwsSqsJobConsumer(application, {
  providers() {
    return [
      provideIdempotencyStore(notificationIdempotency, idempotency),
      provide(notificationDeliverySink, delivery)
    ]
  }
})
