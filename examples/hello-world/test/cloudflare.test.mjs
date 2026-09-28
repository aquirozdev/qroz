import test from "node:test"
import assert from "node:assert/strict"
import { app, capability, endpoint, module, provide } from "@qroz/core"
import { createCloudflareWorker } from "@qroz/runtime-cloudflare"
import application from "../dist/app.js"
import { object, string } from "../dist/schema.js"

function executionContext() {
  const promises = []
  return {
    promises,
    waitUntil(promise) { promises.push(promise) },
    passThroughOnException() {}
  }
}

test("Cloudflare adapter executes the same application without domain changes", async () => {
  const worker = createCloudflareWorker(application)
  const response = await worker.fetch(
    new Request("https://app.test/users/123"),
    {},
    executionContext()
  )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { id: "123", name: "Angel" })
})

test("Cloudflare env can supply request-scoped capability providers", async () => {
  const greeting = capability("example.greeting")
  const Output = object({ message: string() })
  const hello = endpoint({
    method: "GET",
    path: "/hello",
    requires: [greeting],
    output: Output,
    handler(ctx) {
      return { message: ctx.use(greeting) }
    }
  })
  const portableApp = app({
    name: "cloudflare-bindings",
    modules: [module({ name: "hello", endpoints: { hello } })]
  })

  const worker = createCloudflareWorker(portableApp, {
    providers(env) {
      return [provide(greeting, env.GREETING)]
    }
  })

  const response = await worker.fetch(
    new Request("https://app.test/hello"),
    { GREETING: "hola desde binding" },
    executionContext()
  )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { message: "hola desde binding" })
})

test("Cloudflare adapter fails closed when a runtime capability is not supplied", async () => {
  const secret = capability("example.secret")
  const Output = object({ value: string() })
  const read = endpoint({
    method: "GET",
    path: "/secret",
    requires: [secret],
    output: Output,
    handler(ctx) { return { value: ctx.use(secret) } }
  })
  const portableApp = app({
    name: "missing-binding",
    modules: [module({ name: "secret", endpoints: { read } })]
  })
  let captured
  const worker = createCloudflareWorker(portableApp, {
    onError(error) { captured = error }
  })

  const response = await worker.fetch(
    new Request("https://app.test/secret"),
    {},
    executionContext()
  )

  assert.equal(response.status, 500)
  assert.equal(captured.code, "QROZ1004")
})

function fakeR2Bucket() {
  const objects = new Map()
  let version = 0
  const toBytes = async (value) => {
    if (typeof value === "string") return new TextEncoder().encode(value)
    if (value instanceof Uint8Array) return value.slice()
    if (value instanceof ArrayBuffer) return new Uint8Array(value.slice(0))
    if (value instanceof Blob) return new Uint8Array(await value.arrayBuffer())
    return new Uint8Array(await new Response(value).arrayBuffer())
  }
  const make = (key, entry, body) => ({
    key,
    size: entry.bytes.byteLength,
    etag: entry.etag,
    httpMetadata: entry.httpMetadata,
    customMetadata: entry.customMetadata,
    ...(body ? { body: new ReadableStream({ start(c) { c.enqueue(entry.bytes.slice()); c.close() } }) } : {})
  })
  return {
    async get(key) { const entry = objects.get(key); return entry ? make(key, entry, true) : null },
    async head(key) { const entry = objects.get(key); return entry ? make(key, entry, false) : null },
    async put(key, value, options = {}) {
      const entry = { bytes: await toBytes(value), etag: `r2-${++version}`, ...options }
      objects.set(key, entry)
      return make(key, entry, false)
    },
    async delete(key) { objects.delete(key) }
  }
}

test("deployable Cloudflare composition resolves R2 from env", async () => {
  const worker = (await import("../dist/worker.js")).default
  const queued = []
  const env = {
    FILES: fakeR2Bucket(),
    NOTIFICATIONS: {
      async send(body, options) { queued.push({ body, options }) },
      async sendBatch(items) { for (const item of items) queued.push(item) }
    }
  }
  const ctx = executionContext()

  const write = await worker.fetch(new Request("https://app.test/files", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key: "cloud.txt", content: "r2" })
  }), env, ctx)
  assert.equal(write.status, 201)

  const read = await worker.fetch(new Request("https://app.test/files/cloud.txt"), env, ctx)
  assert.equal(read.status, 200)
  assert.deepEqual(await read.json(), { key: "cloud.txt", content: "r2" })

  const notification = await worker.fetch(new Request("https://app.test/notifications", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "cloud queue" })
  }), env, ctx)
  assert.equal(notification.status, 200)
  assert.equal(queued.length, 1)
  assert.deepEqual(queued[0], { body: { message: "cloud queue" }, options: { delaySeconds: 1 } })
})

test("Cloudflare runtime awaits invocation-scoped async providers", async () => {
  const asyncCapability = capability("async.provider")
  const Output = object({ value: string() })
  const ep = endpoint({
    method: "GET",
    path: "/async-provider",
    requires: [asyncCapability],
    output: Output,
    handler(ctx) { return { value: ctx.use(asyncCapability).value } }
  })
  const definition = app({ name: "async-provider", modules: [module({ name: "test", endpoints: { ep } })] })
  let resolved = false
  const worker = createCloudflareWorker(definition, {
    async providers() {
      await Promise.resolve()
      resolved = true
      return [provide(asyncCapability, { value: "ready" })]
    }
  })
  const response = await worker.fetch(new Request("https://example.test/async-provider"), {}, { waitUntil() {} })
  assert.equal(resolved, true)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { value: "ready" })
})

test("Cloudflare request provider scopes dispose after success and failure", async () => {
  const { providerScope } = await import("@qroz/core")
  const disposable = capability("example.disposable")
  const Output = object({ value: string() })
  const success = endpoint({
    method: "GET",
    path: "/dispose-success",
    requires: [disposable],
    output: Output,
    handler(ctx) { return { value: ctx.use(disposable) } }
  })
  const failure = endpoint({
    method: "GET",
    path: "/dispose-failure",
    requires: [disposable],
    output: Output,
    handler() { throw new Error("boom") }
  })
  const definition = app({ name: "disposal", modules: [module({ name: "scope", endpoints: { success, failure } })] })
  let disposed = 0
  const worker = createCloudflareWorker(definition, {
    providers() {
      return providerScope([provide(disposable, "ready")], async () => { disposed += 1 })
    }
  })

  const ok = await worker.fetch(new Request("https://example.test/dispose-success"), {}, executionContext())
  assert.equal(ok.status, 200)
  assert.equal(disposed, 1)

  const failed = await worker.fetch(new Request("https://example.test/dispose-failure"), {}, executionContext())
  assert.equal(failed.status, 500)
  assert.equal(disposed, 2)
})


test("Cloudflare runtime resolves an authenticated principal per request", async () => {
  const Output = object({ principal: string() })
  const secured = endpoint({
    method: "GET",
    path: "/cloudflare-auth",
    auth: { required: true },
    output: Output,
    handler(ctx) {
      return { principal: ctx.principal.id }
    }
  })
  const definition = app({
    name: "cloudflare-auth",
    modules: [module({ name: "auth", endpoints: { secured } })]
  })
  const worker = createCloudflareWorker(definition, {
    authenticate(request) {
      const principal = request.headers.get("x-test-principal")
      return principal ? { id: principal, type: "test" } : undefined
    }
  })

  const allowed = await worker.fetch(
    new Request("https://app.test/cloudflare-auth", {
      headers: { "x-test-principal": "cf-user" }
    }),
    {},
    executionContext()
  )
  assert.equal(allowed.status, 200)
  assert.deepEqual(await allowed.json(), { principal: "cf-user" })

  const anonymous = await worker.fetch(
    new Request("https://app.test/cloudflare-auth"),
    {},
    executionContext()
  )
  assert.equal(anonymous.status, 401)
})
