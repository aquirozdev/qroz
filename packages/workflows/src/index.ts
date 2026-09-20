import {
  ArcError,
  ValidationError,
  buildApplication,
  createCapabilityResolver,
  validateSchema,
  type AppDefinition,
  type AnyWorkflow,
  type MaybePromise,
  type Provider,
  type WorkflowRetryPolicy,
  type WorkflowTaskState
} from "@qroz/core"

export interface WorkflowClock {
  sleep(seconds: number): Promise<void>
}

const systemClock: WorkflowClock = {
  sleep(seconds) {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
  }
}

export interface ExecuteWorkflowOptions {
  readonly workflowId?: string
  readonly providers?: readonly Provider<any>[]
  readonly clock?: WorkflowClock
  readonly maxTransitions?: number
}

export interface WorkflowExecutionResult {
  readonly workflowId: string
  readonly output: unknown
  readonly transitions: number
}

function retryDelay(policy: WorkflowRetryPolicy, attempt: number): number {
  const base = policy.delaySeconds ?? 0
  const calculated = policy.strategy === "exponential"
    ? base * Math.pow(2, Math.max(0, attempt - 1))
    : base
  return policy.maxDelaySeconds === undefined
    ? calculated
    : Math.min(calculated, policy.maxDelaySeconds)
}

async function executeTask(
  state: WorkflowTaskState,
  input: unknown,
  context: {
    readonly resolver: ReturnType<typeof createCapabilityResolver>
    readonly workflowId: string
    readonly stateName: string
    readonly clock: WorkflowClock
  }
): Promise<unknown> {
  const maxAttempts = state.retry?.maxAttempts ?? 1
  let attempt = 0

  while (attempt < maxAttempts) {
    attempt += 1
    try {
      return await state.handler(input, {
        ...context.resolver,
        workflowId: context.workflowId,
        state: context.stateName,
        attempt
      })
    } catch (error) {
      if (attempt >= maxAttempts) throw error
      const seconds = retryDelay(state.retry!, attempt)
      if (seconds > 0) await context.clock.sleep(seconds)
    }
  }

  throw new Error("Unreachable workflow retry state")
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

export async function executeWorkflow(
  application: AppDefinition,
  definition: AnyWorkflow,
  input: unknown,
  options: ExecuteWorkflowOptions = {}
): Promise<WorkflowExecutionResult> {
  const workflow = registeredWorkflow(application, definition)
  if (!workflow) {
    throw new ArcError("ARC1011", `Workflow '${definition.name}@${definition.version}' is not registered in application '${application.name}'`)
  }

  const built = buildApplication(application, {
    providers: options.providers ?? []
  })

  let data: unknown
  try {
    data = await validateSchema(workflow.input, input)
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new ArcError("ARC2004", `Workflow '${workflow.name}@${workflow.version}' input failed its declared schema`, {
        workflow: workflow.name,
        version: workflow.version,
        issues: error.issues
      })
    }
    throw error
  }

  const workflowId = options.workflowId ?? crypto.randomUUID()
  const clock = options.clock ?? systemClock
  const maxTransitions = options.maxTransitions ?? 1000
  let stateName = workflow.start
  let transitions = 0

  while (true) {
    transitions += 1
    if (transitions > maxTransitions) {
      throw new ArcError("ARC1011", `Workflow '${workflow.name}@${workflow.version}' exceeded the transition limit`, {
        workflow: workflow.name,
        version: workflow.version,
        maxTransitions
      })
    }

    const state = workflow.states[stateName]
    if (!state) {
      throw new ArcError("ARC1011", `Workflow entered unknown state '${stateName}'`, {
        workflow: workflow.name,
        version: workflow.version,
        state: stateName
      })
    }

    if (state.kind === "qroz.workflow-succeed") {
      return { workflowId, output: data, transitions }
    }

    if (state.kind === "qroz.workflow-sleep") {
      await clock.sleep(state.seconds)
      stateName = state.next
      continue
    }

    const owner = `workflow:${workflow.name}@${workflow.version}.${stateName}`
    const resolver = createCapabilityResolver(built, state.requires ?? [], owner)
    for (const requirement of state.requires ?? []) {
      const target = requirement.kind === "qroz.capability-access" ? requirement.capability : requirement
      resolver.use(target)
    }

    data = await executeTask(state, data, {
      resolver,
      workflowId,
      stateName,
      clock
    })

    if (state.end) {
      return { workflowId, output: data, transitions }
    }
    stateName = state.next!
  }
}
