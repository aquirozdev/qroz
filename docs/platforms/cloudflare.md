---
title: Cloudflare platform
description: Current Qroz integration model for Workers, R2, Queues, Durable Objects, Hyperdrive, and native tracing.
---

# Cloudflare platform

Cloudflare is Qroz's first integration platform because it exposes serverless compute, object storage, queues, durable state, database acceleration and tracing through Worker bindings while retaining a Web Standards execution model.

## Verified today

- HTTP execution through Wrangler/workerd.
- R2-shaped storage adapter contract.
- Cloudflare Queues producer/consumer adapter behavior.
- SQLite-backed Durable Object idempotency executed in workerd.
- PostgreSQL + Drizzle + pg lifecycle independently verified; Hyperdrive is the intended production Cloudflare connection path.
- Workers custom-span adapter.
- invocation-scoped provider composition from `env`.

## Runtime composition

Platform bindings become Qroz providers at the boundary:

```ts
createCloudflareWorker(application, {
  async providers(env) {
    return [
      provide(files, createR2Storage(env.FILES)),
      provideQueue(jobs, createCloudflareQueue(env.JOBS))
    ]
  }
})
```

Domain modules remain unaware of binding names.

## Durable Objects

Qroz's idempotency adapter uses SQLite-backed Durable Objects because claim/lease/completion requires coordinated durable state. This is an adapter implementation, not a requirement that all Qroz idempotency stores use Durable Objects.

## Hyperdrive

Database application code receives a typed database capability. Cloudflare composition can create a `pg`/Drizzle client per invocation using the Hyperdrive connection string.

## Observability

Workers already automatically instrument platform operations and supports custom spans and OTLP export. Qroz bridges semantic operations into native spans rather than embedding a competing tracing runtime.

## Remaining Cloudflare gates

- execute R2 against official local/runtime integration rather than only interface-faithful contract doubles;
- exercise Queue producer + consumer through official local Cloudflare integration end-to-end;
- verify real Hyperdrive connectivity in a Cloudflare environment;
- verify trace export/correlation behavior;
- validate deployment planner output once that subsystem exists.
