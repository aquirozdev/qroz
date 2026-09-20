import test from "node:test"
import assert from "node:assert/strict"

import {
  app,
  buildApplication,
  inspect,
  module,
  workflow,
  workflowSucceed,
  workflowTask
} from "@arc/core"
import { executeWorkflow } from "@arc/workflows"
import { compileAwsStateMachine } from "@arc/workflows-aws"
import { planCloudflareWorkflow } from "@arc/workflows-cloudflare"
import application, { auditEntries } from "../dist/app.js"
import { WelcomeUser } from "../dist/workflows.js"
import { object, string } from "../dist/schema.js"

test("executes the reference workflow deterministically in memory", async () => {
  const sleeps = []
  const before = auditEntries.length
  const result = await executeWorkflow(application, WelcomeUser, {
    id: "123",
    name: "Angel"
  }, {
    workflowId: "wf-reference",
    clock: {
      async sleep(seconds) { sleeps.push(seconds) }
    }
  })

  assert.equal(result.workflowId, "wf-reference")
  assert.equal(result.transitions, 4)
  assert.deepEqual(result.output, {
    id: "123",
    name: "Angel",
    message: "welcome:Angel"
  })
  assert.deepEqual(sleeps, [2])
  assert.equal(auditEntries.length, before + 1)
  assert.equal(auditEntries.at(-1), "workflow:wf-reference:123:welcome:Angel")
})

test("workflow task retries use explicit total-attempt semantics", async () => {
  const Input = object({ value: string() })
  let attempts = 0
  const retrying = workflow({
    name: "test.retry",
    version: 1,
    input: Input,
    start: "work",
    states: {
      work: workflowTask({
        end: true,
        retry: {
          maxAttempts: 3,
          strategy: "exponential",
          delaySeconds: 1,
          maxDelaySeconds: 10
        },
        handler(input) {
          attempts += 1
          if (attempts < 3) throw new Error("retry")
          return input
        }
      })
    }
  })
  const definition = app({
    name: "retry",
    modules: [module({ name: "retry", endpoints: {}, workflows: { retrying } })]
  })
  const sleeps = []
  const result = await executeWorkflow(definition, retrying, { value: "ok" }, {
    workflowId: "wf-retry",
    clock: { async sleep(seconds) { sleeps.push(seconds) } }
  })

  assert.equal(attempts, 3)
  assert.deepEqual(sleeps, [1, 2])
  assert.deepEqual(result.output, { value: "ok" })
})

test("workflow graphs fail build when transitions are invalid", () => {
  const Input = object({ value: string() })
  const broken = workflow({
    name: "test.broken",
    version: 1,
    input: Input,
    start: "missing",
    states: {
      done: workflowSucceed()
    }
  })
  const definition = app({
    name: "broken-workflow",
    modules: [module({ name: "broken", endpoints: {}, workflows: { broken } })]
  })

  assert.throws(
    () => buildApplication(definition),
    (error) => error.code === "ARC1011"
  )
})

test("Application Graph exposes portable workflow states and dependencies", () => {
  const graph = inspect(application)
  assert.equal(graph.schemaVersion, 7)
  const mod = graph.modules.find((item) => item.name === "workflow-examples")
  const item = mod.workflows.find((candidate) => candidate.workflow === "users.welcome")
  assert.equal(item.start, "prepare")
  assert.deepEqual(item.states.map((state) => [state.name, state.kind]), [
    ["prepare", "task"],
    ["settle", "sleep"],
    ["audit", "task"],
    ["done", "succeed"]
  ])
  assert.deepEqual(item.states.find((state) => state.name === "audit").requires, ["audit.sink"])
})

test("AWS workflow compiler emits explicit Step Functions states", () => {
  const compiled = compileAwsStateMachine(WelcomeUser, {
    prepare: "arn:aws:lambda:us-east-1:123456789012:function:prepare",
    audit: "arn:aws:lambda:us-east-1:123456789012:function:audit"
  })

  assert.equal(compiled.StartAt, "prepare")
  assert.deepEqual(compiled.States.settle, {
    Type: "Wait",
    Seconds: 2,
    Next: "audit"
  })
  assert.deepEqual(compiled.States.audit.Retry, [{
    ErrorEquals: ["States.ALL"],
    IntervalSeconds: 1,
    MaxAttempts: 2,
    BackoffRate: 2,
    MaxDelaySeconds: 5
  }])
  assert.deepEqual(compiled.States.done, { Type: "Succeed" })
})

test("Cloudflare workflow planner preserves durable step and sleep semantics", () => {
  const plan = planCloudflareWorkflow(WelcomeUser)
  assert.equal(plan.workflow, "users.welcome")
  assert.equal(plan.start, "prepare")
  assert.deepEqual(plan.states.find((state) => state.name === "settle"), {
    name: "settle",
    kind: "step.sleep",
    seconds: 2,
    next: "audit"
  })
  assert.deepEqual(plan.states.find((state) => state.name === "audit").retry, {
    limit: 3,
    delay: "1 seconds",
    backoff: "exponential"
  })
})
