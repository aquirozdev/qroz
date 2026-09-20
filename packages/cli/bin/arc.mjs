#!/usr/bin/env node
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { buildApplication, explainError, inspect, inspectModuleContext } from "@arc/core"
import { planDeployment } from "@arc/deployment"
import { runDev } from "../lib/dev-server.mjs"

const args = process.argv.slice(2)
const command = args[0]

function parseCommandArgs(values) {
  const positional = []
  const flags = new Set()
  const options = new Map()
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]
    if (!value.startsWith("--")) {
      positional.push(value)
      continue
    }
    const next = values[index + 1]
    if (next !== undefined && !next.startsWith("--")) {
      options.set(value, next)
      index += 1
    } else {
      flags.add(value)
    }
  }
  return { positional, flags, options }
}

const parsed = parseCommandArgs(args.slice(1))
const json = parsed.flags.has("--json")
const positional = parsed.positional

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

function authorizationImpact(beforeItems, afterItems) {
  const before = indexBy(beforeItems, (item) => item.id)
  const after = indexBy(afterItems, (item) => item.id)
  const output = []

  for (const [id, current] of after) {
    const previous = before.get(id)
    if (!previous) continue
    const addedPermissions = current.auth.permissions.filter((item) => !previous.auth.permissions.includes(item))
    const removedPermissions = previous.auth.permissions.filter((item) => !current.auth.permissions.includes(item))
    const addedPolicies = current.auth.policies.filter((item) => !previous.auth.policies.includes(item))
    const removedPolicies = previous.auth.policies.filter((item) => !current.auth.policies.includes(item))
    const authentication = previous.auth.required === current.auth.required
      ? undefined
      : current.auth.required ? "required" : "removed"

    if (authentication || addedPermissions.length || removedPermissions.length || addedPolicies.length || removedPolicies.length) {
      output.push({
        surface: id,
        ...(authentication ? { authentication } : {}),
        addedPermissions,
        removedPermissions,
        addedPolicies,
        removedPolicies
      })
    }
  }

  return output.sort((left, right) => left.surface.localeCompare(right.surface))
}

function privilegeExpansion(beforePlan, afterPlan) {
  const before = indexBy(beforePlan.surfaces, (surface) => surface.id)
  const output = []

  for (const current of afterPlan.surfaces) {
    const previous = before.get(current.id)
    const previousByCapability = new Map((previous?.resourceAccess ?? []).map((item) => [item.capability, item]))

    for (const access of current.resourceAccess) {
      const old = previousByCapability.get(access.capability)
      if (access.unrestricted && !old?.unrestricted) {
        output.push({
          surface: current.id,
          capability: access.capability,
          addedOperations: ["*"],
          unrestricted: true
        })
        continue
      }
      if (old?.unrestricted) continue
      const priorOperations = new Set(old?.operations ?? [])
      const addedOperations = access.operations.filter((operation) => !priorOperations.has(operation))
      if (addedOperations.length) {
        output.push({
          surface: current.id,
          capability: access.capability,
          addedOperations,
          unrestricted: false
        })
      }
    }
  }

  return output.sort((left, right) =>
    left.surface.localeCompare(right.surface) || left.capability.localeCompare(right.capability)
  )
}

function semanticDiff(before, after, beforePlan, afterPlan) {
  const flattenRoutes = (graph) => graph.modules.flatMap((mod) => mod.endpoints.map((endpoint) => ({ module: mod.name, ...endpoint })))
  const flattenListeners = (graph) => graph.modules.flatMap((mod) => mod.listeners.map((listener) => ({ module: mod.name, ...listener })))
  const flattenJobs = (graph) => graph.modules.flatMap((mod) => mod.jobs.map((job) => ({ module: mod.name, ...job })))
  const flattenWorkflows = (graph) => graph.modules.flatMap((mod) => mod.workflows.map((workflow) => ({ module: mod.name, ...workflow })))
  const security = (graph) => flattenRoutes(graph).map((endpoint) => ({
    id: `${endpoint.module}.${endpoint.name}`,
    method: endpoint.method,
    path: endpoint.path,
    auth: endpoint.auth ?? { required: false, permissions: [], policies: [] }
  }))
  const resourceAccess = (plan) => plan.surfaces.map((surface) => ({
    id: surface.id,
    kind: surface.kind,
    resourceAccess: surface.resourceAccess,
    triggers: surface.triggers
  }))

  const beforeSecurity = security(before)
  const afterSecurity = security(after)

  return {
    schemaVersion: 2,
    from: before.name,
    to: after.name,
    modules: changedSet(before.modules, after.modules, (mod) => mod.name),
    routes: changedSet(flattenRoutes(before), flattenRoutes(after), (route) => `${route.method} ${route.path}`),
    security: changedSet(beforeSecurity, afterSecurity, (item) => item.id),
    impact: {
      authorization: authorizationImpact(beforeSecurity, afterSecurity),
      privilegeExpansion: privilegeExpansion(beforePlan, afterPlan)
    },
    capabilities: changedSet(before.capabilities, after.capabilities, (cap) => cap.name),
    resourceAccess: changedSet(resourceAccess(beforePlan), resourceAccess(afterPlan), (surface) => surface.id),
    listeners: changedSet(flattenListeners(before), flattenListeners(after), (listener) => `${listener.event}@${listener.version}:${listener.module}.${listener.name}`),
    jobs: changedSet(flattenJobs(before), flattenJobs(after), (job) => `${job.job}@${job.version}:${job.module}.${job.name}`),
    workflows: changedSet(flattenWorkflows(before), flattenWorkflows(after), (workflow) => `${workflow.workflow}@${workflow.version}:${workflow.module}.${workflow.name}`),
    deployment: changedSet(beforePlan.surfaces, afterPlan.surfaces, (surface) => surface.id),
    deploymentWarnings: changedSet(
      beforePlan.warnings,
      afterPlan.warnings,
      (warning) => `${warning.code}:${warning.surface}:${warning.capability}`
    )
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

if (command === "dev") {
  if (positional.length !== 1) fail("usage: arc dev <compiled-app.js> [--port <number>] [--no-open]")
  try {
    const application = await loadApplication(positional[0])
    buildApplication(application)
    await runDev(application, {
      port: parsed.options.get("--port"),
      open: !parsed.flags.has("--no-open")
    })
    await new Promise(() => {})
  } catch (error) {
    const payload = error && typeof error === "object" && "toJSON" in error ? error.toJSON() : { message: error instanceof Error ? error.message : String(error) }
    if (json) console.error(JSON.stringify({ ok: false, error: payload }))
    else console.error(`arc: ${payload.code ? `${payload.code} ` : ""}${payload.message}`)
    process.exit(1)
  }
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
    const diff = semanticDiff(
      inspect(beforeApp),
      inspect(afterApp),
      planDeployment(beforeApp),
      planDeployment(afterApp)
    )
    if (json) console.log(JSON.stringify(diff, null, 2))
    else {
      console.log(`${diff.from} -> ${diff.to}`)
      if (diff.impact.authorization.length || diff.impact.privilegeExpansion.length) {
        console.log("\nimpact")
        for (const item of diff.impact.authorization) {
          for (const permission of item.addedPermissions) console.log(`  ! ${item.surface} adds permission ${permission}`)
          for (const permission of item.removedPermissions) console.log(`  ! ${item.surface} removes permission ${permission}`)
          for (const policy of item.addedPolicies) console.log(`  ! ${item.surface} adds policy ${policy}`)
          for (const policy of item.removedPolicies) console.log(`  ! ${item.surface} removes policy ${policy}`)
          if (item.authentication === "removed") console.log(`  ! ${item.surface} no longer requires authentication`)
          if (item.authentication === "required") console.log(`  ! ${item.surface} now requires authentication`)
        }
        for (const item of diff.impact.privilegeExpansion) {
          console.log(`  ! ${item.surface} expands ${item.capability} access: +${item.addedOperations.join(",")}`)
        }
      }

      for (const [section, value] of Object.entries({
        modules: diff.modules,
        routes: diff.routes,
        security: diff.security,
        capabilities: diff.capabilities,
        resourceAccess: diff.resourceAccess,
        listeners: diff.listeners,
        jobs: diff.jobs,
        workflows: diff.workflows,
        deployment: diff.deployment,
        deploymentWarnings: diff.deploymentWarnings
      })) {
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
  fail("usage: arc <inspect|validate|plan> <compiled-app.js> [--json] | arc dev <app.js> [--port <number>] [--no-open] | arc context <app.js> <module> [--json] | arc diff <before.js> <after.js> [--json] | arc explain <ARCxxxx> [--json]")
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
