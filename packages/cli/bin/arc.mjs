#!/usr/bin/env node
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { buildApplication, explainError, inspect, inspectModuleContext } from "@arc/core"
import { planDeployment } from "@arc/deployment"

const args = process.argv.slice(2)
const command = args[0]
const json = args.includes("--json")
const positional = args.slice(1).filter((arg) => arg !== "--json")

function fail(message, code = 1) {
  if (json) console.error(JSON.stringify({ ok: false, error: message }))
  else console.error(`arc: ${message}`)
  process.exit(code)
}

async function loadApplication(appPath) {
  const url = pathToFileURL(resolve(process.cwd(), appPath)).href
  const loaded = await import(url)
  const application = loaded.default
  if (!application || application.kind !== "arc.app") fail(`module '${appPath}' default export is not an Arc application`)
  return application
}

function indexBy(items, key) {
  return new Map(items.map((item) => [key(item), item]))
}

function changedSet(before, after, key) {
  const left = indexBy(before, key)
  const right = indexBy(after, key)
  const added = [...right.keys()].filter((id) => !left.has(id)).sort()
  const removed = [...left.keys()].filter((id) => !right.has(id)).sort()
  const changed = [...right.keys()].filter((id) => left.has(id) && JSON.stringify(left.get(id)) !== JSON.stringify(right.get(id))).sort()
  return { added, removed, changed }
}

function semanticDiff(before, after) {
  const flattenRoutes = (graph) => graph.modules.flatMap((mod) => mod.endpoints.map((endpoint) => ({ module: mod.name, ...endpoint })))
  const flattenListeners = (graph) => graph.modules.flatMap((mod) => mod.listeners.map((listener) => ({ module: mod.name, ...listener })))
  const flattenJobs = (graph) => graph.modules.flatMap((mod) => mod.jobs.map((job) => ({ module: mod.name, ...job })))
  return {
    schemaVersion: 1,
    from: before.name,
    to: after.name,
    modules: changedSet(before.modules, after.modules, (mod) => mod.name),
    routes: changedSet(flattenRoutes(before), flattenRoutes(after), (route) => `${route.method} ${route.path}`),
    capabilities: changedSet(before.capabilities, after.capabilities, (cap) => cap.name),
    listeners: changedSet(flattenListeners(before), flattenListeners(after), (listener) => `${listener.event}@${listener.version}:${listener.module}.${listener.name}`),
    jobs: changedSet(flattenJobs(before), flattenJobs(after), (job) => `${job.job}@${job.version}:${job.module}.${job.name}`)
  }
}

function printContext(context) {
  console.log(`${context.app}:${context.module.name}\n`)
  for (const endpoint of context.module.endpoints) {
    const deps = endpoint.requires.length ? ` -> ${endpoint.requires.join(", ")}` : ""
    console.log(`${endpoint.method.padEnd(6)} ${endpoint.path}${deps}`)
  }
  for (const item of context.events.consumes) console.log(`CONSUMES ${item.event}@${item.version} => ${item.listener}`)
  for (const item of context.events.emits) console.log(`EMITS    ${item.event}@${item.version} <= ${item.producerKind}:${item.producer}`)
  for (const item of context.jobs.definitions) console.log(`JOB      ${item.job}@${item.version} -> ${item.transport}`)
  for (const item of context.jobs.dispatches) console.log(`DISPATCH ${item.job}@${item.version} <= ${item.producerKind}:${item.producer}`)
}

if (command === "explain") {
  const code = positional[0]
  if (!code || !/^ARC\d{4}$/.test(code)) fail("usage: arc explain <ARCxxxx> [--json]")
  const descriptor = explainError(code)
  if (!descriptor) fail(`unknown error code '${code}'`)
  if (json) console.log(JSON.stringify(descriptor, null, 2))
  else console.log(`${descriptor.code} — ${descriptor.title}\n\n${descriptor.remediation}`)
  process.exit(0)
}

if (command === "diff") {
  if (positional.length !== 2) fail("usage: arc diff <before-app.js> <after-app.js> [--json]")
  try {
    const beforeApp = await loadApplication(positional[0])
    const afterApp = await loadApplication(positional[1])
    buildApplication(beforeApp)
    buildApplication(afterApp)
    const diff = semanticDiff(inspect(beforeApp), inspect(afterApp))
    if (json) console.log(JSON.stringify(diff, null, 2))
    else {
      console.log(`${diff.from} -> ${diff.to}`)
      for (const [section, value] of Object.entries({ modules: diff.modules, routes: diff.routes, capabilities: diff.capabilities, listeners: diff.listeners, jobs: diff.jobs })) {
        console.log(`\n${section}`)
        for (const item of value.added) console.log(`  + ${item}`)
        for (const item of value.removed) console.log(`  - ${item}`)
        for (const item of value.changed) console.log(`  ~ ${item}`)
        if (!value.added.length && !value.removed.length && !value.changed.length) console.log("  no changes")
      }
    }
    process.exit(0)
  } catch (error) {
    const payload = error && typeof error === "object" && "toJSON" in error ? error.toJSON() : { message: error instanceof Error ? error.message : String(error) }
    if (json) console.error(JSON.stringify({ ok: false, error: payload }))
    else console.error(`arc: ${payload.code ? `${payload.code} ` : ""}${payload.message}`)
    process.exit(1)
  }
}


if (command === "plan") {
  if (positional.length !== 1) fail("usage: arc plan <compiled-app.js> [--json]")
  try {
    const application = await loadApplication(positional[0])
    buildApplication(application)
    const plan = planDeployment(application)
    if (json) {
      console.log(JSON.stringify(plan, null, 2))
    } else {
      console.log(`${plan.app} deployment plan v${plan.schemaVersion}\n`)
      for (const surface of plan.surfaces) {
        console.log(surface.id)
        for (const access of surface.resourceAccess) {
          const operations = access.unrestricted ? "*" : access.operations.join(",")
          console.log(`  resource ${access.capability} [${operations}]`)
        }
        for (const trigger of surface.triggers) {
          console.log(`  trigger  ${trigger.capability} [${trigger.operation}]`)
        }
      }
      if (plan.warnings.length) {
        console.log("\nwarnings")
        for (const warning of plan.warnings) console.log(`  ${warning.code} ${warning.message}`)
      }
    }
    process.exit(0)
  } catch (error) {
    const payload = error && typeof error === "object" && "toJSON" in error ? error.toJSON() : { message: error instanceof Error ? error.message : String(error) }
    if (json) console.error(JSON.stringify({ ok: false, error: payload }))
    else console.error(`arc: ${payload.code ? `${payload.code} ` : ""}${payload.message}`)
    process.exit(1)
  }
}

if (command === "context") {
  if (positional.length !== 2) fail("usage: arc context <compiled-app.js> <module> [--json]")
  try {
    const application = await loadApplication(positional[0])
    buildApplication(application)
    const context = inspectModuleContext(application, positional[1])
    if (!context) fail(`module '${positional[1]}' does not exist in '${application.name}'`)
    console.log(json ? JSON.stringify(context, null, 2) : printContext(context) ?? "")
    process.exit(0)
  } catch (error) {
    const payload = error && typeof error === "object" && "toJSON" in error ? error.toJSON() : { message: error instanceof Error ? error.message : String(error) }
    if (json) console.error(JSON.stringify({ ok: false, error: payload }))
    else console.error(`arc: ${payload.code ? `${payload.code} ` : ""}${payload.message}`)
    process.exit(1)
  }
}

if (!command || positional.length !== 1 || !["inspect", "validate"].includes(command)) {
  fail("usage: arc <inspect|validate|plan> <compiled-app.js> [--json] | arc context <app.js> <module> [--json] | arc diff <before.js> <after.js> [--json] | arc explain <ARCxxxx> [--json]")
}

try {
  const application = await loadApplication(positional[0])
  buildApplication(application)

  if (command === "validate") {
    const result = { ok: true, app: application.name }
    console.log(json ? JSON.stringify(result) : `✓ ${application.name} is valid`)
  } else {
    const graph = inspect(application)
    if (json) {
      console.log(JSON.stringify(graph, null, 2))
    } else {
      console.log(`${graph.name} (graph v${graph.schemaVersion})\n`)
      if (graph.capabilities.length) {
        console.log("capabilities")
        for (const item of graph.capabilities) {
          const resource = item.resourceType ? ` [${item.resourceType}]` : ""
          const configured = item.configured ? " configured" : " runtime"
          console.log(`  ${item.name}${resource} —${configured}`)
        }
        console.log("")
      }
      for (const mod of graph.modules) {
        console.log(`module ${mod.name}`)
        for (const endpoint of mod.endpoints) {
          const deps = endpoint.requires.length ? ` -> ${endpoint.requires.join(", ")}` : ""
          console.log(`  ${endpoint.method.padEnd(6)} ${endpoint.path}${deps}`)
        }
        for (const listener of mod.listeners) {
          const deps = listener.requires.length ? ` -> ${listener.requires.join(", ")}` : ""
          console.log(`  EVENT  ${listener.event}@${listener.version} => ${listener.name}${deps}`)
        }
        for (const job of mod.jobs) {
          const deps = job.requires.length ? ` -> ${job.requires.join(", ")}` : ""
          console.log(`  JOB    ${job.job}@${job.version} => ${job.name} via ${job.transport}${deps}`)
        }
      }
    }
  }
} catch (error) {
  const payload = error && typeof error === "object" && "toJSON" in error ? error.toJSON() : { message: error instanceof Error ? error.message : String(error) }
  if (json) console.error(JSON.stringify({ ok: false, error: payload }))
  else console.error(`arc: ${payload.code ? `${payload.code} ` : ""}${payload.message}`)
  process.exit(1)
}
