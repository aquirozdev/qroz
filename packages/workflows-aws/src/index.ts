import type { AnyWorkflow, WorkflowRetryPolicy } from "@qroz/core"

export interface AwsWorkflowTaskResources {
  readonly [stateName: string]: string
}

export interface AwsStateMachineDefinition {
  readonly Comment: string
  readonly StartAt: string
  readonly States: Readonly<Record<string, Record<string, unknown>>>
}

function retry(policy: WorkflowRetryPolicy): Record<string, unknown>[] {
  const interval = Math.max(1, policy.delaySeconds ?? 1)
  return [{
    ErrorEquals: ["States.ALL"],
    IntervalSeconds: interval,
    MaxAttempts: Math.max(0, policy.maxAttempts - 1),
    ...(policy.strategy === "exponential" ? { BackoffRate: 2 } : {}),
    ...(policy.maxDelaySeconds === undefined ? {} : { MaxDelaySeconds: policy.maxDelaySeconds })
  }]
}

export function compileAwsStateMachine(
  workflow: AnyWorkflow,
  resources: AwsWorkflowTaskResources
): AwsStateMachineDefinition {
  const states: Record<string, Record<string, unknown>> = {}

  for (const [name, state] of Object.entries(workflow.states)) {
    if (state.kind === "qroz.workflow-succeed") {
      states[name] = { Type: "Succeed" }
      continue
    }

    if (state.kind === "qroz.workflow-sleep") {
      states[name] = {
        Type: "Wait",
        Seconds: state.seconds,
        Next: state.next
      }
      continue
    }

    const resource = resources[name]
    if (!resource) {
      throw new Error(`Workflow task '${name}' has no AWS resource mapping`)
    }
    states[name] = {
      Type: "Task",
      Resource: resource,
      ...(state.retry ? { Retry: retry(state.retry) } : {}),
      ...(state.end ? { End: true } : { Next: state.next })
    }
  }

  return {
    Comment: `Qroz workflow ${workflow.name}@${workflow.version}`,
    StartAt: workflow.start,
    States: states
  }
}
