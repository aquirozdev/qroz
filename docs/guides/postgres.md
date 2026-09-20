---
title: PostgreSQL and Drizzle
description: Current database integration approach without creating an Arc ORM.
---

# PostgreSQL and Drizzle

Arc intentionally does not invent another ORM.

The database capability is generic over the actual client type:

```ts
const db = database<typeof drizzleDb>("database.app")
```

Application code can use Drizzle directly:

```ts
const client = ctx.use(db)
return client.select().from(users)
```

## Current verified slice

GitHub CI executes a real PostgreSQL 18 service using pinned `pg` and Drizzle dependencies and verifies provider disposal.

## Cloudflare composition

Hyperdrive is the intended Cloudflare production connection path. The client should be created within invocation scope according to provider guidance.

## Migrations

Migrations are an operational workflow, not request-runtime behavior. Arc has not stabilized a migration abstraction yet.

A future migration layer should:

- run explicitly outside request handling;
- expose migration plan/status to tooling;
- support preview/CI databases;
- avoid coupling the core to Drizzle Kit;
- preserve raw SQL escape hatches.
