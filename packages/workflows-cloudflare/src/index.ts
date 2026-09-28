import {
  QrozError,
  ValidationError,
  buildApplication,
  createCapabilityResolver,
  validateSchema,
  type AppDefinition,
  type AnyWorkflow,
  type MaybePromise,
  type Provider,
  type WorkflowRetryPolicy
} from "@qroz/core"

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
          readonly maxDelaySeconds?: number
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
      if (state.kind === "qroz.workflow-succeed") {
        return { name, kind: "succeed" as const }
      }
      if (state.kind === "qroz.workflow-sleep") {
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
            backoff: state.retry.strategy === "exponential" ? "exponential" as const : "constant" as const,
            ...(state.retry.maxDelaySeconds === undefined ? {} : { maxDelaySeconds: state.retry.maxDelaySeconds })
          }
        } : {})
      }
    })
  }
}

export interface CloudflareWorkflowEventLike<Payload = unknown> {
  readonly payload: Readonly<Payload>
  readonly instanceId: string
  readonly workflowName?: string
}

export interface CloudflareWorkflowStepContextLike {
  readonly attempt: number
}

export type CloudflareWorkflowDelay =
  | string
  | number
  | ((input: { readonly ctx: CloudflareWorkflowStepContextLike; readonly error: Error }) => string | number | Promise<string | number>)

export interface CloudflareWorkflowStepLike {
  do(
    name: string,
    config: {
      readonly retries: {
        readonly limit: number
        readonly delay: CloudflareWorkflowDelay
        readonly backoff?: "constant" | "linear" | "exponential"
      }
    },
    callback: (ctx: CloudflareWorkflowStepContextLike) => MaybePromise<unknown>
  ): Promise<unknown>
  sleep(name: string, duration: string | number): Promise<void>
}

export interface ExecuteCloudflareWorkflowOptions {
  readonly providers?: readonly Provider<any>[]
  readonly maxTransitions?: number
}

export interface CloudflareWorkflowExecutionResult {
  readonly workflowId: string
  readonly output: unknown
  readonly transitions: number
}

function registeredWorkflow(application: AppDefinition, target: AnyWorkflow): AnyWorkflow | undefined {
  for (const mod of application.modules) {
    for (const item of Object.values(mod.workflows ?? {})) {
      if (item === target) return item
      if (item.name === target.name && item.version === target.version) return item
    }
  }
  return undefined
}

function retryConfig(policy: WorkflowRetryPolicy | undefined): {
  readonly retries: {
    readonly limit: number
    readonly delay: CloudflareWorkflowDelay
    readonly backoff?: "constant" | "exponential"
  }
} {
  if (!policy) {
    return {
      retries: {
        limit: 1,
        delay: 0,
        backoff: "constant"
      }
    }
  }

  const baseSeconds = policy.delaySeconds ?? 0
  if (policy.strategy === "exponential" && policy.maxDelaySeconds !== undefined) {
    return {
      retries: {
        limit: policy.maxAttempts,
        delay: ({ ctx }) => Math.min(
          baseSeconds * Math.pow(2, Math.max(0, ctx.attempt - 1)),
          policy.maxDelaySeconds!
        ) * 1000
      }
    }
  }

  const delaySeconds = policy.maxDelaySeconds === undefined
    ? baseSeconds
    : Math.min(baseSeconds, policy.maxDelaySeconds)

  return {
    retries: {
      limit: policy.maxAttempts,
      delay: delaySeconds * 1000,
      backoff: policy.strategy === "exponential" ? "exponential" : "constant"
    }
  }
}

export async function executeCloudflareWorkflow(
  application: AppDefinition,
  definition: AnyWorkflow,
  event: CloudflareWorkflowEventLike,
  step: CloudflareWorkflowStepLike,
  options: ExecuteCloudflareWorkflowOptions = {}
): Promise<CloudflareWorkflowExecutionResult> {
  const workflow = registeredWorkflow(application, definition)
  if (!workflow) {
    throw new QrozError(
      "QROZ1011",
      `Workflow '${definition.name}@${definition.version}' is not registered in application '${application.name}'`
    )
  }

  const built = buildApplication(application, {
    providers: options.providers ?? []
  })

  let data: unknown
  try {
    data = await validateSchema(workflow.input, event.payload)
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new QrozError(
        "QROZ2004",
        `Workflow '${workflow.name}@${workflow.version}' input failed its declared schema`,
        {
          workflow: workflow.name,
          version: workflow.version,
          issues: error.issues
        }
      )
    }
    throw error
  }

  const workflowId = event.instanceId
  const maxTransitions = options.maxTransitions ?? 1000
  let transitions = 0
  let stateName = workflow.start

  while (true) {
    transitions += 1
    if (transitions > maxTransitions) {
      throw new QrozError(
        "QROZ1011",
        `Workflow '${workflow.name}@${workflow.version}' exceeded the transition limit`,
        {
          workflow: workflow.name,
          version: workflow.version,
          maxTransitions
        }
      )
    }

    const state = workflow.states[stateName]
    if (!state) {
      throw new QrozError("QROZ1011", `Workflow entered unknown state '${stateName}'`, {
        workflow: workflow.name,
        version: workflow.version,
        state: stateName
      })
    }

    if (state.kind === "qroz.workflow-succeed") {
      return { workflowId, output: data, transitions }
    }

    if (state.kind === "qroz.workflow-sleep") {
      await step.sleep(stateName, state.seconds * 1000)
      stateName = state.next
      continue
    }

    const owner = `workflow:${workflow.name}@${workflow.version}.${stateName}`
    const resolver = createCapabilityResolver(built, state.requires ?? [], owner)

    data = await step.do(
      stateName,
      retryConfig(state.retry),
      async (stepContext) => state.handler(data, {
        ...resolver,
        workflowId,
        state: stateName,
        attempt: stepContext.attempt
      })
    )

    if (state.end) {
      return { workflowId, output: data, transitions }
    }
    stateName = state.next!
  }
}
