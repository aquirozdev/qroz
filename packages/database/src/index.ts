import { capability, provide, type Capability, type Provider } from "@arc/core"

/**
 * Declares a typed database capability without hiding the chosen query builder/ORM.
 * `TDatabase` is intentionally user/provider-defined (for example a Drizzle client).
 */
export function database<TDatabase>(name: string, features: readonly string[] = ["query"]): Capability<TDatabase> {
  return capability<TDatabase>(name, {
    kind: "resource",
    resourceType: "database",
    features
  })
}

export function provideDatabase<TDatabase>(
  target: Capability<TDatabase>,
  client: TDatabase
): Provider<TDatabase> {
  return provide(target, client)
}
