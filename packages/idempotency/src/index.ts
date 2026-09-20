import { capability, provide, type Capability, type JobIdempotencyStore, type Provider } from "@arc/core"

export type IdempotencyAccess = "claim" | "complete" | "release"

export function idempotencyStore(name: string): Capability<JobIdempotencyStore, IdempotencyAccess> {
  return capability<JobIdempotencyStore, IdempotencyAccess>(name, {
    kind: "resource",
    resourceType: "idempotency-store",
    features: ["atomic-claim", "lease", "completion"],
    operationMethods: {
      claim: ["claim"],
      complete: ["complete"],
      release: ["release"]
    }
  })
}

export function provideIdempotencyStore(
  target: Capability<JobIdempotencyStore, IdempotencyAccess>,
  store: JobIdempotencyStore
): Provider<JobIdempotencyStore> {
  return provide(target, store)
}
