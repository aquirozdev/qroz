import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

function runCreateArc(target) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      "packages/create-qroz/bin/create-qroz.mjs",
      target,
      "--yes"
    ], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"]
    })

    let stdout = ""
    let stderr = ""
    child.stdout.setEncoding("utf8")
    child.stderr.setEncoding("utf8")
    child.stdout.on("data", (chunk) => { stdout += chunk })
    child.stderr.on("data", (chunk) => { stderr += chunk })
    child.once("error", reject)
    child.once("exit", (code) => {
      if (code === 0) resolve({ stdout, stderr })
      else reject(new Error(`create-qroz exited ${code}: ${stderr}`))
    })
  })
}

test("create-qroz scaffolds the minimal productive application", async () => {
  const root = await mkdtemp(join(tmpdir(), "qroz-create-"))
  const target = join(root, "my-qroz-app")

  try {
    const result = await runCreateArc(target)
    assert.match(result.stdout, /Created my-qroz-app/)
    assert.equal(result.stderr, "")

    const packageJson = JSON.parse(await readFile(join(target, "package.json"), "utf8"))
    assert.equal(packageJson.name, "my-qroz-app")
    assert.equal(packageJson.scripts.dev, "qroz dev src/app.ts --watch")
    assert.equal("build:watch" in packageJson.scripts, false)

    const app = await readFile(join(target, "src/app.ts"), "utf8")
    assert.match(app, /path: "\/health"/)
    assert.match(app, /name: "my-qroz-app"/)

    const acceptance = await readFile(join(target, "test/app.test.mjs"), "utf8")
    assert.match(acceptance, /health endpoint/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
