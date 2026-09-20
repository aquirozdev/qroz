# Arc — portable TypeScript application framework

> **Research project / codename.** Arc is pre-1.0 and its public API may change.

Arc is a serverless-first TypeScript application framework for **humans and AI agents**. The goal is Laravel-level application ergonomics with explicit distributed-system semantics, Web Standards portability, typed capabilities, a machine-readable Application Graph, and provider-native escape hatches.

```ts
export default app({
  name: "acme",
  modules: [users, billing, notifications]
})
```

Application code declares intent:

```ts
export const createUser = endpoint({
  method: "POST",
  path: "/users",
  input: { body: CreateUser },
  output: User,
  requires: [usersDatabase],
  emits: [UserCreated],
  dispatches: [SendWelcomeEmail],

  async handler(ctx) {
    const db = ctx.use(usersDatabase)
    const user = await createUserRecord(db, ctx.input.body)
    await ctx.events.emit(UserCreated, { id: user.id })
    await ctx.jobs.dispatch(SendWelcomeEmail, { userId: user.id })
    return user
  }
})
```

Runtime/platform composition supplies concrete implementations without changing the domain model.

## Current research line — v0.7

Implemented and exercised today:

- explicit app/module/endpoint/event/listener/job model;
- Standard-Schema-compatible validation;
- Web Standards HTTP runtime;
- memory + Cloudflare Worker runtimes;
- typed capabilities, providers and invocation lifecycle;
- Application Graph schema v3;
- object storage and queue abstractions with memory/Cloudflare adapters;
- typed jobs, retries, poison-message handling and durable lease-based idempotency;
- SQLite Durable Object idempotency executed in workerd;
- PostgreSQL 18 + Drizzle + pg integration in CI;
- semantic tracing and W3C job-envelope trace propagation;
- deterministic CLI tools: inspect, validate, explain, context and semantic diff;
- official MCP v2 read-only integration;
- GitHub CI gates for strict TypeScript, workerd, Durable Objects, PostgreSQL and MCP.

The next major proof is **AWS Lambda + SQS/S3**, so Arc can validate its portability model against a second external cloud instead of refining Cloudflare-shaped abstractions indefinitely.

## Documentation

The canonical documentation map is [docs/README.md](./docs/README.md).

Recommended entry points:

- [Getting started](./docs/getting-started/README.md)
- [Mental model](./docs/getting-started/mental-model.md)
- [Product vision](./docs/project/vision.md)
- [System architecture](./docs/architecture/system-overview.md)
- [Roadmap](./docs/project/roadmap.md)
- [Current status](./docs/project/status.md)
- [Quality gates](./docs/project/quality-gates.md)
- [Competitive landscape](./docs/project/competitive-landscape.md)
- [Research baseline](./docs/research/2026-09-platform-baseline.md)

## Repository

```text
packages/      framework/runtime/resource packages
examples/      executable applications and contract tests
integration/   external SDK/service integration gates
docs/          canonical product/engineering documentation
docs/decisions architecture decision records
```

## Verify

```bash
npm install
npm run verify
```

`verify` includes TypeScript checks, the automated suite and documentation integrity checks.

See [CONTRIBUTING.md](./CONTRIBUTING.md) before architectural changes.
