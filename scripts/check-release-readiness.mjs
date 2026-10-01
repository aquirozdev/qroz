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

const rootManifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"))
const releaseVersion = rootManifest.version

if (!rootManifest.private) fail("root workspace must remain private to prevent accidental monorepo publication")
if (!releaseVersion) fail("root workspace must declare the canonical prerelease version")
if (releaseVersion && !releaseVersion.includes("-")) {
  fail(`root version '${releaseVersion}' must remain a prerelease until the 1.0 release policy changes`)
}

if (!(await exists(join(root, "LICENSE")))) {
  fail("LICENSE is missing")
} else {
  const licenseText = await readFile(join(root, "LICENSE"), "utf8")
  if (!licenseText.includes("Apache License") || !licenseText.includes("Version 2.0")) {
    fail("LICENSE must contain the Apache License 2.0 text")
  }
}

if (rootManifest.license !== "Apache-2.0") {
  fail(`root package license must be 'Apache-2.0', found '${rootManifest.license ?? "missing"}'`)
}

const packagesDir = join(root, "packages")
for (const entry of await readdir(packagesDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const manifestPath = join(packagesDir, entry.name, "package.json")
  if (!(await exists(manifestPath))) continue

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
  const label = manifest.name ?? entry.name

  for (const field of ["name", "version", "description", "keywords", "repository", "bugs", "homepage", "engines"]) {
    if (manifest[field] === undefined) fail(`${label}: missing package.json field '${field}'`)
  }

  if (manifest.version !== releaseVersion) {
    fail(`${label}: version '${manifest.version}' does not match canonical release version '${releaseVersion}'`)
  }

  if (manifest.engines?.node !== ">=22") {
    fail(`${label}: engines.node must match the supported baseline '>=22'`)
  }

  if (!manifest.publishConfig || manifest.publishConfig.access !== "public") {
    fail(`${label}: publishConfig.access must explicitly be 'public' for a public beta package`)
  }

  if (manifest.publishConfig?.provenance !== true) {
    fail(`${label}: publishConfig.provenance must be true`)
  }

  if (!manifest.files?.length) warn(`${label}: no explicit files allowlist`)

  for (const section of ["dependencies", "optionalDependencies", "peerDependencies"]) {
    for (const [dependency, range] of Object.entries(manifest[section] ?? {})) {
      const value = String(range)
      if (value.startsWith("file:")) {
        fail(`${label}: ${section} '${dependency}' uses local-only range '${range}'`)
      }
      if (dependency.startsWith("@qroz/") && value !== `^${releaseVersion}`) {
        fail(`${label}: internal dependency '${dependency}' must use '^${releaseVersion}', found '${value}'`)
      }
    }
  }

  if (manifest.license !== "Apache-2.0") {
    fail(`${label}: license must be 'Apache-2.0', found '${manifest.license ?? "missing"}'`)
  }
}

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

console.log(`✓ Qroz ${releaseVersion} package metadata release gate passed`)
