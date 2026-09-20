---
title: Resource lifecycle
description: Invocation scopes, ownership, disposal and serverless resource management.
---

# Resource lifecycle

Serverless runtimes invalidate the assumption that every dependency should be a process-global singleton.

Qroz uses `ProviderScope` as the minimal lifecycle primitive.

```ts
providerScope(
  [provide(database, db)],
  async () => {
    await closeIfRequired()
  }
)
```

## Guarantees

A runtime using an invocation scope must call its disposer after both successful and failed execution.

Queue consumers dispose once per invocation/batch scope rather than once per message unless a provider explicitly needs narrower ownership.

## Database motivation

Cloudflare Hyperdrive's node-postgres guidance creates the client within the Worker invocation. Qroz therefore added provider lifecycle before stabilizing database integrations.

## Future lifecycle questions

The framework may eventually need narrower scopes for transactions, workflow steps or stream lifetimes. Additional phases should be introduced only when a real integration requires them; Qroz does not start with an enterprise DI lifecycle taxonomy.
