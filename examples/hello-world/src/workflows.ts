import { module, workflow, workflowSleep, workflowSucceed, workflowTask } from "@arc/core"
import { auditSink } from "./users.js"
import { object, string } from "./schema.js"

const WelcomeInput = object({
  id: string({ min: 1 }),
  name: string({ min: 1 })
})

export const WelcomeUser = workflow({
  name: "users.welcome",
  version: 1,
  input: WelcomeInput,
  start: "prepare",
  states: {
    prepare: workflowTask({
      next: "settle",
      handler(input) {
        const value = input as { id: string; name: string }
        return { ...value, message: `welcome:${value.name}` }
      }
    }),
    settle: workflowSleep(2, "audit"),
    audit: workflowTask({
      requires: [auditSink],
      retry: {
        maxAttempts: 3,
        strategy: "exponential",
        delaySeconds: 1,
        maxDelaySeconds: 5
      },
      next: "done",
      async handler(input, ctx) {
        const value = input as { id: string; name: string; message: string }
        await ctx.use(auditSink).write(`workflow:${ctx.workflowId}:${value.id}:${value.message}`)
        return value
      }
    }),
    done: workflowSucceed()
  }
})

export const workflowExamples = module({
  name: "workflow-examples",
  endpoints: {},
  workflows: { WelcomeUser }
})
