import type { MessageQueue, QueueBatchItem, QueueFeature, QueueSendOptions } from "@qroz/queue"

export interface CloudflareQueueBindingLike<T> {
  send(body: T, options?: { readonly delaySeconds?: number }): Promise<unknown>
  sendBatch(
    messages: Iterable<{ readonly body: T; readonly delaySeconds?: number }>,
    options?: { readonly delaySeconds?: number }
  ): Promise<unknown>
}

function validateDelay(delaySeconds: number | undefined) {
  if (delaySeconds === undefined) return
  if (!Number.isInteger(delaySeconds) || delaySeconds < 0 || delaySeconds > 86_400) {
    throw new RangeError("Cloudflare Queue delaySeconds must be an integer between 0 and 86400")
  }
}

export function createCloudflareQueue<T>(binding: CloudflareQueueBindingLike<T>): MessageQueue<T> {
  const features: ReadonlySet<QueueFeature> = new Set<QueueFeature>(["batch", "delay"])
  return {
    features,
    async send(body: T, options: QueueSendOptions = {}) {
      validateDelay(options.delaySeconds)
      await binding.send(body, options.delaySeconds === undefined ? undefined : { delaySeconds: options.delaySeconds })
    },
    async sendBatch(items: readonly QueueBatchItem<T>[]) {
      for (const item of items) validateDelay(item.delaySeconds)
      await binding.sendBatch(items.map((item) => ({
        body: item.body,
        ...(item.delaySeconds === undefined ? {} : { delaySeconds: item.delaySeconds })
      })))
    },
    native() { return binding }
  }
}
