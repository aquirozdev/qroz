#!/usr/bin/env node
import { access, readFile, readdir } from "node:fs/promises"
import { join } from "node:path"

const root = process.cwd()
const failures = []
const warnings = []

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function fail(message) {
  failures.push(message)
}

function warn(message) {
  warnings.push(message)
}

if (!(await exists(join(root, "LICENSE")))) {
  fail("LICENSE is missing; the repository owner must choose an explicit license before publication")
}

const packagesDir = join(root, "packages")
for (const entry of await readdir(packagesDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const manifestPath = join(packagesDir, entry.name, "package.json")
  if (!(await exists(manifestPath))) continue

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
  const label = manifest.name ?? entry.name

  for (const field of ["name", "version", "description", "license", "repository", "engines"]) {
    if (manifest[field] === undefined) fail(`${label}: missing package.json field '${field}'`)
  }

  if (!manifest.publishConfig || manifest.publishConfig.access !== "public") {
    fail(`${label}: publishConfig.access must explicitly be 'public' for a public beta package`)
  }

  if (manifest.private === true) continue

  if (!manifest.files?.length) warn(`${label}: no explicit files allowlist`)

  for (const section of ["dependencies", "optionalDependencies", "peerDependencies"]) {
    for (const [dependency, range] of Object.entries(manifest[section] ?? {})) {
      if (String(range).startsWith("file:")) {
        fail(`${label}: ${section} '${dependency}' uses local-only range '${range}'`)
      }
    }
  }
}

const rootManifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"))
if (!rootManifest.private) fail("root workspace must remain private to prevent accidental monorepo publication")

if (warnings.length) {
  console.log("Release readiness warnings:")
  for (const item of warnings) console.log(`  - ${item}`)
  console.log("")
}

if (failures.length) {
  console.error("Release readiness blocked:")
  for (const item of failures) console.error(`  - ${item}`)
  console.error(`\n${failures.length} blocker(s) found.`)
  process.exit(1)
}

console.log("✓ package metadata release gate passed")
