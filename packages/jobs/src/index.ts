import { noopTracer, type ArcTracer } from "@arc/telemetry"
import {
  ArcError,
  ValidationError,
  buildApplication,
  createCapabilityResolver,
  validateSchema,
  type AnyJob,
  type AppDefinition,
  type JobEnvelope,
  type Provider
} from "@arc/core"

export class NonRetryableJobError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "NonRetryableJobError"
  }
}

export type JobExecutionOutcome =
  | { readonly action: "ack"; readonly job: string; readonly version: number }
  | { readonly action: "retry"; readonly job: string; readonly version: number; readonly delaySeconds?: number; readonly error: unknown }
  | { readonly action: "discard"; readonly reason: "invalid-envelope" | "unknown-job" | "invalid-payload" | "non-retryable"; readonly error?: unknown }

export interface ExecuteJobOptions {
  readonly providers?: readonly Provider<any>[]
  readonly attempts?: number
  readonly onError?: (error: unknown) => void
  readonly tracer?: ArcTracer
}

export interface JobRegistryEntry {
  readonly moduleName: string
  readonly definitionName: string
  readonly definition: AnyJob
}

export function jobKey(name: string, version: number): string {
  return `${name}@${version}`
}

export function compileJobRegistry(application: AppDefinition): ReadonlyMap<string, JobRegistryEntry> {
  const registry = new Map<string, JobRegistryEntry>()
  for (const mod of application.modules) {
    for (const [definitionName, definition] of Object.entries(mod.jobs ?? {})) {
      registry.set(jobKey(definition.name, definition.version), { moduleName: mod.name, definitionName, definition })
    }
  }
  return registry
}

export function isJobEnvelope(value: unknown): value is JobEnvelope {
  if (!value || typeof value !== "object") return false
  const item = value as Record<string, unknown>
  return item.kind === "arc.job-message" &&
    item.schemaVersion === 1 &&
    typeof item.id === "string" &&
    typeof item.job === "string" &&
    Number.isInteger(item.version) &&
    typeof item.createdAt === "string" &&
    "payload" in item
}

export function retryDelaySeconds(definition: AnyJob, attempts: number): number | undefined {
  const retry = definition.retry
  if (!retry?.delaySeconds) return undefined
  const base = retry.delaySeconds
  if (retry.strategy !== "exponential") return base
  const calculated = base * (2 ** Math.max(0, attempts - 1))
  return retry.maxDelaySeconds === undefined ? calculated : Math.min(calculated, retry.maxDelaySeconds)
}

export async function executeJobEnvelope(
  application: AppDefinition,
  envelope: unknown,
  options: ExecuteJobOptions = {}
): Promise<JobExecutionOutcome> {
  if (!isJobEnvelope(envelope)) {
    return { action: "discard", reason: "invalid-envelope" }
  }

  const registry = compileJobRegistry(application)
  const entry = registry.get(jobKey(envelope.job, envelope.version))
  if (!entry) {
    return { action: "discard", reason: "unknown-job" }
  }

  const built = buildApplication(application, { providers: options.providers ?? [], allowMissingCapabilities: true })
  const owner = `${entry.moduleName}.${entry.definitionName}`

  let input: unknown
  try {
    input = await validateSchema(entry.definition.input, envelope.payload)
  } catch (error) {
    const mapped = error instanceof ValidationError
      ? new ArcError("ARC2003", `Job '${envelope.job}@${envelope.version}' payload failed its declared schema`, {
          owner,
          job: envelope.job,
          version: envelope.version,
          issues: error.issues
        })
      : error
    options.onError?.(mapped)
    return { action: "discard", reason: "invalid-payload", error: mapped }
  }

  try {
    const resolver = createCapabilityResolver(built, entry.definition.requires ?? [], owner)
    for (const target of entry.definition.requires ?? []) resolver.use(target)
    const tracer = options.tracer ?? noopTracer
    await tracer.enterSpan("arc.job", {
      "arc.app": application.name,
      "arc.module": entry.moduleName,
      "arc.job": entry.definition.name,
      "arc.job.version": entry.definition.version,
      "arc.job.attempts": options.attempts ?? 1
    }, async () => entry.definition.handler(input, {
      ...resolver,
      messageId: envelope.id,
      attempts: options.attempts ?? 1,
      ...(envelope.idempotencyKey ? { idempotencyKey: envelope.idempotencyKey } : {})
    }))
    return { action: "ack", job: envelope.job, version: envelope.version }
  } catch (error) {
    options.onError?.(error)
    if (error instanceof NonRetryableJobError) {
      return { action: "discard", reason: "non-retryable", error }
    }
    const delaySeconds = retryDelaySeconds(entry.definition, options.attempts ?? 1)
    return {
      action: "retry",
      job: envelope.job,
      version: envelope.version,
      ...(delaySeconds === undefined ? {} : { delaySeconds }),
      error
    }
  }
}
