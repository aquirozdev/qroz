import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createServer } from "node:net"
import test from "node:test"

async function availablePort() {
  const server = createServer()
  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })
  const address = server.address()
  const port = typeof address === "object" && address ? address.port : 0
  await new Promise((resolve) => server.close(resolve))
  return port
}

async function waitForServer(url, child) {
  const deadline = Date.now() + 8_000
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`arc dev exited early with code ${child.exitCode}`)
    try {
      const response = await fetch(url)
      if (response.ok) return response
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error("arc dev did not become ready")
}

test("arc dev serves the application and Studio from the same Application Graph", { timeout: 12_000 }, async () => {
  const port = await availablePort()
  const child = spawn(process.execPath, [
    "packages/cli/bin/arc.mjs",
    "dev",
    "examples/taskboard/dist/app.js",
    "--port",
    String(port),
    "--no-open"
  ], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"]
  })

  let stderr = ""
  child.stderr.setEncoding("utf8")
  child.stderr.on("data", (chunk) => { stderr += chunk })

  try {
    const graphResponse = await waitForServer(`http://127.0.0.1:${port}/__arc/api/graph`, child)
    const graph = await graphResponse.json()
    assert.equal(graph.name, "taskboard")
    assert.equal(graph.modules.find((item) => item.name === "tasks")?.endpoints.length, 2)

    const studio = await fetch(`http://127.0.0.1:${port}/__arc/`)
    assert.equal(studio.status, 200)
    assert.match(await studio.text(), /Arc Studio/)

    const application = await fetch(`http://127.0.0.1:${port}/tasks/task-1`)
    assert.equal(application.status, 200)
    assert.deepEqual(await application.json(), {
      id: "task-1",
      title: "Ship the first Arc app",
      completed: false
    })

    const requests = await fetch(`http://127.0.0.1:${port}/__arc/api/requests`).then((response) => response.json())
    assert.equal(requests.at(-1)?.method, "GET")
    assert.equal(requests.at(-1)?.path, "/tasks/task-1")
    assert.equal(requests.at(-1)?.status, 200)
  } finally {
    child.kill("SIGTERM")
    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 1_000))
    ])
  }

  assert.equal(stderr, "")
})


test("arc dev records authorization denials without exposing principal claims", { timeout: 12_000 }, async () => {
  const port = await availablePort()
  const child = spawn(process.execPath, [
    "packages/cli/bin/arc.mjs",
    "dev",
    "examples/saas/dist/app.js",
    "--port",
    String(port),
    "--no-open"
  ], { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] })

  try {
    await waitForServer(`http://127.0.0.1:${port}/__arc/api/graph`, child)
    const denied = await fetch(`http://127.0.0.1:${port}/projects/project-a`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Blocked" })
    })
    assert.equal(denied.status, 401)

    const decisions = await fetch(`http://127.0.0.1:${port}/__arc/api/decisions`).then((response) => response.json())
    assert.equal(decisions.at(-1)?.kind, "authentication")
    assert.equal(decisions.at(-1)?.outcome, "deny")
    assert.equal("claims" in (decisions.at(-1)?.principal ?? {}), false)
  } finally {
    child.kill("SIGTERM")
    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 1_000))
    ])
  }
})
