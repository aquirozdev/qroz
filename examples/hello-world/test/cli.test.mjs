import test from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"

const cli = "packages/cli/bin/arc.mjs"
const app = "examples/hello-world/dist/app.js"

test("CLI emits deterministic JSON application graph", () => {
  const output = execFileSync(process.execPath, [cli, "inspect", app, "--json"], {
    cwd: new URL("../../..", import.meta.url),
    encoding: "utf8"
  })
  const graph = JSON.parse(output)
  assert.equal(graph.schemaVersion, 5)
  assert.equal(graph.name, "example")
  assert.equal(graph.modules[0].endpoints[0].path, "/users/:id")
  assert.deepEqual(graph.modules[0].endpoints[0].requires, ["users.repository"])
  const files = graph.modules.find((item) => item.name === "files")
  assert.deepEqual(files.endpoints.find((item) => item.name === "putFile").access, [
    { capability: "storage.files", operations: ["write"] }
  ])
  assert.deepEqual(files.endpoints.find((item) => item.name === "getFile").access, [
    { capability: "storage.files", operations: ["read"] }
  ])
})

test("CLI validates an application", () => {
  const output = execFileSync(process.execPath, [cli, "validate", app, "--json"], {
    cwd: new URL("../../..", import.meta.url),
    encoding: "utf8"
  })
  assert.deepEqual(JSON.parse(output), { ok: true, app: "example" })
})


test("CLI explains stable framework error codes for humans and agents", () => {
  const output = execFileSync(process.execPath, [cli, "explain", "ARC1004", "--json"], {
    cwd: new URL("../../..", import.meta.url),
    encoding: "utf8"
  })
  const explanation = JSON.parse(output)
  assert.equal(explanation.code, "ARC1004")
  assert.match(explanation.remediation, /Provide the required capability/)
})

test("CLI context returns a compact semantic module view", () => {
  const output = execFileSync(process.execPath, [cli, "context", app, "users", "--json"], {
    cwd: new URL("../../..", import.meta.url),
    encoding: "utf8"
  })
  const context = JSON.parse(output)
  assert.equal(context.app, "example")
  assert.equal(context.module.name, "users")
  assert.deepEqual(context.capabilities.map((item) => item.name), ["users.repository", "audit.sink"])
  assert.deepEqual(context.events.emits, [{ event: "user.created", version: 1, producer: "createUser", producerKind: "endpoint" }])
  assert.deepEqual(context.jobs.definitions, [])
})

test("CLI diff compares applications semantically", () => {
  const fixture = "examples/hello-world/dist-diff-fixture.mjs"
  const output = execFileSync(process.execPath, [cli, "diff", app, fixture, "--json"], {
    cwd: new URL("../../..", import.meta.url),
    encoding: "utf8"
  })
  const diff = JSON.parse(output)
  assert.ok(diff.routes.added.includes("GET /health"))
  assert.ok(diff.routes.removed.includes("GET /users/:id"))
  assert.ok(diff.capabilities.removed.includes("users.repository"))
})


test("CLI plan exposes execution surfaces and least-privilege resource operations", () => {
  const output = execFileSync(process.execPath, [cli, "plan", app, "--json"], {
    cwd: new URL("../../..", import.meta.url),
    encoding: "utf8"
  })
  const plan = JSON.parse(output)
  assert.equal(plan.schemaVersion, 1)
  const write = plan.surfaces.find((surface) => surface.id === "endpoint:files.putFile")
  assert.deepEqual(write.resourceAccess[0].operations, ["write"])
  const job = plan.surfaces.find((surface) => surface.id === "job:notifications.DeliverNotification")
  assert.deepEqual(job.triggers[0], {
    capability: "queue.jobs.notifications",
    resourceType: "message-queue",
    operation: "consume",
    reason: "job-transport"
  })
})
