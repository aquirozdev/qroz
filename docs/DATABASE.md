# Database integration decision log

## Selected first production experiment

- PostgreSQL;
- Drizzle ORM;
- `pg` / node-postgres;
- Cloudflare Hyperdrive for Workers;
- application-specific repository capabilities remain the domain-facing ports.

## Current Cloudflare constraints confirmed in September 2026

Cloudflare recommends node-postgres for Hyperdrive and requires a sufficiently recent `pg` version. Drizzle is supported on top of the node-postgres client.

A database client must be created **inside each Worker invocation**. Do not keep a global Client/Pool across requests. Hyperdrive maintains the origin-side pool; the Worker-side client is invocation-scoped and is garbage collected at the end of the invocation. Cloudflare documents that explicit `client.end()` is not required for this case.

For Workers compatibility dates `2026-08-04` and later, Node compatibility is enabled by default for new/current projects unless explicitly disabled.

## Architectural consequence already implemented

v0.4 made runtime provider factories async and invocation-scoped. This is required so a Cloudflare adapter can eventually do:

```ts
providers: async (env) => {
  const client = new Client({ connectionString: env.HYPERDRIVE.connectionString })
  await client.connect()
  const db = drizzle(client)
  return [provide(usersRepository, drizzleUsersRepository(db))]
}
```

The core does not need to know about `pg`, Hyperdrive or Drizzle.

## Gate still blocked in this execution environment

The npm registry is still unreachable from the build container, so `drizzle-orm`, `pg`, Wrangler and the Cloudflare Vitest plugin cannot be installed here. We therefore do **not** claim that the database/workerd integration has been executed.

## Next executable DB slice

When npm connectivity is available:

1. install `drizzle-orm`, `pg`, `drizzle-kit`, Wrangler and Cloudflare test tooling;
2. define a tiny users table;
3. run PostgreSQL integration tests against a real Postgres instance;
4. implement the user repository with Drizzle;
5. run the same application through Hyperdrive/workerd;
6. record query spans and migration behavior;
7. decide what, if anything, belongs in an `@arc/database-*` package only after that evidence exists.

Arc will not introduce a generic database god-object or custom ORM to make this phase look complete.
