import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import test from "node:test"

const execFileAsync = promisify(execFile)

test("Arc CLI errors explain what failed and how to fix it", async () => {
  await assert.rejects(
    execFileAsync(process.execPath, [
      "packages/cli/bin/arc.mjs",
      "validate",
      "examples/taskboard/test/fixtures/missing-provider.mjs"
    ], { cwd: process.cwd() }),
    (error) => {
      assert.match(error.stderr, /ARC1004 — Missing capability provider/)
      assert.match(error.stderr, /requires capability 'example\.database', but no provider is configured/)
      assert.match(error.stderr, /Context/)
      assert.match(error.stderr, /owner: items\.list/)
      assert.match(error.stderr, /capability: example\.database/)
      assert.match(error.stderr, /How to fix/)
      assert.match(error.stderr, /Provide the required capability/)
      return true
    }
  )
})

test("Arc CLI keeps stable machine-readable error output", async () => {
  await assert.rejects(
    execFileAsync(process.execPath, [
      "packages/cli/bin/arc.mjs",
      "validate",
      "examples/taskboard/test/fixtures/missing-provider.mjs",
      "--json"
    ], { cwd: process.cwd() }),
    (error) => {
      const payload = JSON.parse(error.stderr)
      assert.equal(payload.ok, false)
      assert.equal(payload.error.code, "ARC1004")
      assert.equal(payload.error.details.capability, "example.database")
      return true
    }
  )
})
