import test from "node:test"
import assert from "node:assert/strict"
import { createMemoryRuntime } from "@arc/runtime-memory"
import { createRecordingTracer } from "@arc/telemetry"
import application from "../dist/app.js"

test("portable runtime emits semantic endpoint and listener spans", async () => {
  const tracer = createRecordingTracer()
  const runtime = createMemoryRuntime(application, { tracer })
  const response = await runtime.fetch(new Request("https://app.test/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Trace User" })
  }))
  assert.equal(response.status, 201)
  const names = tracer.spans.map((span) => span.name)
  assert.deepEqual(names, ["arc.endpoint", "arc.listener"])
  assert.equal(tracer.spans[0].attributes["arc.module"], "users")
  assert.equal(tracer.spans[0].attributes["http.route"], "/users")
  assert.equal(tracer.spans[1].attributes["arc.event"], "user.created")
})

test("Cloudflare tracing adapter maps Arc attributes to native spans", async () => {
  const attributes = {}
  const executionCtx = {
    waitUntil() {},
    tracing: {
      async enterSpan(_name, callback) {
        return callback({ setAttribute(name, value) { attributes[name] = value } })
      }
    }
  }
  const { default: worker } = await import("../dist/worker.js")
  const r2 = { async put(){}, async get(){ return null }, async head(){ return null }, async delete(){} }
  const queue = { async send(){}, async sendBatch(){} }
  const response = await worker.fetch(new Request("https://app.test/files/missing"), { FILES: r2, NOTIFICATIONS: queue, JOBS: queue }, executionCtx)
  assert.equal(response.status, 200)
  assert.equal(attributes["arc.module"], "files")
  assert.equal(attributes["arc.endpoint"], "getFile")
})
