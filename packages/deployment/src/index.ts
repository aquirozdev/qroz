import {
  inspect,
  requirementCapability,
  requirementOperations,
  type AppDefinition,
  type CapabilityRequirement
} from "@qroz/core"

export type ExecutionSurfaceKind = "endpoint" | "listener" | "job" | "workflow-task"

export interface PlannedResourceAccess {
  readonly capability: string
  readonly resourceType?: string
  readonly operations: readonly string[]
  readonly unrestricted: boolean
  readonly reason: "declared" | "job-dispatch" | "job-idempotency"
}

export interface PlannedTrigger {
  readonly capability: string
  readonly resourceType?: string
  readonly operation: "consume"
  readonly reason: "job-transport"
}

export interface DeploymentSurface {
  readonly id: string
  readonly kind: ExecutionSurfaceKind
  readonly module: string
  readonly name: string
  readonly resourceAccess: readonly PlannedResourceAccess[]
  readonly triggers: readonly PlannedTrigger[]
}

export interface DeploymentWarning {
  readonly code: "ARCDEPLOY001"
  readonly surface: string
  readonly capability: string
  readonly message: string
}

export interface DeploymentPlan {
  readonly schemaVersion: 1
  readonly app: string
  readonly surfaces: readonly DeploymentSurface[]
  readonly warnings: readonly DeploymentWarning[]
}

function accessFromRequirements(
  requirements: readonly CapabilityRequirement<any, any>[],
  reason: PlannedResourceAccess["reason"] = "declared"
): PlannedResourceAccess[] {
  const output: PlannedResourceAccess[] = []

  for (const requirement of requirements) {
    const capability = requirementCapability(requirement)
    if (capability.metadata?.kind !== "resource") continue
    const operations = requirementOperations(requirement)
    output.push({
      capability: capability.name,
      ...(capability.metadata.resourceType ? { resourceType: capability.metadata.resourceType } : {}),
      operations: operations ? [...operations] : ["*"],
      unrestricted: !operations,
      reason
    })
  }

  return output
}

function mergeAccess(items: readonly PlannedResourceAccess[]): PlannedResourceAccess[] {
  const merged = new Map<string, PlannedResourceAccess>()
  for (const item of items) {
    const key = `${item.capability}:${item.reason}`
    const current = merged.get(key)
    if (!current) {
      merged.set(key, item)
      continue
    }
    const unrestricted = current.unrestricted || item.unrestricted
    const operations = unrestricted
      ? ["*"]
      : [...new Set([...current.operations, ...item.operations])]
    merged.set(key, { ...current, operations, unrestricted })
  }
  return [...merged.values()]
}

export function planDeployment(application: AppDefinition): DeploymentPlan {
  const graph = inspect(application)
  const capabilityByName = new Map(graph.capabilities.map((item) => [item.name, item]))
  const jobByKey = new Map<string, { transport: string }>()
  for (const module of graph.modules) {
    for (const job of module.jobs) jobByKey.set(`${job.job}@${job.version}`, { transport: job.transport })
  }

  const surfaces: DeploymentSurface[] = []

  for (const module of application.modules) {
    for (const [name, endpoint] of Object.entries(module.endpoints)) {
      const dispatchAccess: PlannedResourceAccess[] = []
      for (const dispatched of endpoint.dispatches ?? []) {
        const job = jobByKey.get(`${dispatched.name}@${dispatched.version}`)
        if (!job) continue
        const capability = capabilityByName.get(job.transport)
        dispatchAccess.push({
          capability: job.transport,
          ...(capability?.resourceType ? { resourceType: capability.resourceType } : {}),
          operations: ["publish"],
          unrestricted: false,
          reason: "job-dispatch"
        })
      }

      const policyRequirements = (endpoint.auth?.policies ?? []).flatMap((policy) => policy.requires ?? [])

      surfaces.push({
        id: `endpoint:${module.name}.${name}`,
        kind: "endpoint",
        module: module.name,
        name,
        resourceAccess: mergeAccess([
          ...accessFromRequirements(endpoint.requires ?? []),
          ...accessFromRequirements(policyRequirements),
          ...dispatchAccess
        ]),
        triggers: []
      })
    }

    for (const [name, listener] of Object.entries(module.listeners ?? {})) {
      const dispatchAccess: PlannedResourceAccess[] = []
      for (const dispatched of listener.dispatches ?? []) {
        const job = jobByKey.get(`${dispatched.name}@${dispatched.version}`)
        if (!job) continue
        const capability = capabilityByName.get(job.transport)
        dispatchAccess.push({
          capability: job.transport,
          ...(capability?.resourceType ? { resourceType: capability.resourceType } : {}),
          operations: ["publish"],
          unrestricted: false,
          reason: "job-dispatch"
        })
      }

      surfaces.push({
        id: `listener:${module.name}.${name}`,
        kind: "listener",
        module: module.name,
        name,
        resourceAccess: mergeAccess([
          ...accessFromRequirements(listener.requires ?? []),
          ...dispatchAccess
        ]),
        triggers: []
      })
    }

    for (const [name, job] of Object.entries(module.jobs ?? {})) {
      const transport = capabilityByName.get(job.transport.name)
      const idempotency: PlannedResourceAccess[] = job.idempotency
        ? [{
            capability: job.idempotency.store.name,
            ...(job.idempotency.store.metadata?.resourceType
              ? { resourceType: job.idempotency.store.metadata.resourceType }
              : {}),
            operations: ["claim", "complete", "release"],
            unrestricted: false,
            reason: "job-idempotency"
          }]
        : []

      surfaces.push({
        id: `job:${module.name}.${name}`,
        kind: "job",
        module: module.name,
        name,
        resourceAccess: mergeAccess([
          ...accessFromRequirements(job.requires ?? []),
          ...idempotency
        ]),
        triggers: [{
          capability: job.transport.name,
          ...(transport?.resourceType ? { resourceType: transport.resourceType } : {}),
          operation: "consume",
          reason: "job-transport"
        }]
      })
    }

    for (const [workflowName, workflow] of Object.entries(module.workflows ?? {})) {
      for (const [stateName, state] of Object.entries(workflow.states)) {
        if (state.kind !== "qroz.workflow-task") continue
        surfaces.push({
          id: `workflow-task:${module.name}.${workflowName}.${stateName}`,
          kind: "workflow-task",
          module: module.name,
          name: `${workflowName}.${stateName}`,
          resourceAccess: mergeAccess(accessFromRequirements(state.requires ?? [])),
          triggers: []
        })
      }
    }
  }

  const warnings: DeploymentWarning[] = surfaces.flatMap((surface) =>
    surface.resourceAccess
      .filter((item) => item.unrestricted)
      .map((item) => ({
        code: "ARCDEPLOY001" as const,
        surface: surface.id,
        capability: item.capability,
        message: `${surface.id} has unrestricted access to resource capability '${item.capability}'`
      }))
  )

  return {
    schemaVersion: 1,
    app: application.name,
    surfaces,
    warnings
  }
}
