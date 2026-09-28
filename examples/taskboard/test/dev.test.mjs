import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createServer } from "node:net"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
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

async function waitForServer(url, child, diagnostics = () => "") {
  const deadline = Date.now() + 8_000
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`qroz dev exited early with code ${child.exitCode}: ${diagnostics()}`)
    try {
      const response = await fetch(url)
      if (response.ok) return response
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error("qroz dev did not become ready")
}

test("qroz dev serves the application and Studio from the same Application Graph", { timeout: 12_000 }, async () => {
  const port = await availablePort()
  const child = spawn(process.execPath, [
    "packages/cli/bin/qroz.mjs",
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
    const graphResponse = await waitForServer(`http://127.0.0.1:${port}/__qroz/api/graph`, child, () => stderr)
    const graph = await graphResponse.json()
    assert.equal(graph.name, "taskboard")
    assert.equal(graph.modules.find((item) => item.name === "tasks")?.endpoints.length, 2)

    const studio = await fetch(`http://127.0.0.1:${port}/__qroz/`)
    assert.equal(studio.status, 200)
    assert.match(await studio.text(), /Qroz Studio/)

    const application = await fetch(`http://127.0.0.1:${port}/tasks/task-1`)
    assert.equal(application.status, 200)
    assert.deepEqual(await application.json(), {
      id: "task-1",
      title: "Ship the first Qroz app",
      completed: false
    })

    const requests = await fetch(`http://127.0.0.1:${port}/__qroz/api/requests`).then((response) => response.json())
    assert.equal(requests.at(-1)?.method, "GET")
    assert.equal(requests.at(-1)?.path, "/tasks/task-1")
    assert.equal(requests.at(-1)?.status, 200)

    const traces = await fetch(`http://127.0.0.1:${port}/__qroz/api/traces`).then((response) => response.json())
    assert.equal(traces.at(-1)?.name, "qroz.endpoint")
    assert.equal(traces.at(-1)?.attributes?.["qroz.endpoint"], "getTask")
    assert.equal(traces.at(-1)?.requestId, requests.at(-1)?.id)
  } finally {
    child.kill("SIGTERM")
    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 1_000))
    ])
  }

  assert.equal(stderr, "")
})


test("qroz dev records authorization denials without exposing principal claims", { timeout: 12_000 }, async () => {
  const port = await availablePort()
  const child = spawn(process.execPath, [
    "packages/cli/bin/qroz.mjs",
    "dev",
    "examples/saas/dist/app.js",
    "--port",
    String(port),
    "--no-open"
  ], { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] })

  try {
    let stderr = ""
    child.stderr.setEncoding("utf8")
    child.stderr.on("data", (chunk) => { stderr += chunk })
    await waitForServer(`http://127.0.0.1:${port}/__qroz/api/graph`, child, () => stderr)
    const denied = await fetch(`http://127.0.0.1:${port}/projects/project-a`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Blocked" })
    })
    assert.equal(denied.status, 401)

    const decisions = await fetch(`http://127.0.0.1:${port}/__qroz/api/decisions`).then((response) => response.json())
    assert.equal(decisions.at(-1)?.kind, "authentication")
    assert.equal(decisions.at(-1)?.outcome, "deny")
    assert.equal("claims" in (decisions.at(-1)?.principal ?? {}), false)

    const plan = await fetch(`http://127.0.0.1:${port}/__qroz/api/plan`).then((response) => response.json())
    const renameSurface = plan.surfaces.find((surface) => surface.id === "endpoint:projects.renameProject")
    assert.deepEqual(renameSurface?.resourceAccess.find((item) => item.capability === "tenants.memberships")?.operations, ["read"])

    const explanation = await fetch(`http://127.0.0.1:${port}/__qroz/api/explain?code=QROZ3001`).then((response) => response.json())
    assert.equal(explanation.code, "QROZ3001")
    assert.equal(typeof explanation.remediation, "string")
  } finally {
    child.kill("SIGTERM")
    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 1_000))
    ])
  }
})


test("qroz dev --watch reloads the full compiled module graph", { timeout: 15_000 }, async () => {
  const root = await mkdtemp(join(process.cwd(), ".qroz-watch-"))
  const appPath = join(root, "app.mjs")
  const messagePath = join(root, "message.mjs")
  const port = await availablePort()

  const appSource = `import { app, endpoint, module } from "@qroz/core"
import { message } from "./message.mjs"

const Output = {
  "~standard": {
    version: 1,
    vendor: "qroz-watch-test",
    validate(value) { return { value } }
  }
}

const version = endpoint({
  method: "GET",
  path: "/version",
  output: Output,
  handler() { return { message } }
})

export default app({
  name: "watch-test",
  modules: [module({ name: "system", endpoints: { version } })]
})
`

  await writeFile(appPath, appSource, "utf8")
  await writeFile(messagePath, 'export const message = "one"\n', "utf8")

  const child = spawn(process.execPath, [
    "packages/cli/bin/qroz.mjs",
    "dev",
    appPath,
    "--watch",
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

  async function waitForMessage(expected) {
    const deadline = Date.now() + 8_000
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(`qroz dev --watch exited early: ${stderr}`)
      try {
        const response = await fetch(`http://127.0.0.1:${port}/version`)
        if (response.ok && (await response.json()).message === expected) return
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 75))
    }
    throw new Error(`timed out waiting for watched value '${expected}'`)
  }

  try {
    await waitForMessage("one")
    await writeFile(messagePath, 'export const message = "two"\n', "utf8")
    await waitForMessage("two")
  } finally {
    child.kill("SIGTERM")
    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 1_500))
    ])
    await rm(root, { recursive: true, force: true })
  }

  assert.equal(stderr, "")
})


test("qroz dev watches a TypeScript source entry without exposing dist plumbing", { timeout: 20_000 }, async () => {
  const root = await mkdtemp(join(process.cwd(), ".qroz-source-"))
  const sourceDir = join(root, "src")
  const appPath = join(sourceDir, "app.ts")
  const messagePath = join(sourceDir, "message.ts")
  const port = await availablePort()

  await mkdir(sourceDir, { recursive: true })
  await writeFile(join(root, "tsconfig.json"), JSON.stringify({
    compilerOptions: {
      target: "ES2022",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      strict: true,
      rootDir: "src",
      outDir: "dist",
      skipLibCheck: true
    },
    include: ["src/**/*.ts"]
  }, null, 2), "utf8")

  await writeFile(messagePath, 'export const message = "one"\n', "utf8")
  await writeFile(appPath, `import { app, endpoint, module } from "@qroz/core"
import { message } from "./message.js"

const Output = {
  "~standard": {
    version: 1 as const,
    vendor: "qroz-source-first-test",
    validate(value: unknown) {
      return { value: value as { message: string } }
    }
  }
}

const version = endpoint({
  method: "GET",
  path: "/version",
  output: Output,
  handler() {
    return { message }
  }
})

export default app({
  name: "source-first",
  modules: [module({ name: "system", endpoints: { version } })]
})
`, "utf8")

  const child = spawn(process.execPath, [
    "packages/cli/bin/qroz.mjs",
    "dev",
    appPath,
    "--watch",
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

  async function waitForMessage(expected) {
    const deadline = Date.now() + 10_000
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(`source-first qroz dev exited early: ${stderr}`)
      try {
        const response = await fetch(`http://127.0.0.1:${port}/version`)
        if (response.ok && (await response.json()).message === expected) return
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 75))
    }
    throw new Error(`timed out waiting for TypeScript source value '${expected}': ${stderr}`)
  }

  try {
    await waitForMessage("one")
    await writeFile(messagePath, 'export const message = "two"\n', "utf8")
    await waitForMessage("two")
  } finally {
    child.kill("SIGTERM")
    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 1_500))
    ])
    await rm(root, { recursive: true, force: true })
  }

  assert.equal(stderr, "")
})
