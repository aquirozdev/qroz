import type { AnyWorkflow } from "@arc/core"

export interface CloudflareWorkflowPlan {
  readonly schemaVersion: 1
  readonly workflow: string
  readonly version: number
  readonly start: string
  readonly states: readonly (
    | {
        readonly name: string
        readonly kind: "step.do"
        readonly next?: string
        readonly end: boolean
        readonly retry?: {
          readonly limit: number
          readonly delay: string
          readonly backoff: "constant" | "exponential"
        }
      }
    | {
        readonly name: string
        readonly kind: "step.sleep"
        readonly seconds: number
        readonly next: string
      }
    | {
        readonly name: string
        readonly kind: "succeed"
      }
  )[]
}

export function planCloudflareWorkflow(workflow: AnyWorkflow): CloudflareWorkflowPlan {
  return {
    schemaVersion: 1,
    workflow: workflow.name,
    version: workflow.version,
    start: workflow.start,
    states: Object.entries(workflow.states).map(([name, state]) => {
      if (state.kind === "arc.workflow-succeed") {
        return { name, kind: "succeed" as const }
      }
      if (state.kind === "arc.workflow-sleep") {
        return {
          name,
          kind: "step.sleep" as const,
          seconds: state.seconds,
          next: state.next
        }
      }
      return {
        name,
        kind: "step.do" as const,
        ...(state.next ? { next: state.next } : {}),
        end: state.end === true,
        ...(state.retry ? {
          retry: {
            limit: state.retry.maxAttempts,
            delay: `${state.retry.delaySeconds ?? 0} seconds`,
            backoff: state.retry.strategy === "exponential" ? "exponential" as const : "constant" as const
          }
        } : {})
      }
    })
  }
}
