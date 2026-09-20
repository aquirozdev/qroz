import type { MessageQueue, QueueBatchItem, QueueFeature, QueueSendOptions } from "@arc/queue"

export interface SqsSendMessageInput {
  readonly QueueUrl: string
  readonly MessageBody: string
  readonly DelaySeconds?: number
}

export interface SqsBatchEntry {
  readonly Id: string
  readonly MessageBody: string
  readonly DelaySeconds?: number
}

export interface SqsSendMessageBatchInput {
  readonly QueueUrl: string
  readonly Entries: readonly SqsBatchEntry[]
}

export interface SqsBatchResult {
  readonly Failed?: readonly { readonly Id?: string; readonly Code?: string; readonly Message?: string; readonly SenderFault?: boolean }[]
}

export interface SqsOperations {
  sendMessage(input: SqsSendMessageInput): Promise<unknown>
  sendMessageBatch(input: SqsSendMessageBatchInput): Promise<SqsBatchResult>
}

export interface SqsQueueOptions {
  readonly queueUrl: string
  readonly fifo?: boolean
}

function validateDelay(delaySeconds: number | undefined, fifo: boolean) {
  if (delaySeconds === undefined) return
  if (fifo) {
    throw new RangeError("SQS FIFO queues do not support per-message DelaySeconds")
  }
  if (!Number.isInteger(delaySeconds) || delaySeconds < 0 || delaySeconds > 900) {
    throw new RangeError("SQS DelaySeconds must be an integer between 0 and 900")
  }
}

export function createSqsQueue<T>(operations: SqsOperations, options: SqsQueueOptions): MessageQueue<T> {
  const features: ReadonlySet<QueueFeature> = options.fifo
    ? new Set<QueueFeature>(["batch"])
    : new Set<QueueFeature>(["batch", "delay"])

  return {
    features,

    async send(body: T, sendOptions: QueueSendOptions = {}) {
      validateDelay(sendOptions.delaySeconds, options.fifo ?? false)
      await operations.sendMessage({
        QueueUrl: options.queueUrl,
        MessageBody: JSON.stringify(body),
        ...(sendOptions.delaySeconds === undefined ? {} : { DelaySeconds: sendOptions.delaySeconds })
      })
    },

    async sendBatch(items: readonly QueueBatchItem<T>[]) {
      for (const item of items) validateDelay(item.delaySeconds, options.fifo ?? false)

      for (let offset = 0; offset < items.length; offset += 10) {
        const batch = items.slice(offset, offset + 10)
        const result = await operations.sendMessageBatch({
          QueueUrl: options.queueUrl,
          Entries: batch.map((item, index) => ({
            Id: String(offset + index),
            MessageBody: JSON.stringify(item.body),
            ...(item.delaySeconds === undefined ? {} : { DelaySeconds: item.delaySeconds })
          }))
        })
        if (result.Failed?.length) {
          const details = result.Failed.map((failure) => `${failure.Id ?? "?"}:${failure.Code ?? "unknown"}`).join(", ")
          throw new Error(`SQS batch send reported failed entries: ${details}`)
        }
      }
    },

    native() {
      return operations
    }
  }
}
