import { type AppDefinition, buildApplication } from "@qroz/core"
import { createWebRuntime, type ArcRuntime, type WebExecutionContext, type WebRuntimeOptions } from "@qroz/runtime-web"

export type { ArcRuntime } from "@qroz/runtime-web"

export interface MemoryRuntimeOptions extends WebRuntimeOptions {
  readonly context?: WebExecutionContext
}

export function createMemoryRuntime(application: AppDefinition, options: MemoryRuntimeOptions = {}): ArcRuntime {
  // Memory is a fully configured runtime; fail early if providers are missing.
  buildApplication(application)
  const runtime = createWebRuntime(application, options)
  return {
    fetch(request) {
      return runtime.fetch(request, options.context ?? {})
    }
  }
}

export function getBuiltApplication(application: AppDefinition) {
  return buildApplication(application)
}
