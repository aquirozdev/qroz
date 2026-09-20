import { capability, provide, type Capability, type Provider } from "@arc/core"

export type QueueFeature = "batch" | "delay"

export interface QueueSendOptions {
  readonly delaySeconds?: number
}

export interface QueueBatchItem<T> {
  readonly body: T
  readonly delaySeconds?: number
}

export interface MessageQueue<T> {
  readonly features: ReadonlySet<QueueFeature>
  send(body: T, options?: QueueSendOptions): Promise<void>
  sendBatch(items: readonly QueueBatchItem<T>[]): Promise<void>
  native?(): unknown
}

export type QueueAccess = "publish"

export interface QueueCapability<T> extends Capability<MessageQueue<T>, QueueAccess> {
  readonly requiredFeatures: readonly QueueFeature[]
}

export function queue<T>(name: string, options: { requires?: readonly QueueFeature[] } = {}): QueueCapability<T> {
  const requiredFeatures = Object.freeze([...(options.requires ?? [])])
  return Object.freeze({
    ...capability<MessageQueue<T>, QueueAccess>(`queue.${name}`, {
      kind: "resource",
      resourceType: "message-queue",
      features: ["send", ...requiredFeatures],
      operationMethods: {
        publish: ["send", "sendBatch"]
      }
    }),
    requiredFeatures
  })
}

export function provideQueue<T>(target: QueueCapability<T>, implementation: MessageQueue<T>): Provider<MessageQueue<T>> {
  const missing = target.requiredFeatures.filter((feature) => !implementation.features.has(feature))
  if (missing.length) {
    throw new Error(`Queue '${target.name}' requires unsupported feature(s): ${missing.join(", ")}`)
  }
  return provide(target, implementation)
}

export async function probeQueueProducerContract<T>(
  implementation: MessageQueue<T>,
  sample: T
): Promise<{ send: true; batch: true; delay: boolean }> {
  await implementation.send(sample)
  if (implementation.features.has("batch")) {
    await implementation.sendBatch([{ body: sample }, { body: sample }])
  }
  if (implementation.features.has("delay")) {
    await implementation.send(sample, { delaySeconds: 1 })
  }
  return { send: true, batch: implementation.features.has("batch") as true, delay: implementation.features.has("delay") }
}
