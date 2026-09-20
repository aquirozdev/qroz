#!/usr/bin/env node
import { spawn } from "node:child_process"
import { createServer } from "node:net"

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

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["packages/cli/bin/arc.mjs", ...args], {
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
      else reject(new Error(`arc ${args.join(" ")} exited ${code}: ${stderr || stdout}`))
    })
  })
}

async function waitFor(url, child, stderr) {
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`arc dev exited early: ${stderr()}`)
    try {
      const response = await fetch(url)
      if (response.ok) return response
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`timed out waiting for ${url}: ${stderr()}`)
}

const validation = await run(["validate", "examples/taskboard/dist/app.js", "--json"])
const validationJson = JSON.parse(validation.stdout)
if (validationJson.ok !== true || validationJson.app !== "taskboard") {
  throw new Error(`unexpected validate output: ${validation.stdout}`)
}

const inspection = await run(["inspect", "examples/taskboard/dist/app.js", "--json"])
const graph = JSON.parse(inspection.stdout)
if (graph.name !== "taskboard") throw new Error(`unexpected graph name: ${graph.name}`)

const port = await availablePort()
const child = spawn(process.execPath, [
  "packages/cli/bin/arc.mjs",
  "dev",
  "examples/taskboard/src/app.ts",
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
  const response = await waitFor(`http://127.0.0.1:${port}/__arc/api/graph`, child, () => stderr)
  const devGraph = await response.json()
  if (devGraph.name !== "taskboard") throw new Error(`unexpected dev graph: ${devGraph.name}`)
} finally {
  child.kill("SIGTERM")
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 2_000))
  ])
  if (child.exitCode === null) child.kill("SIGKILL")
}

if (stderr.trim()) throw new Error(`arc dev emitted stderr: ${stderr}`)

console.log(`✓ CLI smoke passed on ${process.platform} / Node ${process.version}`)
