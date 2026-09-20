import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import {
  access,
  app,
  buildApplication,
  capability,
  endpoint,
  inspect,
  module,
  provide
} from "@arc/core"
import { createTestRuntime, probeRuntimeContract } from "@arc/testing"
import application, { auditEntries } from "../dist/app.js"
import { object, string } from "../dist/schema.js"

function runtime() {
  return createTestRuntime(application)
}

test("handles a typed route param and resolves a capability", async () => {
  const response = await runtime().fetch(new Request("https://app.test/users/123"))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { id: "123", name: "Angel" })
})

test("validates request bodies with structured issues", async () => {
  const response = await runtime().fetch(new Request("https://app.test/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "" })
  }))
  assert.equal(response.status, 400)
  const payload = await response.json()
  assert.equal(payload.error, "Validation failed")
  assert.deepEqual(payload.issues[0].path, ["name"])
})

test("rejects malformed JSON", async () => {
  const response = await runtime().fetch(new Request("https://app.test/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{bad"
  }))
  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: "Request body contains invalid JSON", code: "ARC2001" })
})

test("creates users, publishes an event, and executes listeners", async () => {
  const before = auditEntries.length
  const response = await runtime().fetch(new Request("https://app.test/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Alice" })
  }))
  assert.equal(response.status, 201)
  const user = await response.json()
  assert.match(user.id, /^generated-/)
  assert.equal(user.name, "Alice")
  assert.equal(auditEntries.length, before + 1)
  assert.equal(auditEntries.at(-1), `user.created:${user.id}:Alice`)

  const read = await runtime().fetch(new Request(`https://app.test/users/${user.id}`))
  assert.deepEqual(await read.json(), user)
})

test("validates and types query input", async () => {
  const response = await runtime().fetch(new Request("https://app.test/users?q=ang"))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { count: "1", query: "ang" })
})

test("uses a resource capability through a real endpoint", async () => {
  const write = await runtime().fetch(new Request("https://app.test/files", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key: "hello.txt", content: "hola" })
  }))
  assert.equal(write.status, 201)
  assert.deepEqual(await write.json(), { key: "hello.txt", content: "hola" })

  const read = await runtime().fetch(new Request("https://app.test/files/hello.txt"))
  assert.equal(read.status, 200)
  assert.deepEqual(await read.json(), { key: "hello.txt", content: "hola" })
})

test("sends work through a queue resource capability", async () => {
  const response = await runtime().fetch(new Request("https://app.test/notifications", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "hello queue" })
  }))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { queued: "yes" })
})

test("returns 404 for unknown routes", async () => {
  const response = await runtime().fetch(new Request("https://app.test/missing"))
  assert.equal(response.status, 404)
})

test("returns 405 and Allow for a known path with wrong method", async () => {
  const response = await runtime().fetch(new Request("https://app.test/users/123", { method: "POST" }))
  assert.equal(response.status, 405)
  assert.equal(response.headers.get("allow"), "GET")
})

test("runtime passes the portable contract probe", async () => {
  assert.deepEqual(await probeRuntimeContract(runtime()), { notFound: true, methodNotAllowed: true })
})

test("produces a deterministic semantic application graph including resources and events", () => {
  const expected = JSON.parse(readFileSync(new URL("./expected-graph.json", import.meta.url), "utf8"))
  assert.deepEqual(inspect(application), expected)
})

test("fails at build time when a required capability is missing", () => {
  const missing = capability("missing")
  const Output = object({ ok: string() })
  const ep = endpoint({
    method: "GET",
    path: "/broken",
    requires: [missing],
    output: Output,
    handler() { return { ok: "yes" } }
  })
  const broken = app({ name: "broken", modules: [module({ name: "broken", endpoints: { ep } })] })
  assert.throws(() => buildApplication(broken), (error) => error.code === "ARC1004")
})

test("rejects duplicate routes before runtime", () => {
  const dep = capability("dep")
  const Output = object({ ok: string() })
  const one = endpoint({ method: "GET", path: "/same", requires: [dep], output: Output, handler() { return { ok: "1" } } })
  const two = endpoint({ method: "GET", path: "/same", requires: [dep], output: Output, handler() { return { ok: "2" } } })
  const duplicate = app({
    name: "duplicate",
    providers: [provide(dep, {})],
    modules: [
      module({ name: "one", endpoints: { one } }),
      module({ name: "two", endpoints: { two } })
    ]
  })
  assert.throws(() => buildApplication(duplicate), (error) => error.code === "ARC1002")
})

test("prevents undeclared capability usage so the graph cannot lie", async () => {
  const visible = capability("visible")
  const hidden = capability("hidden")
  const Output = object({ ok: string() })
  let captured
  const sneaky = endpoint({
    method: "GET",
    path: "/sneaky",
    requires: [visible],
    output: Output,
    handler(ctx) {
      ctx.use(hidden)
      return { ok: "no" }
    }
  })
  const sneakyApp = app({
    name: "sneaky",
    providers: [provide(visible, {}), provide(hidden, {})],
    modules: [module({ name: "sneaky", endpoints: { sneaky } })]
  })
  const { createMemoryRuntime } = await import("@arc/runtime-memory")
  const response = await createMemoryRuntime(sneakyApp, { onError(error) { captured = error } })
    .fetch(new Request("https://app.test/sneaky"))
  assert.equal(response.status, 500)
  assert.equal(captured.code, "ARC1005")
})

test("treats output schema violations as server errors, not bad client input", async () => {
  const Output = object({ ok: string() })
  let captured
  const bad = endpoint({
    method: "GET",
    path: "/bad-output",
    output: Output,
    handler() { return { ok: 123 } }
  })
  const badApp = app({ name: "bad-output", modules: [module({ name: "bad-output", endpoints: { bad } })] })
  const { createMemoryRuntime } = await import("@arc/runtime-memory")
  const response = await createMemoryRuntime(badApp, { onError(error) { captured = error } })
    .fetch(new Request("https://app.test/bad-output"))
  assert.equal(response.status, 500)
  assert.equal(captured.code, "ARC2002")
})


test("rejects ambiguous capability names so graph identities remain deterministic", () => {
  const first = capability("same.name")
  const second = capability("same.name")
  const Output = object({ ok: string() })
  const one = endpoint({ method: "GET", path: "/one", requires: [first], output: Output, handler() { return { ok: "1" } } })
  const two = endpoint({ method: "GET", path: "/two", requires: [second], output: Output, handler() { return { ok: "2" } } })
  const ambiguous = app({
    name: "ambiguous",
    providers: [provide(first, {}), provide(second, {})],
    modules: [module({ name: "ambiguous", endpoints: { one, two } })]
  })
  assert.throws(() => buildApplication(ambiguous), (error) => error.code === "ARC1006")
})


test("prevents undeclared event emission so the graph remains trustworthy", async () => {
  const Ghost = (await import("@arc/core")).event("ghost", { version: 1 })
  const Output = object({ ok: string() })
  let captured
  const ep = endpoint({
    method: "GET",
    path: "/ghost",
    output: Output,
    async handler(ctx) {
      await ctx.events.emit(Ghost, { any: "payload" })
      return { ok: "no" }
    }
  })
  const ghostApp = app({ name: "ghost", modules: [module({ name: "ghost", endpoints: { ep } })] })
  const { createMemoryRuntime } = await import("@arc/runtime-memory")
  const response = await createMemoryRuntime(ghostApp, { onError(error) { captured = error } })
    .fetch(new Request("https://app.test/ghost"))
  assert.equal(response.status, 500)
  assert.equal(captured.code, "ARC1007")
})


test("enforces operation-level resource access so the graph cannot overstate least privilege", async () => {
  const { createMemoryStorage } = await import("@arc/storage-memory")
  const { storage } = await import("@arc/storage")
  const restrictedStorage = storage("restricted")
  const Output = object({ ok: string() })
  let captured

  const sneakyWrite = endpoint({
    method: "GET",
    path: "/restricted",
    requires: [access(restrictedStorage, "read")],
    output: Output,
    async handler(ctx) {
      await ctx.use(restrictedStorage).put("forbidden.txt", "no")
      return { ok: "no" }
    }
  })

  const restrictedApp = app({
    name: "restricted",
    providers: [provide(restrictedStorage, createMemoryStorage())],
    modules: [module({ name: "restricted", endpoints: { sneakyWrite } })]
  })

  const { createMemoryRuntime } = await import("@arc/runtime-memory")
  const response = await createMemoryRuntime(restrictedApp, { onError(error) { captured = error } })
    .fetch(new Request("https://app.test/restricted"))

  assert.equal(response.status, 500)
  assert.equal(captured.code, "ARC1010")
  assert.equal(captured.details.capability, "storage.restricted")
  assert.equal(captured.details.method, "put")
})


test("merges multiple operation grants declared for the same capability", async () => {
  const { createMemoryStorage } = await import("@arc/storage-memory")
  const { storage } = await import("@arc/storage")
  const sharedStorage = storage("multi-access")
  const Output = object({ ok: string() })

  const ep = endpoint({
    method: "GET",
    path: "/multi-access",
    requires: [
      access(sharedStorage, "write"),
      access(sharedStorage, "read")
    ],
    output: Output,
    async handler(ctx) {
      const store = ctx.use(sharedStorage)
      await store.put("ok.txt", "yes")
      const object = await store.get("ok.txt")
      return { ok: object ? "yes" : "no" }
    }
  })

  const multiAccessApp = app({
    name: "multi-access",
    providers: [provide(sharedStorage, createMemoryStorage())],
    modules: [module({ name: "multi-access", endpoints: { ep } })]
  })

  const { createMemoryRuntime } = await import("@arc/runtime-memory")
  const response = await createMemoryRuntime(multiAccessApp)
    .fetch(new Request("https://app.test/multi-access"))

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: "yes" })
})
