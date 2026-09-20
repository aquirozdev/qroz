#!/usr/bin/env node
import { performance } from "node:perf_hooks"
import { spawn } from "node:child_process"
import { app, buildApplication, endpoint, inspect, module } from "../packages/core/dist/index.js"
import { planDeployment } from "../packages/deployment/dist/index.js"
import { createTestClient } from "../packages/testing/dist/index.js"

const schema = {
  "~standard": {
    version: 1,
    vendor: "arc-dx-benchmark",
    validate(value) {
      return { value }
    }
  }
}

function syntheticApp(name, moduleCount, endpointsPerModule) {
  const modules = []
  for (let moduleIndex = 0; moduleIndex < moduleCount; moduleIndex += 1) {
    const endpoints = {}
    for (let endpointIndex = 0; endpointIndex < endpointsPerModule; endpointIndex += 1) {
      const endpointName = `endpoint${endpointIndex}`
      endpoints[endpointName] = endpoint({
        method: "GET",
        path: `/m${moduleIndex}/e${endpointIndex}/:id`,
        input: { params: schema },
        output: schema,
        handler(ctx) {
          return { id: ctx.input.params?.id ?? "x" }
        }
      })
    }
    modules.push(module({
      name: `module${moduleIndex}`,
      endpoints
    }))
  }
  return app({ name, modules })
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

function measure(label, operation, iterations = 7) {
  operation()
  const samples = []
  for (let index = 0; index < iterations; index += 1) {
    const start = performance.now()
    operation()
    samples.push(performance.now() - start)
  }
  return {
    label,
    medianMs: Number(median(samples).toFixed(2)),
    maxMs: Number(Math.max(...samples).toFixed(2))
  }
}

function processTime(args) {
  return new Promise((resolveRun, reject) => {
    const start = performance.now()
    const child = spawn(process.execPath, ["packages/cli/bin/arc.mjs", ...args], {
      cwd: process.cwd(),
      stdio: ["ignore", "ignore", "pipe"]
    })
    let stderr = ""
    child.stderr.setEncoding("utf8")
    child.stderr.on("data", (chunk) => { stderr += chunk })
    child.once("error", reject)
    child.once("exit", (code) => {
      if (code !== 0) reject(new Error(`CLI benchmark failed: ${stderr}`))
      else resolveRun(performance.now() - start)
    })
  })
}

const fixtures = [
  { name: "small", modules: 5, endpoints: 5 },
  { name: "medium", modules: 25, endpoints: 8 },
  { name: "large", modules: 80, endpoints: 10 }
]

const results = []

for (const fixture of fixtures) {
  const application = syntheticApp(
    `benchmark-${fixture.name}`,
    fixture.modules,
    fixture.endpoints
  )
  const surfaces = fixture.modules * fixture.endpoints

  results.push({
    fixture: fixture.name,
    modules: fixture.modules,
    endpoints: surfaces,
    metrics: [
      measure("build", () => buildApplication(application)),
      measure("inspect", () => inspect(application)),
      measure("plan", () => planDeployment(application))
    ]
  })
}

const smallApp = syntheticApp("benchmark-test-client", 5, 5)
const clientMetric = measure("test-client", () => createTestClient(smallApp))
results[0].metrics.push(clientMetric)

const cliSamples = []
for (let index = 0; index < 5; index += 1) {
  cliSamples.push(await processTime(["inspect", "examples/taskboard/dist/app.js", "--json"]))
}
const cliMedian = median(cliSamples)

const budgets = {
  small: { build: 120, inspect: 120, plan: 160, "test-client": 120 },
  medium: { build: 350, inspect: 350, plan: 500 },
  large: { build: 1500, inspect: 1500, plan: 2200 },
  cliInspect: 900
}

const failures = []
for (const result of results) {
  for (const metric of result.metrics) {
    const budget = budgets[result.fixture]?.[metric.label]
    if (budget !== undefined && metric.medianMs > budget) {
      failures.push(
        `${result.fixture} ${metric.label}: ${metric.medianMs}ms > ${budget}ms budget`
      )
    }
  }
}
if (cliMedian > budgets.cliInspect) {
  failures.push(`CLI inspect: ${cliMedian.toFixed(2)}ms > ${budgets.cliInspect}ms budget`)
}

const report = {
  schemaVersion: 1,
  node: process.version,
  platform: process.platform,
  generatedAt: new Date().toISOString(),
  results,
  cli: {
    inspectTaskboardMedianMs: Number(cliMedian.toFixed(2)),
    budgetMs: budgets.cliInspect
  },
  budgets
}

console.log(JSON.stringify(report, null, 2))

if (failures.length) {
  console.error("\nDX performance budget failures:")
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}
