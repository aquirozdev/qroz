import type { AppDefinition } from "@arc/core"
import { createMemoryRuntime, type ArcRuntime, type MemoryRuntimeOptions } from "@arc/runtime-memory"

export function createTestRuntime(application: AppDefinition, options: MemoryRuntimeOptions = {}) {
  return createMemoryRuntime(application, options)
}

export async function probeRuntimeContract(runtime: ArcRuntime) {
  const notFound = await runtime.fetch(new Request("https://app.test/__arc_missing__"))
  if (notFound.status !== 404) {
    throw new Error(`Runtime contract failed: expected 404, got ${notFound.status}`)
  }

  const notAllowed = await runtime.fetch(new Request("https://app.test/users/123", { method: "POST" }))
  if (notAllowed.status !== 405) {
    throw new Error(`Runtime contract failed: expected 405, got ${notAllowed.status}`)
  }

  return { notFound: true, methodNotAllowed: true }
}
