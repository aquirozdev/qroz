import type { MessageQueue, QueueBatchItem, QueueFeature, QueueSendOptions } from "@arc/queue"

export interface MemoryQueuedMessage<T> {
  readonly body: T
  readonly delaySeconds: number
}

export interface MemoryQueue<T> extends MessageQueue<T> {
  readonly messages: readonly MemoryQueuedMessage<T>[]
  drain(): MemoryQueuedMessage<T>[]
}

export function createMemoryQueue<T>(): MemoryQueue<T> {
  const messages: MemoryQueuedMessage<T>[] = []
  const features: ReadonlySet<QueueFeature> = new Set<QueueFeature>(["batch", "delay"])

  const push = (body: T, options: QueueSendOptions = {}) => {
    messages.push({ body, delaySeconds: options.delaySeconds ?? 0 })
  }

  return {
    features,
    get messages() { return messages },
    async send(body, options = {}) { push(body, options) },
    async sendBatch(items: readonly QueueBatchItem<T>[]) {
      for (const item of items) push(item.body, item.delaySeconds === undefined ? {} : { delaySeconds: item.delaySeconds })
    },
    drain() { return messages.splice(0) },
    native() { return messages }
  }
}
