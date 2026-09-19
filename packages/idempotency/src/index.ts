import { capability, provide, type Capability, type JobIdempotencyStore, type Provider } from "@arc/core"

export function idempotencyStore(name: string): Capability<JobIdempotencyStore> {
  return capability<JobIdempotencyStore>(name, {
    kind: "resource",
    resourceType: "idempotency-store",
    features: ["atomic-claim", "lease", "completion"]
  })
}

export function provideIdempotencyStore(
  target: Capability<JobIdempotencyStore>,
  store: JobIdempotencyStore
): Provider<JobIdempotencyStore> {
  return provide(target, store)
}
