import { createCloudflareTracer, type CloudflareTracingLike } from "@qroz/telemetry-cloudflare"
import { normalizeProviderSource, type AppDefinition, type MaybePromise, type Principal, type ProviderSource } from "@qroz/core"
import { createWebRuntime, type WebExecutionContext } from "@qroz/runtime-web"

export interface CloudflareExecutionContextLike {
  waitUntil(promise: Promise<unknown>): void
  passThroughOnException?(): void
  readonly tracing?: CloudflareTracingLike
}

export interface CloudflareRuntimeContext<Env> extends WebExecutionContext {
  readonly env: Env
  readonly executionCtx: CloudflareExecutionContextLike
}

export interface CloudflareWorkerOptions<Env> {
  readonly providers?: (env: Env, executionCtx: CloudflareExecutionContextLike) => MaybePromise<ProviderSource>
  readonly authenticate?: (
    request: Request,
    env: Env,
    executionCtx: CloudflareExecutionContextLike
  ) => MaybePromise<Principal | undefined>
  readonly onError?: (error: unknown) => void
}

export interface CloudflareWorkerHandler<Env> {
  fetch(request: Request, env: Env, executionCtx: CloudflareExecutionContextLike): Promise<Response>
}

export function createCloudflareWorker<Env extends object = Record<string, unknown>>(
  application: AppDefinition,
  options: CloudflareWorkerOptions<Env> = {}
): CloudflareWorkerHandler<Env> {
  const runtime = createWebRuntime<CloudflareRuntimeContext<Env>>(application, {
    ...(options.onError ? { onError: options.onError } : {})
  })

  return {
    async fetch(request, env, executionCtx) {
      const scope = normalizeProviderSource(await options.providers?.(env, executionCtx))
      const tracer = executionCtx.tracing ? createCloudflareTracer(executionCtx.tracing) : undefined
      const principal = await options.authenticate?.(request, env, executionCtx)
      return runtime.fetch(request, {
        env,
        executionCtx,
        providers: scope.providers,
        ...(principal ? { principal } : {}),
        ...(scope.dispose ? { dispose: scope.dispose } : {}),
        ...(tracer ? { tracer } : {})
      })
    }
  }
}
