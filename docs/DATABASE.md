# Database architecture

Arc treats a database as a typed **capability**, not as an ORM owned by the framework.

## Why

The framework needs to know that an endpoint/job depends on a database so the Application Graph, deployment planner, tests and future IAM/tooling can reason about it. It does **not** need to replace the query API chosen by the application.

```ts
const db = database<MyDrizzleDatabase>("users.database", ["query", "transaction"])
```

Application code can then call the Drizzle client directly after `ctx.use(db)`.

## Invocation lifecycle

Serverless database clients frequently have invocation-specific lifecycle. Arc v0.6 introduces `ProviderScope`:

```ts
providerScope(
  [provideDatabase(databaseCapability, drizzleClient)],
  async () => client.end()
)
```

Runtime adapters guarantee the disposer runs in `finally`, including failed requests and queue batches.

This matches Cloudflare Hyperdrive's current recommendation for node-postgres: create a fresh `pg.Client` per request/invocation; Hyperdrive owns the underlying connection pool.

## Verification levels

1. **Portable contract** — database is visible as `resourceType: database` in the Application Graph.
2. **PostgreSQL integration** — GitHub Actions runs PostgreSQL 18, `pg`, and Drizzle against a real Arc endpoint and verifies client disposal.
3. **Hyperdrive integration** — still requires a Cloudflare account/configuration and remains a deployment integration gate; it is not claimed by the local PostgreSQL test.

## Selected initial stack

- PostgreSQL 18
- `pg` 8.23.0
- Drizzle ORM 0.45.2
- Hyperdrive as the first Cloudflare production connection adapter

The core remains ORM-agnostic and vendor-agnostic.
