#!/usr/bin/env node
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { spawn } from "node:child_process"
import { tmpdir } from "node:os"
import { basename, join, resolve } from "node:path"

const root = process.cwd()
const packagesRoot = join(root, "packages")
const workRoot = await mkdtemp(join(tmpdir(), "arc-packed-consumer-"))
const stageRoot = join(workRoot, "stage")
const tarballRoot = join(workRoot, "tarballs")
const consumerRoot = join(workRoot, "consumer")
const evidenceRoot = join(root, ".release-evidence")

function run(command, args, options = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? root,
      env: { ...process.env, ...(options.env ?? {}) },
      stdio: ["ignore", "pipe", "pipe"],
      shell: false
    })
    let stdout = ""
    let stderr = ""
    child.stdout.setEncoding("utf8")
    child.stderr.setEncoding("utf8")
    child.stdout.on("data", (chunk) => { stdout += chunk })
    child.stderr.on("data", (chunk) => { stderr += chunk })
    child.once("error", reject)
    child.once("exit", (code) => {
      if (code === 0) resolveRun({ stdout, stderr })
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}\n${stderr || stdout}`))
    })
  })
}

function rewriteDependencies(manifest, versions) {
  const next = structuredClone(manifest)
  for (const section of ["dependencies", "optionalDependencies", "peerDependencies"]) {
    if (!next[section]) continue
    for (const [name, range] of Object.entries(next[section])) {
      if (String(range).startsWith("file:")) {
        const version = versions.get(name)
        if (!version) throw new Error(`${manifest.name}: local dependency '${name}' has no workspace manifest`)
        next[section][name] = version
      }
    }
  }
  return next
}

const packageEntries = []
for (const entry of await readdir(packagesRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const manifestPath = join(packagesRoot, entry.name, "package.json")
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
    packageEntries.push({ directory: entry.name, manifest, manifestPath })
  } catch {}
}

packageEntries.sort((left, right) => left.manifest.name.localeCompare(right.manifest.name))
const versions = new Map(packageEntries.map(({ manifest }) => [manifest.name, manifest.version]))

await mkdir(stageRoot, { recursive: true })
await mkdir(tarballRoot, { recursive: true })
await mkdir(consumerRoot, { recursive: true })
await rm(evidenceRoot, { recursive: true, force: true })
await mkdir(evidenceRoot, { recursive: true })

const packed = []

try {
  for (const { directory, manifest } of packageEntries) {
    const source = join(packagesRoot, directory)
    const stage = join(stageRoot, directory)
    await mkdir(stage, { recursive: true })

    const releaseManifest = rewriteDependencies(manifest, versions)
    await writeFile(join(stage, "package.json"), JSON.stringify(releaseManifest, null, 2) + "\n")

    for (const file of manifest.files ?? []) {
      await cp(join(source, file), join(stage, file), { recursive: true })
    }

    const result = await run("npm", ["pack", "--json", "--pack-destination", tarballRoot], { cwd: stage })
    const report = JSON.parse(result.stdout)[0]
    const forbidden = (report.files ?? [])
      .map((item) => item.path)
      .filter((path) => /^(?:src|test|tests|examples)\//.test(path))

    if (forbidden.length) {
      throw new Error(`${manifest.name}: tarball contains forbidden development files: ${forbidden.join(", ")}`)
    }

    packed.push({
      name: manifest.name,
      version: manifest.version,
      filename: report.filename,
      size: report.size,
      unpackedSize: report.unpackedSize,
      integrity: report.integrity,
      files: report.files?.map((item) => item.path) ?? []
    })
  }

  const tarballs = packed.map((item) => join(tarballRoot, item.filename))
  await writeFile(join(consumerRoot, "package.json"), JSON.stringify({
    name: "arc-packed-consumer",
    private: true,
    type: "module"
  }, null, 2) + "\n")

  await run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", ...tarballs], { cwd: consumerRoot })

  await writeFile(join(consumerRoot, "app.mjs"), `import { app, endpoint, module } from "@arc/core"
import { createTestClient } from "@arc/testing"

const Output = {
  "~standard": {
    version: 1,
    vendor: "packed-consumer",
    validate(value) { return { value } }
  }
}

const health = endpoint({
  method: "GET",
  path: "/health",
  output: Output,
  handler() { return { ok: true } }
})

const application = app({
  name: "packed-consumer",
  modules: [module({ name: "system", endpoints: { health } })]
})

export default application

const response = await createTestClient(application).get("/health")
if (response.status !== 200) throw new Error(\`unexpected status \${response.status}\`)
const body = await response.json()
if (body.ok !== true) throw new Error(\`unexpected body \${JSON.stringify(body)}\`)
console.log("packed consumer request ok")
`, "utf8")

  const appRun = await run(process.execPath, ["app.mjs"], { cwd: consumerRoot })

  const cliPath = join(consumerRoot, "node_modules", "@arc", "cli", "bin", "arc.mjs")
  const cliRun = await run(process.execPath, [cliPath, "validate", "app.mjs", "--json"], { cwd: consumerRoot })
  const cli = JSON.parse(cliRun.stdout)
  if (cli.ok !== true || cli.app !== "packed-consumer") throw new Error(`unexpected packed CLI result: ${cliRun.stdout}`)

  const createPath = join(consumerRoot, "node_modules", "create-arc", "bin", "create-arc.mjs")
  const scaffoldPath = join(consumerRoot, "generated")
  await run(process.execPath, [createPath, scaffoldPath, "--yes"], { cwd: consumerRoot })
  const scaffoldManifest = JSON.parse(await readFile(join(scaffoldPath, "package.json"), "utf8"))
  if (scaffoldManifest.scripts?.dev !== "arc dev src/app.ts --watch") {
    throw new Error(`packed create-arc generated unexpected dev script: ${scaffoldManifest.scripts?.dev}`)
  }

  const evidence = {
    generatedAt: new Date().toISOString(),
    node: process.version,
    platform: process.platform,
    packages: packed,
    consumer: {
      request: appRun.stdout.trim(),
      cli,
      scaffoldDev: scaffoldManifest.scripts.dev
    }
  }

  await writeFile(join(evidenceRoot, "packed-consumer.json"), JSON.stringify(evidence, null, 2) + "\n")
  console.log(`✓ packed consumer verified ${packed.length} package(s)`)
} finally {
  await rm(workRoot, { recursive: true, force: true })
}
