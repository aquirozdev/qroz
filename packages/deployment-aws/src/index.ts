import type { DeploymentPlan, PlannedResourceAccess } from "@qroz/deployment"

export type AwsResource =
  | { readonly kind: "s3"; readonly bucketArn: string }
  | { readonly kind: "sqs"; readonly queueArn: string }
  | { readonly kind: "dynamodb"; readonly tableArn: string }

export interface AwsIamStatement {
  readonly Effect: "Allow"
  readonly Action: readonly string[]
  readonly Resource: string | readonly string[]
}

export interface AwsSurfaceIamPlan {
  readonly surface: string
  readonly statements: readonly AwsIamStatement[]
}

export interface AwsIamPlan {
  readonly schemaVersion: 1
  readonly surfaces: readonly AwsSurfaceIamPlan[]
  readonly warnings: readonly string[]
}

function statementForAccess(access: PlannedResourceAccess, resource: AwsResource): AwsIamStatement[] {
  if (resource.kind === "s3") {
    const actionByOperation: Record<string, string[]> = {
      read: ["s3:GetObject"],
      write: ["s3:PutObject"],
      delete: ["s3:DeleteObject"]
    }
    if (access.unrestricted) {
      return [{
        Effect: "Allow",
        Action: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
        Resource: `${resource.bucketArn}/*`
      }]
    }
    const actions = [...new Set(access.operations.flatMap((operation) => actionByOperation[operation] ?? []))]
    return actions.length ? [{ Effect: "Allow", Action: actions, Resource: `${resource.bucketArn}/*` }] : []
  }

  if (resource.kind === "sqs") {
    const actions = access.unrestricted || access.operations.includes("publish")
      ? ["sqs:SendMessage"]
      : []
    return actions.length ? [{ Effect: "Allow", Action: actions, Resource: resource.queueArn }] : []
  }

  if (resource.kind === "dynamodb") {
    const actionByOperation: Record<string, string[]> = {
      claim: ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:UpdateItem"],
      complete: ["dynamodb:UpdateItem"],
      release: ["dynamodb:DeleteItem"]
    }
    const actions = access.unrestricted
      ? ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem"]
      : [...new Set(access.operations.flatMap((operation) => actionByOperation[operation] ?? []))]
    return actions.length ? [{ Effect: "Allow", Action: actions, Resource: resource.tableArn }] : []
  }

  return []
}

export function planAwsIam(
  plan: DeploymentPlan,
  resources: Readonly<Record<string, AwsResource>>
): AwsIamPlan {
  const warnings = [...plan.warnings.map((warning) => warning.message)]
  const surfaces: AwsSurfaceIamPlan[] = []

  for (const surface of plan.surfaces) {
    const statements: AwsIamStatement[] = []

    for (const access of surface.resourceAccess) {
      const resource = resources[access.capability]
      if (!resource) {
        warnings.push(`${surface.id} references '${access.capability}' without an AWS resource mapping`)
        continue
      }
      statements.push(...statementForAccess(access, resource))
    }

    for (const trigger of surface.triggers) {
      const resource = resources[trigger.capability]
      if (!resource) {
        warnings.push(`${surface.id} trigger references '${trigger.capability}' without an AWS resource mapping`)
        continue
      }
      if (resource.kind === "sqs" && trigger.operation === "consume") {
        statements.push({
          Effect: "Allow",
          Action: ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"],
          Resource: resource.queueArn
        })
      }
    }

    surfaces.push({ surface: surface.id, statements })
  }

  return { schemaVersion: 1, surfaces, warnings }
}
