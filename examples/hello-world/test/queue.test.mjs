import test from "node:test"
import assert from "node:assert/strict"
import { probeQueueProducerContract, provideQueue, queue } from "@arc/queue"
import { createMemoryQueue } from "@arc/queue-memory"
import { createCloudflareQueue } from "@arc/queue-cloudflare"

function fakeCloudflareBinding() {
  const sent = []
  return {
    sent,
    async send(body, options) { sent.push({ body, options }) },
    async sendBatch(messages) { for (const item of messages) sent.push(item) }
  }
}

test("memory queue satisfies the producer contract", async () => {
  const implementation = createMemoryQueue()
  assert.deepEqual(await probeQueueProducerContract(implementation, { id: 1 }), {
    send: true,
    batch: true,
    delay: true
  })
  assert.equal(implementation.messages.length, 4)
})

test("Cloudflare queue adapter satisfies the same producer contract", async () => {
  const binding = fakeCloudflareBinding()
  const implementation = createCloudflareQueue(binding)
  assert.deepEqual(await probeQueueProducerContract(implementation, { id: 1 }), {
    send: true,
    batch: true,
    delay: true
  })
  assert.equal(binding.sent.length, 4)
})

test("queue capabilities reject providers that lack required features", () => {
  const delayed = queue("delayed", { requires: ["delay"] })
  const implementation = {
    features: new Set(),
    async send() {},
    async sendBatch() {}
  }
  assert.throws(() => provideQueue(delayed, implementation), /unsupported feature/)
})

test("Cloudflare adapter validates the documented delay boundary", async () => {
  const implementation = createCloudflareQueue(fakeCloudflareBinding())
  await assert.rejects(() => implementation.send({ id: 1 }, { delaySeconds: 86_401 }), RangeError)
})
