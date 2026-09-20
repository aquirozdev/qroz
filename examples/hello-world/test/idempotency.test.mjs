import test from "node:test"
import assert from "node:assert/strict"
import { app, job, module } from "@qroz/core"
import { queue, provideQueue } from "@qroz/queue"
import { createMemoryQueue } from "@qroz/queue-memory"
import { idempotencyStore, provideIdempotencyStore } from "@qroz/idempotency"
import { createMemoryIdempotencyStore } from "@qroz/idempotency-memory"
import { ArcIdempotencyDurableObjectLogic, createDurableObjectIdempotencyStore } from "@qroz/idempotency-cloudflare-do"
import { executeJobEnvelope } from "@qroz/jobs"

function schema(validate) {
  return { "~standard": { version: 1, vendor: "test", validate } }
}
const Input = schema((value) => typeof value === "string" ? { value } : { issues: [{ message: "Expected string" }] })
const transport = queue("idempotency-jobs", { requires: ["delay"] })
const dedupe = idempotencyStore("idempotency.jobs")

function definition(handler, store = dedupe) {
  const Task = job({
    name: "idempotency.task",
    version: 1,
    transport,
    input: Input,
    idempotency: {
      store,
      leaseSeconds: 30,
      ttlSeconds: 3600,
      key: (input) => `task:${input}`
    },
    handler
  })
  return {
    Task,
    application: app({ name: "idempotency-test", modules: [module({ name: "tasks", endpoints: {}, jobs: { Task } })] })
  }
}

function envelope(id = "message-1", payload = "same") {
  return {
    kind: "qroz.job-message",
    schemaVersion: 1,
    id,
    job: "idempotency.task",
    version: 1,
    payload,
    createdAt: new Date(0).toISOString(),
    idempotencyKey: `task:${payload}`
  }
}

test("memory idempotency store provides atomic lease and completion semantics", async () => {
  let now = 1_000
  const store = createMemoryIdempotencyStore(() => now)
  const first = await store.claim("x", { leaseSeconds: 10 })
  assert.equal(first.acquired, true)
  const concurrent = await store.claim("x", { leaseSeconds: 10 })
  assert.deepEqual(concurrent, { acquired: false, state: "processing", retryAfterSeconds: 10 })
  assert.equal(await store.complete("x", first.token, { ttlSeconds: 60 }), true)
  assert.deepEqual(await store.claim("x", { leaseSeconds: 10 }), { acquired: false, state: "completed" })
  now += 61_000
  assert.equal((await store.claim("x", { leaseSeconds: 10 })).acquired, true)
})

test("job executor acknowledges completed duplicates without re-running the handler", async () => {
  let calls = 0
  const store = createMemoryIdempotencyStore()
  const { application } = definition(async () => { calls += 1 })
  const providers = [provideQueue(transport, createMemoryQueue()), provideIdempotencyStore(dedupe, store)]

  const first = await executeJobEnvelope(application, envelope("a"), { providers })
  const duplicate = await executeJobEnvelope(application, envelope("b"), { providers })
  assert.equal(first.action, "ack")
  assert.deepEqual(duplicate, { action: "ack", job: "idempotency.task", version: 1, duplicate: true })
  assert.equal(calls, 1)
})

test("active idempotency leases defer concurrent delivery", async () => {
  const store = createMemoryIdempotencyStore()
  const claim = await store.claim("task:same", { leaseSeconds: 12 })
  assert.equal(claim.acquired, true)
  const { application } = definition(async () => assert.fail("handler must not run while another lease is active"))
  const providers = [provideQueue(transport, createMemoryQueue()), provideIdempotencyStore(dedupe, store)]
  const outcome = await executeJobEnvelope(application, envelope(), { providers })
  assert.equal(outcome.action, "retry")
  assert.equal(outcome.reason, "idempotency-in-progress")
  assert.ok((outcome.delaySeconds ?? 0) >= 1)
})

test("failed jobs release the claim so a later retry can execute", async () => {
  let calls = 0
  const store = createMemoryIdempotencyStore()
  const { application } = definition(async () => {
    calls += 1
    if (calls === 1) throw new Error("temporary")
  })
  const providers = [provideQueue(transport, createMemoryQueue()), provideIdempotencyStore(dedupe, store)]
  const first = await executeJobEnvelope(application, envelope(), { providers })
  const second = await executeJobEnvelope(application, envelope(), { providers })
  assert.equal(first.action, "retry")
  assert.equal(second.action, "ack")
  assert.equal(calls, 2)
})

test("Cloudflare Durable Object adapter implements the same claim lifecycle structurally", async () => {
  const map = new Map()
  const logic = new ArcIdempotencyDurableObjectLogic({
    storage: {
      kv: {
        get(key) { return map.get(key) },
        put(key, value) { map.set(key, value) },
        delete(key) { return map.delete(key) }
      }
    }
  })
  const namespace = {
    getByName() {
      return { fetch: (input, init) => logic.fetch(new Request(input, init)) }
    }
  }
  const store = createDurableObjectIdempotencyStore(namespace)
  const first = await store.claim("do-key", { leaseSeconds: 30 })
  assert.equal(first.acquired, true)
  assert.equal(await store.complete("do-key", first.token, { ttlSeconds: 60 }), true)
  assert.deepEqual(await store.claim("do-key", { leaseSeconds: 30 }), { acquired: false, state: "completed" })
})
