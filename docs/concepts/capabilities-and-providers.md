---
title: Capabilities and providers
description: How Arc separates application dependencies from concrete vendors and manages provider composition.
---

# Capabilities and providers

Capabilities describe **what an application needs**. Providers describe **how the active runtime supplies it**.

```ts
const usersDb = database<MyDatabase>("database.users")

const endpoint = endpoint({
  requires: [usersDb],
  async handler(ctx) {
    const db = ctx.use(usersDb)
  }
})
```

## Why tokens are semantic

Capability names are globally meaningful to graph tooling. They must therefore be stable and unambiguous. A token is more than a dependency-injection key: it is architecture metadata.

## Provider composition

Local/test composition may use static providers:

```ts
withProviders(application, [
  provide(usersDb, memoryDb)
])
```

A serverless runtime can derive providers from invocation bindings:

```ts
createCloudflareWorker(application, {
  async providers(env) {
    return providerScope(
      [provide(usersDb, createDb(env.HYPERDRIVE.connectionString))],
      async () => closeResources()
    )
  }
})
```

## Resource capabilities

A resource capability adds provider-neutral metadata such as resource type and supported/required features.

This metadata is intended for graph tooling, compatibility checks and later deployment/IAM generation.

## No lowest-common-denominator fiction

Arc does not pretend all providers have identical features. Advanced capabilities such as FIFO ordering, delayed delivery, signed URLs or provider-native transactions must be represented as explicit features or reached through a native escape hatch.

## Lifecycle

Provider lifetime belongs to the execution surface. Invocation-scoped resources can define `dispose()`, which Arc guarantees to invoke after success or failure. See [resource lifecycle](../architecture/resource-lifecycle.md).
