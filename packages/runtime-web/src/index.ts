import { noopTracer, type ArcTracer } from "@arc/telemetry"
import {
  type AnyEndpoint,
  type AnyListener,
  type AppDefinition,
  type EventDefinition,
  type JobDefinition,
  type Provider,
  ArcError,
  ValidationError,
  buildApplication,
  createCapabilityResolver,
  validateSchema
} from "@arc/core"

type CompiledRoute = {
  moduleName: string
  endpointName: string
  endpoint: AnyEndpoint
  pattern: URLPatternLike
}

type URLPatternLike = {
  match(pathname: string): Record<string, string> | null
}

type CompiledListener = {
  moduleName: string
  listenerName: string
  listener: AnyListener
}

function compilePath(path: string): URLPatternLike {
  const names: string[] = []
  const source = path
    .split("/")
    .map((segment) => {
      if (segment.startsWith(":")) {
        names.push(segment.slice(1))
        return "([^/]+)"
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    })
    .join("/")
  const regex = new RegExp(`^${source}/?$`)

  return {
    match(pathname: string) {
      const result = regex.exec(pathname)
      if (!result) return null
      const params: Record<string, string> = {}
      names.forEach((name, index) => {
        params[name] = decodeURIComponent(result[index + 1] ?? "")
      })
      return params
    }
  }
}

function compileRoutes(application: AppDefinition): CompiledRoute[] {
  const routes: CompiledRoute[] = []
  for (const mod of application.modules) {
    for (const [endpointName, endpoint] of Object.entries(mod.endpoints)) {
      routes.push({ moduleName: mod.name, endpointName, endpoint, pattern: compilePath(endpoint.path) })
    }
  }
  return routes
}

function compileListeners(application: AppDefinition): Map<string, CompiledListener[]> {
  const listeners = new Map<string, CompiledListener[]>()
  for (const mod of application.modules) {
    for (const [listenerName, listener] of Object.entries(mod.listeners ?? {})) {
      const key = eventKey(listener.event)
      const items = listeners.get(key) ?? []
      items.push({ moduleName: mod.name, listenerName, listener })
      listeners.set(key, items)
    }
  }
  return listeners
}

function eventKey(definition: EventDefinition<any>) {
  return `${definition.name}@${definition.version}`
}

function jobKey(definition: JobDefinition<any>) {
  return `${definition.name}@${definition.version}`
}

async function parseBody(request: Request): Promise<unknown> {
  if (request.method === "GET" || request.method === "HEAD") return undefined
  const contentType = request.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    try {
      return await request.json()
    } catch {
      throw new ArcError("ARC2001", "Request body contains invalid JSON")
    }
  }
  const text = await request.text()
  return text.length ? text : undefined
}

function queryObject(url: URL): Record<string, string | string[]> {
  const output: Record<string, string | string[]> = {}
  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key)
    output[key] = values.length > 1 ? values : (values[0] ?? "")
  }
  return output
}

export interface ArcRuntime<ExecutionContext = undefined> {
  fetch(request: Request, context?: ExecutionContext): Promise<Response>
}

export interface WebExecutionContext {
  readonly providers?: readonly Provider<any>[]
  readonly tracer?: ArcTracer
  readonly dispose?: () => import("@arc/core").MaybePromise<void>
}

export interface WebRuntimeOptions {
  readonly onError?: (error: unknown) => void
  readonly tracer?: ArcTracer
}

export function createWebRuntime<ExecutionContext extends WebExecutionContext = WebExecutionContext>(
  application: AppDefinition,
  options: WebRuntimeOptions = {}
): ArcRuntime<ExecutionContext> {
  // Validate structural invariants once. Providers may arrive from the platform per request.
  buildApplication(application, { allowMissingCapabilities: true })
  const routes = compileRoutes(application)
  const listeners = compileListeners(application)

  return {
    async fetch(request: Request, context?: ExecutionContext): Promise<Response> {
      try {
        return await (async () => {
      let built
      try {
        built = buildApplication(application, { providers: context?.providers ?? [], allowMissingCapabilities: true })
      } catch (error) {
        options.onError?.(error)
        return Response.json({ error: "Internal Server Error" }, { status: 500 })
      }

      const dispatchEvent = async <Payload>(definition: EventDefinition<Payload>, payload: Payload): Promise<void> => {
        const matching = listeners.get(eventKey(definition)) ?? []
        for (const item of matching) {
          const owner = `${item.moduleName}.${item.listenerName}`
          const resolver = createCapabilityResolver(built, item.listener.requires ?? [], owner)
          for (const target of item.listener.requires ?? []) resolver.use(target)
          const listenerEvents = createEventPublisher(item.listener.emits ?? [], owner)
          const listenerJobs = createJobPublisher(item.listener.dispatches ?? [], owner)
          const tracer = context?.tracer ?? options.tracer ?? noopTracer
          await tracer.enterSpan("arc.listener", {
            "arc.app": application.name,
            "arc.module": item.moduleName,
            "arc.listener": item.listenerName,
            "arc.event": item.listener.event.name,
            "arc.event.version": item.listener.event.version
          }, async () => {
            await item.listener.handler(payload, { ...resolver, events: listenerEvents, jobs: listenerJobs })
          })
        }
      }

      const createEventPublisher = (allowed: readonly EventDefinition<any>[], owner: string) => {
        const allowedKeys = new Set(allowed.map(eventKey))
        return {
          async emit<Payload>(definition: EventDefinition<Payload>, payload: Payload): Promise<void> {
            if (!allowedKeys.has(eventKey(definition))) {
              throw new ArcError("ARC1007", `${owner} emitted event '${definition.name}@${definition.version}' without declaring it in emits`, {
                owner,
                event: definition.name,
                version: definition.version
              })
            }
            await dispatchEvent(definition, payload)
          }
        }
      }

      const createJobPublisher = (allowed: readonly JobDefinition<any>[], owner: string) => {
        const allowedKeys = new Set(allowed.map(jobKey))
        return {
          async dispatch(definition: JobDefinition<any>, payload: unknown, dispatchOptions: { delaySeconds?: number; id?: string } = {}): Promise<string> {
            if (!allowedKeys.has(jobKey(definition))) {
              throw new ArcError("ARC1009", `${owner} dispatched job '${definition.name}@${definition.version}' without declaring it in dispatches`, {
                owner,
                job: definition.name,
                version: definition.version
              })
            }

            let validatedPayload: unknown
            try {
              validatedPayload = await validateSchema(definition.input, payload)
            } catch (error) {
              if (error instanceof ValidationError) {
                throw new ArcError("ARC2003", `Job '${definition.name}@${definition.version}' payload failed its declared schema`, {
                  owner, job: definition.name, version: definition.version, issues: error.issues
                })
              }
              throw error
            }

            const resolver = createCapabilityResolver(built, [definition.transport], owner)
            const transport = resolver.use(definition.transport)
            const id = dispatchOptions.id ?? crypto.randomUUID()
            const idempotencyKey = definition.idempotency?.key(validatedPayload)
            const message = {
              kind: "arc.job-message" as const,
              schemaVersion: 1 as const,
              id,
              job: definition.name,
              version: definition.version,
              payload: validatedPayload,
              createdAt: new Date().toISOString(),
              ...(idempotencyKey ? { idempotencyKey } : {})
            }
            await transport.send(message, dispatchOptions.delaySeconds === undefined ? undefined : { delaySeconds: dispatchOptions.delaySeconds })
            return id
          }
        }
      }

      const url = new URL(request.url)
      const method = request.method.toUpperCase()
      const pathMatches = routes
        .map((route) => ({ route, params: route.pattern.match(url.pathname) }))
        .filter((candidate) => candidate.params !== null)

      const matched = pathMatches.find((candidate) => candidate.route.endpoint.method === method)

      if (!matched || !matched.params) {
        if (pathMatches.length > 0) {
          const allow = [...new Set(pathMatches.map((item) => item.route.endpoint.method))].join(", ")
          return Response.json({ error: "Method Not Allowed" }, { status: 405, headers: { allow } })
        }
        return Response.json({ error: "Not Found" }, { status: 404 })
      }

      try {
        const endpoint = matched.route.endpoint
        const params = endpoint.input?.params
          ? await validateSchema(endpoint.input.params, matched.params)
          : matched.params
        const query = endpoint.input?.query
          ? await validateSchema(endpoint.input.query, queryObject(url))
          : queryObject(url)
        const rawBody = endpoint.input?.body ? await parseBody(request) : undefined
        const body = endpoint.input?.body
          ? await validateSchema(endpoint.input.body, rawBody)
          : rawBody

        const resolver = createCapabilityResolver(
          built,
          endpoint.requires ?? [],
          `${matched.route.moduleName}.${matched.route.endpointName}`
        )
        for (const target of endpoint.requires ?? []) resolver.use(target)
        const tracer = context?.tracer ?? options.tracer ?? noopTracer
        const output = await tracer.enterSpan("arc.endpoint", {
          "arc.app": application.name,
          "arc.module": matched.route.moduleName,
          "arc.endpoint": matched.route.endpointName,
          "http.request.method": endpoint.method,
          "http.route": endpoint.path
        }, async () => endpoint.handler({
          request,
          input: { params, body, query },
          ...resolver,
          events: createEventPublisher(endpoint.emits ?? [], `${matched.route.moduleName}.${matched.route.endpointName}`),
          jobs: createJobPublisher(endpoint.dispatches ?? [], `${matched.route.moduleName}.${matched.route.endpointName}`)
        }))

        let validatedOutput
        try {
          validatedOutput = await validateSchema(endpoint.output, output)
        } catch (error) {
          if (error instanceof ValidationError) {
            throw new ArcError("ARC2002", "Endpoint output failed its declared schema", {
              endpoint: `${matched.route.moduleName}.${matched.route.endpointName}`,
              issues: error.issues
            })
          }
          throw error
        }

        return Response.json(validatedOutput, {
          status: endpoint.status ?? 200,
          headers: { "content-type": "application/json; charset=utf-8" }
        })
      } catch (error) {
        if (error instanceof ValidationError) {
          return Response.json(
            { error: "Validation failed", issues: error.issues },
            { status: 400 }
          )
        }
        if (error instanceof ArcError && error.code === "ARC2001") {
          return Response.json({ error: error.message, code: error.code }, { status: 400 })
        }
        options.onError?.(error)
        return Response.json(
          { error: "Internal Server Error" },
          { status: 500 }
        )
      }
        })()
      } finally {
        await context?.dispose?.()
      }
    }
  }
}
