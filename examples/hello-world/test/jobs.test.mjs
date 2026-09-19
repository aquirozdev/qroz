import test from "node:test"
import assert from "node:assert/strict"
import { app, capability, job, module, provide } from "@arc/core"
import { queue, provideQueue } from "@arc/queue"
import { createMemoryQueue } from "@arc/queue-memory"
import { createMemoryRuntime } from "@arc/runtime-memory"
import { executeJobEnvelope, NonRetryableJobError, retryDelaySeconds } from "@arc/jobs"
import { runMemoryJobs } from "@arc/jobs-memory"
import { createCloudflareJobConsumer } from "@arc/jobs-cloudflare"
import application, { deliveredNotifications, notificationJobQueueMemory } from "../dist/app.js"

// The example app proves endpoint -> typed job envelope -> memory consumer end-to-end.
test("dispatches and executes a typed job end-to-end", async () => {
  notificationJobQueueMemory.drain()
  deliveredNotifications.splice(0)
  const runtime = createMemoryRuntime(application)
  const response = await runtime.fetch(new Request("https://app.test/notification-jobs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "welcome" })
  }))
  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.equal(typeof payload.id, "string")
  assert.equal(notificationJobQueueMemory.messages.length, 1)
  const envelope = notificationJobQueueMemory.messages[0].body
  assert.equal(envelope.kind, "arc.job-message")
  assert.equal(envelope.job, "notifications.deliver")
  assert.equal(envelope.version, 1)
  assert.equal(envelope.idempotencyKey, "notification:welcome")

  const runs = await runMemoryJobs(application, notificationJobQueueMemory)
  assert.equal(runs.length, 1)
  assert.equal(runs[0].outcome.action, "ack")
  assert.deepEqual(deliveredNotifications, ["welcome"])
})

test("propagates W3C trace context into job envelopes and execution context", async () => {
  notificationJobQueueMemory.drain()
  const runtime = createMemoryRuntime(application)
  const traceparent = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"
  const tracestate = "vendor=value"
  const response = await runtime.fetch(new Request("https://app.test/notification-jobs", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      traceparent,
      tracestate
    },
    body: JSON.stringify({ message: "trace-me" })
  }))
  assert.equal(response.status, 200)
  const queued = notificationJobQueueMemory.messages[0].body
  assert.deepEqual(queued.traceContext, { traceparent, tracestate })

  let observed
  const { definition } = fixture(async (_input, ctx) => { observed = ctx.traceContext })
  const outcome = await executeJobEnvelope(definition, { ...envelope(), traceContext: { traceparent, tracestate } }, {
    providers: [provideQueue(transport, createMemoryQueue()), provide(dependency, {})]
  })
  assert.equal(outcome.action, "ack")
  assert.deepEqual(observed, { traceparent, tracestate })
})

test("rejects invalid W3C traceparent values instead of propagating them", async () => {
  for (const traceparent of [
    "00-00000000000000000000000000000000-00f067aa0ba902b7-01",
    "00-4bf92f3577b34da6a3ce929d0e0e4736-0000000000000000-01",
    "00-4BF92F3577B34DA6A3CE929D0E0E4736-00f067aa0ba902b7-01"
  ]) {
    notificationJobQueueMemory.drain()
    const runtime = createMemoryRuntime(application)
    const response = await runtime.fetch(new Request("https://app.test/notification-jobs", {
      method: "POST",
      headers: { "content-type": "application/json", traceparent },
      body: JSON.stringify({ message: "invalid-trace" })
    }))
    assert.equal(response.status, 200)
    assert.equal(notificationJobQueueMemory.messages[0].body.traceContext, undefined)
  }
})

function schema(validate) {
  return { "~standard": { version: 1, vendor: "test", validate } }
}
const StringInput = schema((value) => typeof value === "string" ? { value } : { issues: [{ message: "Expected string" }] })
const transport = queue("test-jobs", { requires: ["delay"] })
const dependency = capability("jobs.dependency")

function fixture(handler, retry = { strategy: "exponential", delaySeconds: 2, maxDelaySeconds: 10 }) {
  const Task = job({
    name: "test.task",
    version: 1,
    transport,
    input: StringInput,
    requires: [dependency],
    retry,
    handler
  })
  return { Task, definition: app({ name: "jobs-test", modules: [module({ name: "tasks", endpoints: {}, jobs: { Task } })] }) }
}

function envelope(payload = "ok") {
  return { kind: "arc.job-message", schemaVersion: 1, id: "logical-1", job: "test.task", version: 1, payload, createdAt: new Date(0).toISOString() }
}

test("job executor retries failures with exponential backoff", async () => {
  const { Task, definition } = fixture(async () => { throw new Error("temporary") })
  const outcome = await executeJobEnvelope(definition, envelope(), {
    providers: [provideQueue(transport, createMemoryQueue()), provide(dependency, {})],
    attempts: 3
  })
  assert.equal(outcome.action, "retry")
  assert.equal(outcome.delaySeconds, 8)
  assert.equal(retryDelaySeconds(Task, 4), 10)
})

test("non retryable job errors are discarded", async () => {
  const { definition } = fixture(async () => { throw new NonRetryableJobError("bad input") })
  const outcome = await executeJobEnvelope(definition, envelope(), {
    providers: [provideQueue(transport, createMemoryQueue()), provide(dependency, {})]
  })
  assert.deepEqual({ action: outcome.action, reason: outcome.reason }, { action: "discard", reason: "non-retryable" })
})

test("invalid and unknown job messages are poison-safe", async () => {
  const { definition } = fixture(async () => {})
  const providers = [provideQueue(transport, createMemoryQueue()), provide(dependency, {})]
  const invalid = await executeJobEnvelope(definition, { nope: true }, { providers })
  assert.equal(invalid.action, "discard")
  assert.equal(invalid.reason, "invalid-envelope")
  const unknown = await executeJobEnvelope(definition, { ...envelope(), job: "unknown" }, { providers })
  assert.equal(unknown.action, "discard")
  assert.equal(unknown.reason, "unknown-job")
  const invalidPayload = await executeJobEnvelope(definition, envelope(123), { providers })
  assert.equal(invalidPayload.action, "discard")
  assert.equal(invalidPayload.reason, "invalid-payload")
})

test("cloudflare consumer explicitly ack/retries individual messages", async () => {
  let calls = 0
  const { definition } = fixture(async () => {
    calls += 1
    if (calls === 1) throw new Error("temporary")
  })
  const providers = [provideQueue(transport, createMemoryQueue()), provide(dependency, {})]
  const decisions = []
  const makeMessage = (id, attempts) => ({
    id, timestamp: new Date(), body: { ...envelope(), id }, attempts,
    ack() { decisions.push([id, "ack"]) },
    retry(options) { decisions.push([id, "retry", options?.delaySeconds]) }
  })
  const consumer = createCloudflareJobConsumer(definition, { providers: () => providers })
  await consumer.queue({
    queue: "jobs",
    messages: [makeMessage("a", 2), makeMessage("b", 1)],
    ackAll() {}, retryAll() {}
  }, {}, { waitUntil() {} })
  assert.deepEqual(decisions, [["a", "retry", 4], ["b", "ack"]])
})

test("undeclared job dispatch fails so the graph cannot lie", async () => {
  const Task = job({ name: "hidden.task", version: 1, transport, input: StringInput, async handler() {} })
  const Output = { "~standard": { version: 1, vendor: "test", validate(value) { return { value } } } }
  const ep = (await import("@arc/core")).endpoint({
    method: "POST",
    path: "/hidden-job",
    output: Output,
    async handler(ctx) {
      await ctx.jobs.dispatch(Task, "x")
      return { ok: true }
    }
  })
  const definition = app({
    name: "hidden-job",
    providers: [provideQueue(transport, createMemoryQueue())],
    modules: [module({ name: "hidden", endpoints: { ep }, jobs: { Task } })]
  })
  const runtime = createMemoryRuntime(definition)
  let captured
  const instrumented = createMemoryRuntime(definition, { onError(error) { captured = error } })
  const response = await instrumented.fetch(new Request("https://app.test/hidden-job", { method: "POST" }))
  assert.equal(response.status, 500)
  assert.equal(captured?.code, "ARC1009")
})

test("duplicate job name/version pairs fail at build time", async () => {
  const { buildApplication } = await import("@arc/core")
  const One = job({ name: "same.job", version: 1, transport, input: StringInput, async handler() {} })
  const Two = job({ name: "same.job", version: 1, transport, input: StringInput, async handler() {} })
  const definition = app({
    name: "dupe-jobs",
    providers: [provideQueue(transport, createMemoryQueue())],
    modules: [
      module({ name: "a", endpoints: {}, jobs: { One } }),
      module({ name: "b", endpoints: {}, jobs: { Two } })
    ]
  })
  assert.throws(() => buildApplication(definition), (error) => error.code === "ARC1008")
})

test("Cloudflare job consumer disposes invocation provider scopes", async () => {
  const { providerScope } = await import("@arc/core")
  const { definition } = fixture(async () => {})
  let disposed = 0
  const providers = [provideQueue(transport, createMemoryQueue()), provide(dependency, {})]
  const consumer = createCloudflareJobConsumer(definition, {
    providers: () => providerScope(providers, async () => { disposed += 1 })
  })
  const decisions = []
  const message = {
    id: "scope", timestamp: new Date(), body: envelope(), attempts: 1,
    ack() { decisions.push("ack") },
    retry() { decisions.push("retry") }
  }
  await consumer.queue({ queue: "jobs", messages: [message], ackAll() {}, retryAll() {} }, {}, { waitUntil() {} })
  assert.deepEqual(decisions, ["ack"])
  assert.equal(disposed, 1)
})
