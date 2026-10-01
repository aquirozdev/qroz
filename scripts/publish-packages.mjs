#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { spawnSync } from "node:child_process"

const root = process.cwd()
const packagesRoot = join(root, "packages")
const rootManifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"))
const expectedVersion = rootManifest.version
const entries = await readdir(packagesRoot, { withFileTypes: true })

const manifests = []
for (const entry of entries) {
  if (!entry.isDirectory()) continue
  const directory = join(packagesRoot, entry.name)
  try {
    const manifest = JSON.parse(await readFile(join(directory, "package.json"), "utf8"))
    if (manifest.private === true) continue
    if (manifest.version !== expectedVersion) {
      throw new Error(`${manifest.name}: version ${manifest.version} does not match ${expectedVersion}`)
    }
    manifests.push({ directory, manifest })
  } catch (error) {
    if (error?.code === "ENOENT") continue
    throw error
  }
}

manifests.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name))

for (const { directory, manifest } of manifests) {
  console.log(`Publishing ${manifest.name}@${manifest.version}`)
  const result = spawnSync("npm", ["publish", "--access", "public", "--provenance", "--tag", "beta"], {
    cwd: directory,
    stdio: "inherit",
    shell: process.platform === "win32",
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
