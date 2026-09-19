import { type AppDefinition, buildApplication } from "@arc/core"
import { createWebRuntime, type ArcRuntime, type WebRuntimeOptions } from "@arc/runtime-web"

export type { ArcRuntime } from "@arc/runtime-web"

export interface MemoryRuntimeOptions extends WebRuntimeOptions {}

export function createMemoryRuntime(application: AppDefinition, options: MemoryRuntimeOptions = {}): ArcRuntime {
  // Memory is a fully configured runtime; fail early if providers are missing.
  buildApplication(application)
  const runtime = createWebRuntime(application, options)
  return {
    fetch(request) {
      return runtime.fetch(request, {})
    }
  }
}

export function getBuiltApplication(application: AppDefinition) {
  return buildApplication(application)
}
