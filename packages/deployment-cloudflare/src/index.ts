import type { DeploymentPlan } from "@qroz/deployment"

export type CloudflareResource =
  | { readonly kind: "r2"; readonly binding: string; readonly bucket: string }
  | { readonly kind: "queue"; readonly binding: string; readonly queue: string }
  | { readonly kind: "durable-object"; readonly binding: string; readonly className: string }

export interface CloudflareSurfacePlan {
  readonly surface: string
  readonly bindings: readonly {
    capability: string
    binding: string
    kind: CloudflareResource["kind"]
    operations: readonly string[]
  }[]
  readonly queueConsumers: readonly {
    capability: string
    queue: string
  }[]
}

export interface CloudflareDeploymentPlan {
  readonly schemaVersion: 1
  readonly surfaces: readonly CloudflareSurfacePlan[]
  readonly warnings: readonly string[]
}

export function planCloudflareBindings(
  plan: DeploymentPlan,
  resources: Readonly<Record<string, CloudflareResource>>
): CloudflareDeploymentPlan {
  const warnings = [...plan.warnings.map((warning) => warning.message)]
  const surfaces: CloudflareSurfacePlan[] = []

  for (const surface of plan.surfaces) {
    const bindings: CloudflareSurfacePlan["bindings"][number][] = []
    const queueConsumers: CloudflareSurfacePlan["queueConsumers"][number][] = []

    for (const access of surface.resourceAccess) {
      const resource = resources[access.capability]
      if (!resource) {
        warnings.push(`${surface.id} references '${access.capability}' without a Cloudflare resource mapping`)
        continue
      }
      bindings.push({
        capability: access.capability,
        binding: resource.binding,
        kind: resource.kind,
        operations: access.operations
      })
    }

    for (const trigger of surface.triggers) {
      const resource = resources[trigger.capability]
      if (!resource) {
        warnings.push(`${surface.id} trigger references '${trigger.capability}' without a Cloudflare resource mapping`)
        continue
      }
      if (resource.kind === "queue") {
        queueConsumers.push({ capability: trigger.capability, queue: resource.queue })
      }
    }

    surfaces.push({ surface: surface.id, bindings, queueConsumers })
  }

  return { schemaVersion: 1, surfaces, warnings }
}
