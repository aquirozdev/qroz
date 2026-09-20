import { SQSClient, SendMessageCommand, SendMessageBatchCommand } from "@aws-sdk/client-sqs"

import { provideQueue } from "../../packages/queue/src/index.ts"
import { createSqsQueue } from "../../packages/queue-sqs/src/index.ts"
import { createAwsLambdaHandler } from "../../packages/runtime-aws/src/index.ts"
import { application } from "../../examples/hello-world/src/app.ts"
import { notificationJobsQueue } from "../../examples/hello-world/src/notifications.ts"

const endpoint = process.env.FLOCI_ENDPOINT
const region = process.env.AWS_REGION ?? "us-east-1"
const credentials = { accessKeyId: "test", secretAccessKey: "test" }

const sqs = new SQSClient({
  region,
  ...(endpoint ? { endpoint } : {}),
  credentials
})

const queue = createSqsQueue({
  async sendMessage(input) {
    return sqs.send(new SendMessageCommand(input))
  },
  async sendMessageBatch(input) {
    return sqs.send(new SendMessageBatchCommand(input))
  }
}, {
  queueUrl: process.env.JOBS_QUEUE_URL
})

export const handler = createAwsLambdaHandler(application, {
  providers() {
    return [
      provideQueue(notificationJobsQueue, queue)
    ]
  }
})
