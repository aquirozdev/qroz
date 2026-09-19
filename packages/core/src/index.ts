export type MaybePromise<T> = T | Promise<T>

export type StandardSchemaLike<Input = unknown, Output = Input> = {
  readonly "~standard": {
    readonly version: 1
    readonly vendor: string
    readonly validate: (value: unknown) => MaybePromise<
      | { value: Output; issues?: undefined }
      | { value?: undefined; issues: readonly { message: string; path?: readonly unknown[] }[] }
    >
    readonly types?: {
      readonly input: Input
      readonly output: Output
    }
  }
}

type InferOutput<S> = S extends StandardSchemaLike<any, infer Output> ? Output : never
type EmptySchema = undefined
type ParamsOf<S extends StandardSchemaLike | EmptySchema> = S extends StandardSchemaLike ? InferOutput<S> : Record<string, never>
type BodyOf<S extends StandardSchemaLike | EmptySchema> = S extends StandardSchemaLike ? InferOutput<S> : undefined
type QueryOf<S extends StandardSchemaLike | EmptySchema> = S extends StandardSchemaLike ? InferOutput<S> : Record<string, never>

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD"

let capabilityCounter = 0

export interface CapabilityMetadata {
  readonly kind?: "service" | "resource"
  readonly resourceType?: string
  readonly features?: readonly string[]
}

export interface Capability<T> {
  readonly kind: "arc.capability"
  readonly id: symbol
  readonly name: string
  readonly metadata?: CapabilityMetadata
  readonly _type?: T
}

export function capability<T>(name: string, metadata?: CapabilityMetadata): Capability<T> {
  return Object.freeze({
    kind: "arc.capability" as const,
    id: Symbol(`arc.capability.${name}.${capabilityCounter++}`),
    name,
    ...(metadata ? { metadata: Object.freeze({ ...metadata, ...(metadata.features ? { features: Object.freeze([...metadata.features]) } : {}) }) } : {})
  })
}

export interface Provider<T = unknown> {
  readonly kind: "arc.provider"
  readonly capability: Capability<T>
  readonly value: T
}

export function provide<T>(target: Capability<T>, value: T): Provider<T> {
  return Object.freeze({ kind: "arc.provider" as const, capability: target, value })
}

export interface ProviderScope {
  readonly providers: readonly Provider<any>[]
  readonly dispose?: () => MaybePromise<void>
}

export type ProviderSource = readonly Provider<any>[] | ProviderScope

export function providerScope(
  providers: readonly Provider<any>[],
  dispose?: () => MaybePromise<void>
): ProviderScope {
  return Object.freeze({
    providers: Object.freeze([...providers]),
    ...(dispose ? { dispose } : {})
  })
}

export function normalizeProviderSource(source: ProviderSource | undefined): ProviderScope {
  if (!source) return { providers: [] }
  return Array.isArray(source) ? { providers: source } : source as ProviderScope
}

export interface EventDefinition<Payload> {
  readonly kind: "arc.event"
  readonly name: string
  readonly version: number
  readonly _payload?: Payload
}

export function event<Payload>(name: string, options: { version?: number } = {}): EventDefinition<Payload> {
  return Object.freeze({ kind: "arc.event" as const, name, version: options.version ?? 1 })
}

export interface EmittedEvent<Payload> {
  readonly definition: EventDefinition<Payload>
  readonly payload: Payload
}

export function emit<Payload>(definition: EventDefinition<Payload>, payload: Payload): EmittedEvent<Payload> {
  return { definition, payload }
}

export interface CapabilityResolver {
  use<T>(target: Capability<T>): T
}

export interface EventPublisher {
  emit<Payload>(definition: EventDefinition<Payload>, payload: Payload): Promise<void>
}

export interface JobTransport {
  send(message: JobEnvelope, options?: { readonly delaySeconds?: number }): Promise<void>
}

export interface JobEnvelope {
  readonly kind: "arc.job-message"
  readonly schemaVersion: 1
  readonly id: string
  readonly job: string
  readonly version: number
  readonly payload: unknown
  readonly createdAt: string
  readonly idempotencyKey?: string
}

export type JobIdempotencyClaim =
  | { readonly acquired: true; readonly token: string }
  | { readonly acquired: false; readonly state: "processing"; readonly retryAfterSeconds?: number }
  | { readonly acquired: false; readonly state: "completed" }

export interface JobIdempotencyStore {
  claim(key: string, options: { readonly leaseSeconds: number }): Promise<JobIdempotencyClaim>
  complete(key: string, token: string, options?: { readonly ttlSeconds?: number }): Promise<boolean>
  release(key: string, token: string): Promise<boolean>
}

export interface JobIdempotencyPolicy<InputSchema extends StandardSchemaLike = StandardSchemaLike> {
  readonly store: Capability<JobIdempotencyStore>
  readonly key: (input: InferOutput<InputSchema>) => string
  readonly leaseSeconds?: number
  readonly ttlSeconds?: number
}

export interface JobRetryPolicy {
  readonly strategy?: "fixed" | "exponential"
  readonly delaySeconds?: number
  readonly maxDelaySeconds?: number
}

export interface JobExecutionContext extends CapabilityResolver {
  readonly messageId: string
  readonly attempts: number
  readonly idempotencyKey?: string
}

export interface JobDefinition<InputSchema extends StandardSchemaLike = StandardSchemaLike> {
  readonly kind: "arc.job"
  readonly name: string
  readonly version: number
  readonly transport: Capability<JobTransport>
  readonly input: InputSchema
  readonly requires?: readonly Capability<any>[]
  readonly retry?: JobRetryPolicy
  readonly idempotency?: JobIdempotencyPolicy<InputSchema>
  readonly handler: (input: InferOutput<InputSchema>, ctx: JobExecutionContext) => MaybePromise<void>
}

export type AnyJob = JobDefinition<any>

export function job<InputSchema extends StandardSchemaLike>(
  definition: Omit<JobDefinition<InputSchema>, "kind">
): JobDefinition<InputSchema> {
  return Object.freeze({ kind: "arc.job" as const, ...definition })
}

export interface JobDispatchOptions {
  readonly delaySeconds?: number
  readonly id?: string
}

export interface JobPublisher {
  dispatch<InputSchema extends StandardSchemaLike>(
    definition: JobDefinition<InputSchema>,
    payload: InferOutput<InputSchema>,
    options?: JobDispatchOptions
  ): Promise<string>
}

export interface EndpointContext<
  ParamsSchema extends StandardSchemaLike | EmptySchema,
  BodySchema extends StandardSchemaLike | EmptySchema,
  QuerySchema extends StandardSchemaLike | EmptySchema
> extends CapabilityResolver {
  request: Request
  events: EventPublisher
  jobs: JobPublisher
  input: {
    params: ParamsOf<ParamsSchema>
    body: BodyOf<BodySchema>
    query: QueryOf<QuerySchema>
  }
}

export interface EndpointDefinition<
  ParamsSchema extends StandardSchemaLike | EmptySchema = undefined,
  BodySchema extends StandardSchemaLike | EmptySchema = undefined,
  QuerySchema extends StandardSchemaLike | EmptySchema = undefined,
  OutputSchema extends StandardSchemaLike = StandardSchemaLike
> {
  readonly kind: "arc.endpoint"
  readonly method: HttpMethod
  readonly path: string
  readonly status?: number
  readonly requires?: readonly Capability<any>[]
  readonly emits?: readonly EventDefinition<any>[]
  readonly dispatches?: readonly AnyJob[]
  readonly input?: {
    readonly params?: ParamsSchema
    readonly body?: BodySchema
    readonly query?: QuerySchema
  }
  readonly output: OutputSchema
  readonly handler: (ctx: EndpointContext<ParamsSchema, BodySchema, QuerySchema>) => MaybePromise<InferOutput<OutputSchema>>
}

export type AnyEndpoint = EndpointDefinition<any, any, any, any>

export function endpoint<
  ParamsSchema extends StandardSchemaLike | EmptySchema = undefined,
  BodySchema extends StandardSchemaLike | EmptySchema = undefined,
  QuerySchema extends StandardSchemaLike | EmptySchema = undefined,
  OutputSchema extends StandardSchemaLike = StandardSchemaLike
>(definition: Omit<EndpointDefinition<ParamsSchema, BodySchema, QuerySchema, OutputSchema>, "kind">): EndpointDefinition<ParamsSchema, BodySchema, QuerySchema, OutputSchema> {
  return Object.freeze({ kind: "arc.endpoint" as const, ...definition })
}

export interface ListenerContext extends CapabilityResolver {
  events: EventPublisher
  jobs: JobPublisher
}

export interface ListenerDefinition<Payload> {
  readonly kind: "arc.listener"
  readonly event: EventDefinition<Payload>
  readonly requires?: readonly Capability<any>[]
  readonly emits?: readonly EventDefinition<any>[]
  readonly dispatches?: readonly AnyJob[]
  readonly handler: (payload: Payload, ctx: ListenerContext) => MaybePromise<void>
}

export type AnyListener = ListenerDefinition<any>

export function listener<Payload>(definition: Omit<ListenerDefinition<Payload>, "kind">): ListenerDefinition<Payload> {
  return Object.freeze({ kind: "arc.listener" as const, ...definition })
}

export interface ModuleDefinition<
  Endpoints extends Record<string, AnyEndpoint> = Record<string, AnyEndpoint>,
  Listeners extends Record<string, AnyListener> = Record<string, AnyListener>,
  Jobs extends Record<string, AnyJob> = Record<string, AnyJob>
> {
  readonly kind: "arc.module"
  readonly name: string
  readonly endpoints: Endpoints
  readonly listeners?: Listeners
  readonly jobs?: Jobs
}

export function module<
  const Endpoints extends Record<string, AnyEndpoint>,
  const Listeners extends Record<string, AnyListener> = Record<string, never>,
  const Jobs extends Record<string, AnyJob> = Record<string, never>
>(definition: Omit<ModuleDefinition<Endpoints, Listeners, Jobs>, "kind">): ModuleDefinition<Endpoints, Listeners, Jobs> {
  return Object.freeze({ kind: "arc.module" as const, ...definition })
}

export interface AppDefinition<Modules extends readonly ModuleDefinition[] = readonly ModuleDefinition[]> {
  readonly kind: "arc.app"
  readonly name: string
  readonly modules: Modules
  readonly providers?: readonly Provider<any>[]
}

export function app<const Modules extends readonly ModuleDefinition[]>(definition: Omit<AppDefinition<Modules>, "kind">): AppDefinition<Modules> {
  return Object.freeze({ kind: "arc.app" as const, ...definition })
}

export function withProviders<const Modules extends readonly ModuleDefinition[]>(
  application: AppDefinition<Modules>,
  providers: readonly Provider<any>[]
): AppDefinition<Modules> {
  return Object.freeze({
    ...application,
    providers: Object.freeze([...(application.providers ?? []), ...providers])
  })
}

export type ArcErrorCode =
  | "ARC1001"
  | "ARC1002"
  | "ARC1003"
  | "ARC1004"
  | "ARC1005"
  | "ARC1006"
  | "ARC1007"
  | "ARC1008"
  | "ARC1009"
  | "ARC2001"
  | "ARC2003"
  | "ARC2002"

export class ArcError extends Error {
  readonly code: ArcErrorCode
  readonly details: Record<string, unknown> | undefined

  constructor(code: ArcErrorCode, message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = "ArcError"
    this.code = code
    this.details = details
  }

  toJSON() {
    return { name: this.name, code: this.code, message: this.message, details: this.details }
  }
}

export interface BuiltApplication {
  readonly definition: AppDefinition
  readonly providers: ReadonlyMap<symbol, Provider<any>>
}

export interface BuildApplicationOptions {
  readonly providers?: readonly Provider<any>[]
  readonly allowMissingCapabilities?: boolean
}

export function buildApplication(application: AppDefinition, options: BuildApplicationOptions = {}): BuiltApplication {
  const moduleNames = new Set<string>()
  const routeKeys = new Set<string>()
  const jobKeys = new Set<string>()
  const providers = new Map<symbol, Provider<any>>()
  const capabilityNames = new Map<string, symbol>()

  const registerCapability = (target: Capability<any>, owner: string) => {
    const existing = capabilityNames.get(target.name)
    if (existing && existing !== target.id) {
      throw new ArcError("ARC1006", `Capability name '${target.name}' refers to multiple tokens`, { capability: target.name, owner })
    }
    capabilityNames.set(target.name, target.id)
  }

  for (const provider of [...(application.providers ?? []), ...(options.providers ?? [])]) {
    registerCapability(provider.capability, "providers")
    if (providers.has(provider.capability.id)) {
      throw new ArcError("ARC1003", `Duplicate provider for capability '${provider.capability.name}'`, {
        capability: provider.capability.name
      })
    }
    providers.set(provider.capability.id, provider)
  }

  for (const mod of application.modules) {
    if (moduleNames.has(mod.name)) {
      throw new ArcError("ARC1001", `Duplicate module name '${mod.name}'`, { module: mod.name })
    }
    moduleNames.add(mod.name)

    for (const [endpointName, ep] of Object.entries(mod.endpoints)) {
      for (const target of ep.requires ?? []) registerCapability(target, `${mod.name}.${endpointName}`)
      for (const dispatched of ep.dispatches ?? []) registerCapability(dispatched.transport, `${mod.name}.${endpointName}`)
      const routeKey = `${ep.method} ${ep.path}`
      if (routeKeys.has(routeKey)) {
        throw new ArcError("ARC1002", `Duplicate route '${routeKey}'`, { module: mod.name, endpoint: endpointName })
      }
      routeKeys.add(routeKey)
      validateRequiredCapabilities(providers, ep.requires ?? [], `${mod.name}.${endpointName}`, options.allowMissingCapabilities ?? false)
      validateRequiredCapabilities(providers, (ep.dispatches ?? []).map((item) => item.transport), `${mod.name}.${endpointName}`, options.allowMissingCapabilities ?? false)
    }

    for (const [listenerName, item] of Object.entries(mod.listeners ?? {})) {
      for (const target of item.requires ?? []) registerCapability(target, `${mod.name}.${listenerName}`)
      for (const dispatched of item.dispatches ?? []) registerCapability(dispatched.transport, `${mod.name}.${listenerName}`)
      validateRequiredCapabilities(providers, item.requires ?? [], `${mod.name}.${listenerName}`, options.allowMissingCapabilities ?? false)
      validateRequiredCapabilities(providers, (item.dispatches ?? []).map((job) => job.transport), `${mod.name}.${listenerName}`, options.allowMissingCapabilities ?? false)
    }

    for (const [jobName, item] of Object.entries(mod.jobs ?? {})) {
      const key = `${item.name}@${item.version}`
      if (jobKeys.has(key)) {
        throw new ArcError("ARC1008", `Duplicate job definition '${key}'`, { module: mod.name, job: jobName })
      }
      jobKeys.add(key)
      registerCapability(item.transport, `${mod.name}.${jobName}`)
      for (const target of item.requires ?? []) registerCapability(target, `${mod.name}.${jobName}`)
      if (item.idempotency) registerCapability(item.idempotency.store, `${mod.name}.${jobName}`)
      validateRequiredCapabilities(
        providers,
        [item.transport, ...(item.requires ?? []), ...(item.idempotency ? [item.idempotency.store] : [])],
        `${mod.name}.${jobName}`,
        options.allowMissingCapabilities ?? false
      )
    }
  }

  return Object.freeze({ definition: application, providers })
}

function validateRequiredCapabilities(
  providers: ReadonlyMap<symbol, Provider<any>>,
  required: readonly Capability<any>[],
  owner: string,
  allowMissing: boolean
) {
  for (const target of required) {
    if (!providers.has(target.id) && !allowMissing) {
      throw new ArcError("ARC1004", `${owner} requires capability '${target.name}', but no provider is configured`, {
        owner,
        capability: target.name
      })
    }
  }
}

export function createCapabilityResolver(
  built: BuiltApplication,
  allowed?: readonly Capability<any>[],
  owner = "runtime"
): CapabilityResolver {
  const allowedIds = allowed ? new Set(allowed.map((target) => target.id)) : undefined

  return {
    use<T>(target: Capability<T>): T {
      if (allowedIds && !allowedIds.has(target.id)) {
        throw new ArcError("ARC1005", `${owner} used capability '${target.name}' without declaring it in requires`, {
          owner,
          capability: target.name
        })
      }
      const provider = built.providers.get(target.id)
      if (!provider) {
        throw new ArcError("ARC1004", `Capability '${target.name}' has no configured provider`, {
          capability: target.name
        })
      }
      return provider.value as T
    }
  }
}

export interface ApplicationGraph {
  schemaVersion: 3
  name: string
  capabilities: Array<{
    name: string
    configured: boolean
    kind?: "service" | "resource"
    resourceType?: string
    features?: string[]
  }>
  providers: Array<{ capability: string }>
  modules: Array<{
    name: string
    endpoints: Array<{
      name: string
      method: HttpMethod
      path: string
      status: number
      requires: string[]
      emits: Array<{ event: string; version: number }>
      dispatches: Array<{ job: string; version: number }>
      hasParamsSchema: boolean
      hasBodySchema: boolean
      hasQuerySchema: boolean
      hasOutputSchema: boolean
    }>
    listeners: Array<{
      name: string
      event: string
      version: number
      requires: string[]
      emits: Array<{ event: string; version: number }>
      dispatches: Array<{ job: string; version: number }>
    }>
    jobs: Array<{
      name: string
      job: string
      version: number
      transport: string
      requires: string[]
      retry?: JobRetryPolicy
      idempotency?: { store: string; leaseSeconds: number; ttlSeconds?: number }
      hasInputSchema: boolean
    }>
  }>
}

export function inspect(application: AppDefinition): ApplicationGraph {
  const configured = new Set((application.providers ?? []).map((item) => item.capability.id))
  const capabilities = new Map<symbol, Capability<any>>()
  for (const provider of application.providers ?? []) capabilities.set(provider.capability.id, provider.capability)
  for (const mod of application.modules) {
    for (const ep of Object.values(mod.endpoints)) {
      for (const target of ep.requires ?? []) capabilities.set(target.id, target)
      for (const dispatched of ep.dispatches ?? []) capabilities.set(dispatched.transport.id, dispatched.transport)
    }
    for (const item of Object.values(mod.listeners ?? {})) {
      for (const target of item.requires ?? []) capabilities.set(target.id, target)
      for (const dispatched of item.dispatches ?? []) capabilities.set(dispatched.transport.id, dispatched.transport)
    }
    for (const item of Object.values(mod.jobs ?? {})) {
      capabilities.set(item.transport.id, item.transport)
      for (const target of item.requires ?? []) capabilities.set(target.id, target)
      if (item.idempotency) capabilities.set(item.idempotency.store.id, item.idempotency.store)
    }
  }

  return {
    schemaVersion: 3,
    name: application.name,
    capabilities: [...capabilities.values()].map((target) => ({
      name: target.name,
      configured: configured.has(target.id),
      ...(target.metadata?.kind ? { kind: target.metadata.kind } : {}),
      ...(target.metadata?.resourceType ? { resourceType: target.metadata.resourceType } : {}),
      ...(target.metadata?.features ? { features: [...target.metadata.features] } : {})
    })),
    providers: (application.providers ?? []).map((item) => ({ capability: item.capability.name })),
    modules: application.modules.map((mod) => ({
      name: mod.name,
      endpoints: Object.entries(mod.endpoints).map(([name, ep]) => ({
        name,
        method: ep.method,
        path: ep.path,
        status: ep.status ?? 200,
        requires: (ep.requires ?? []).map((item) => item.name),
        emits: (ep.emits ?? []).map((item) => ({ event: item.name, version: item.version })),
        dispatches: (ep.dispatches ?? []).map((item) => ({ job: item.name, version: item.version })),
        hasParamsSchema: Boolean(ep.input?.params),
        hasBodySchema: Boolean(ep.input?.body),
        hasQuerySchema: Boolean(ep.input?.query),
        hasOutputSchema: Boolean(ep.output)
      })),
      listeners: Object.entries(mod.listeners ?? {}).map(([name, item]) => ({
        name,
        event: item.event.name,
        version: item.event.version,
        requires: (item.requires ?? []).map((target) => target.name),
        emits: (item.emits ?? []).map((emitted) => ({ event: emitted.name, version: emitted.version })),
        dispatches: (item.dispatches ?? []).map((job) => ({ job: job.name, version: job.version }))
      })),
      jobs: Object.entries(mod.jobs ?? {}).map(([name, item]) => ({
        name,
        job: item.name,
        version: item.version,
        transport: item.transport.name,
        requires: (item.requires ?? []).map((target) => target.name),
        ...(item.retry ? { retry: item.retry } : {}),
        ...(item.idempotency ? {
          idempotency: {
            store: item.idempotency.store.name,
            leaseSeconds: item.idempotency.leaseSeconds ?? 60,
            ...(item.idempotency.ttlSeconds === undefined ? {} : { ttlSeconds: item.idempotency.ttlSeconds })
          }
        } : {}),
        hasInputSchema: Boolean(item.input)
      }))
    }))
  }
}

export async function validateSchema<S extends StandardSchemaLike>(schema: S, value: unknown): Promise<InferOutput<S>> {
  const result = await schema["~standard"].validate(value)
  if (result.issues) {
    throw new ValidationError(result.issues.map((issue) =>
      issue.path
        ? { message: issue.message, path: [...issue.path] }
        : { message: issue.message }
    ))
  }
  return result.value as InferOutput<S>
}

export interface ArcErrorDescriptor {
  readonly code: ArcErrorCode
  readonly title: string
  readonly remediation: string
}

const ARC_ERROR_CATALOG: Readonly<Record<ArcErrorCode, ArcErrorDescriptor>> = Object.freeze({
  ARC1001: { code: "ARC1001", title: "Duplicate module name", remediation: "Give every module a unique application-level name." },
  ARC1002: { code: "ARC1002", title: "Duplicate HTTP route", remediation: "Change the method/path pair or remove one of the conflicting endpoints." },
  ARC1003: { code: "ARC1003", title: "Duplicate capability provider", remediation: "Configure exactly one provider for each capability token in a runtime composition." },
  ARC1004: { code: "ARC1004", title: "Missing capability provider", remediation: "Provide the required capability in the application or from the runtime adapter." },
  ARC1005: { code: "ARC1005", title: "Undeclared capability use", remediation: "Add the capability to the endpoint/listener requires list before using ctx.use()." },
  ARC1006: { code: "ARC1006", title: "Ambiguous capability name", remediation: "Reuse the same capability token or give distinct capabilities unique semantic names." },
  ARC1007: { code: "ARC1007", title: "Undeclared event emission", remediation: "Add the event to the endpoint/listener emits list before calling ctx.events.emit()." },
  ARC1008: { code: "ARC1008", title: "Duplicate job definition", remediation: "Give every job name/version pair a unique definition in the application." },
  ARC1009: { code: "ARC1009", title: "Undeclared job dispatch", remediation: "Add the job to dispatches before calling ctx.jobs.dispatch()." },
  ARC2001: { code: "ARC2001", title: "Malformed JSON request", remediation: "Send syntactically valid JSON when using application/json." },
  ARC2003: { code: "ARC2003", title: "Invalid job payload", remediation: "Dispatch a payload accepted by the job input schema and keep producers/consumers on compatible job versions." },
  ARC2002: { code: "ARC2002", title: "Endpoint output contract violation", remediation: "Make the handler return a value accepted by its declared output schema." }
})

export function explainError(code: ArcErrorCode): ArcErrorDescriptor {
  return ARC_ERROR_CATALOG[code]
}

export type ValidationIssue = { message: string; path?: readonly unknown[] }

export class ValidationError extends Error {
  readonly issues: readonly ValidationIssue[]

  constructor(issues: readonly ValidationIssue[]) {
    super("Validation failed")
    this.name = "ValidationError"
    this.issues = issues
  }
}
