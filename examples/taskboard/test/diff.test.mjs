import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import test from "node:test"

const execFileAsync = promisify(execFile)

test("arc diff exposes security, resource and deployment changes", async () => {
  const { stdout, stderr } = await execFileAsync(process.execPath, [
    "packages/cli/bin/arc.mjs",
    "diff",
    "examples/taskboard/test/fixtures/change-before.mjs",
    "examples/taskboard/test/fixtures/change-after.mjs",
    "--json"
  ], { cwd: process.cwd() })

  assert.equal(stderr, "")
  const diff = JSON.parse(stdout)

  assert.equal(diff.schemaVersion, 2)
  assert.deepEqual(diff.security.changed, ["items.readItem"])
  assert.deepEqual(diff.resourceAccess.changed, ["endpoint:items.readItem"])
  assert.deepEqual(diff.deployment.changed, ["endpoint:items.readItem"])
  assert.deepEqual(diff.routes.changed, ["GET /items/:id"])
  assert.deepEqual(diff.impact.authorization, [{
    surface: "items.readItem",
    addedPermissions: ["items.write"],
    removedPermissions: ["items.read"],
    addedPolicies: [],
    removedPolicies: []
  }])
  assert.deepEqual(diff.impact.privilegeExpansion, [{
    surface: "endpoint:items.readItem",
    capability: "review.store",
    addedOperations: ["write"],
    unrestricted: false
  }])
})

test("arc diff human output calls out security and resource access explicitly", async () => {
  const { stdout, stderr } = await execFileAsync(process.execPath, [
    "packages/cli/bin/arc.mjs",
    "diff",
    "examples/taskboard/test/fixtures/change-before.mjs",
    "examples/taskboard/test/fixtures/change-after.mjs"
  ], { cwd: process.cwd() })

  assert.equal(stderr, "")
  assert.match(stdout, /security\n\s+~ items\.readItem/)
  assert.match(stdout, /resourceAccess\n\s+~ endpoint:items\.readItem/)
  assert.match(stdout, /deployment\n\s+~ endpoint:items\.readItem/)
  assert.match(stdout, /items\.readItem adds permission items\.write/)
  assert.match(stdout, /endpoint:items\.readItem expands review\.store access: \+write/)
})
