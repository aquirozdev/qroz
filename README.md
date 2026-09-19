# Arc — serverless-first TypeScript application framework (research prototype)

> **Codename only.** `Arc` is temporary. Naming is intentionally decoupled from architecture and product validation.

Arc is an executable research prototype for a portable TypeScript application framework designed for **human DX, agent DX, serverless runtimes and distributed systems**.

The goal is not “Laravel rewritten in TypeScript”. The goal is Laravel-level application ergonomics with explicit architecture, Web Standards portability, typed capabilities, a semantic Application Graph, deterministic tooling and provider-specific escape hatches.

## Current status — v0.5 durable-idempotency research release

The repository now proves more than a router:

- explicit `app()`, `module()`, `endpoint()`, `event()`, `listener()` DSL;
- Standard-Schema-compatible params/query/body/output validation;
- Web Standards request execution extracted into `@arc/runtime-web`;
- reference in-memory runtime;
- Cloudflare Worker adapter using `fetch(request, env, executionCtx)`;
- runtime-supplied providers from Cloudflare bindings;
- portable application definition separated from runtime composition via `withProviders()`;
- typed capabilities and strict `requires` enforcement;
- explicit event producers via `emits`, with runtime enforcement;
- deterministic Application Graph v3 with job definitions/producers;
- semantic resource metadata in the graph;
- Object Storage capability with Memory + Cloudflare R2 adapters;
- Queue producer capability with feature detection and Memory + Cloudflare Queues adapters;
- first-class typed/versioned `job()` definitions and `dispatches`;
- lease-based durable job idempotency contract with explicit store capability;
- Memory + Cloudflare Durable Object idempotency adapters;
- completed duplicate suppression and active-lease retry semantics;
- Memory + Cloudflare job consumers with per-message ack/retry semantics;
- fixed/exponential retry delays and explicit non-retryable failures;
- poison-message handling for invalid envelopes/payloads/unknown versions;
- async invocation-scoped runtime provider hooks for database-ready composition;
- portable semantic tracing via `@arc/telemetry`;
- Cloudflare custom-span bridge using native Workers tracing;
- shared adapter contract probes;
- stable `ARCxxxx` framework errors with `arc explain`;
- agent-oriented `arc context`;
- semantic `arc diff`;
- deployable Cloudflare example configuration for R2 + Queue bindings;
- strict TypeScript build and outside-in tests.

### Verified quality gate

```text
TypeScript strict build     PASS
npm install --offline       PASS (all current dependencies are local workspace packages)
Full automated suite        48 / 48 PASS
Memory runtime              PASS
Cloudflare adapter          PASS (structural adapter tests)
Memory/R2 storage contract  PASS
Memory/CF queue contract    PASS
Memory/CF job consumer      PASS
Semantic tracing            PASS
CLI inspect/validate        PASS
CLI explain/context/diff    PASS
```

**Important:** the Cloudflare adapter is tested against the documented Worker/binding interfaces, but `workerd` itself could not be installed in the execution environment because npm DNS access was unavailable. A real Wrangler / `@cloudflare/vitest-plugin` test remains an explicit release gate before calling runtime portability fully proven.

## Verify

Requirements in this research environment:

- Node.js 20+ (tested with Node 22);
- TypeScript 5.8+ available as `tsc`.

```bash
npm install
npm run verify
```

The repository currently has no third-party runtime dependency, so `npm install --offline` also succeeds.

## Final application shape

The domain definition is infrastructure-free:

```ts
export const application = app({
  name: "example",
  modules: [users, files, notifications]
})
```

Local composition:

```ts
export default withProviders(application, [
  provide(userRepository, repository),
  provide(auditSink, audit),
  provide(filesStorage, createMemoryStorage()),
  provideQueue(notificationsQueue, createMemoryQueue())
])
```

Cloudflare composition uses the same application definition:

```ts
const cloudflareApplication = withProviders(application, [
  provide(userRepository, repository),
  provide(auditSink, audit)
])

const http = createCloudflareWorker(cloudflareApplication, {
  async providers(env) {
    return [
      provide(filesStorage, createR2Storage(env.FILES)),
      provideQueue(notificationsQueue, createCloudflareQueue(env.NOTIFICATIONS)),
      provideQueue(notificationJobsQueue, createCloudflareQueue(env.JOBS))
    ]
  }
})

const jobs = createCloudflareJobConsumer(cloudflareApplication, {
  async providers(env) {
    return [
      provideQueue(notificationJobsQueue, createCloudflareQueue(env.JOBS)),
      provide(notificationDeliverySink, cloudflareDeliverySink)
    ]
  }
})

export default { fetch: http.fetch, queue: jobs.queue }
```

## Explicit dependencies and effects

```ts
export const createUser = endpoint({
  method: "POST",
  path: "/users",
  requires: [userRepository],
  emits: [UserCreated],
  input: { body: CreateUserBody },
  output: UserSchema,

  async handler(ctx) {
    const user = await ctx.use(userRepository).create(ctx.input.body)
    await ctx.events.emit(UserCreated, user)
    return user
  }
})
```

Arc rejects undeclared capability access and undeclared event emission. The Application Graph therefore describes real architectural effects rather than documentation that can silently drift.

## Typed jobs

```ts
export const DeliverNotification = job({
  name: "notifications.deliver",
  version: 1,
  transport: notificationJobsQueue,
  input: NotificationBody,
  requires: [notificationDeliverySink],
  retry: { strategy: "exponential", delaySeconds: 5, maxDelaySeconds: 60 },
  idempotencyKey: (input) => `notification:${input.message}`,
  async handler(input, ctx) {
    await ctx.use(notificationDeliverySink).deliver(input.message)
  }
})
```

Producers declare `dispatches: [DeliverNotification]`; undeclared dispatch fails with `ARC1009`. Jobs are visible in Application Graph v3 and semantic CLI context/diff. Delivery is intentionally modeled as at-least-once. Durable idempotency is now enforced through an atomic claim/lease/completion store. Arc still does not claim exactly-once execution; external side effects should reuse the same idempotency key where supported.

## Observability

Arc emits portable semantic spans for endpoints, listeners and jobs. On Cloudflare they map to native Workers custom spans, which nest with platform-generated fetch/binding spans and can be exported through Cloudflare's OpenTelemetry pipeline. Arc does not ship a proprietary telemetry backend.

## Agent / CI tooling

```bash
npm run inspect
npm run inspect:json
node packages/cli/bin/arc.mjs context examples/hello-world/dist/app.js users --json
node packages/cli/bin/arc.mjs explain ARC1004 --json
node packages/cli/bin/arc.mjs diff before.js after.js --json
```

`arc context` intentionally returns a compact module-level semantic view so an AI coding agent does not need to scan an entire repository to discover routes, capabilities and event relationships.

## Repository map

```text
packages/
  core/                application DSL, capabilities, events, graph, errors
  runtime-web/         portable Web Standards execution engine
  runtime-memory/      reference local runtime
  runtime-cloudflare/  Cloudflare Worker adapter
  testing/             runtime probes
  cli/                 inspect/validate/explain/context/diff
  storage/             portable object-storage contract
  storage-memory/      in-memory storage adapter
  storage-r2/          Cloudflare R2 adapter
  queue/               producer contract + feature requirements
  queue-memory/        in-memory producer adapter
  queue-cloudflare/    Cloudflare Queues producer adapter
  jobs/                job registry/executor/retry semantics
  jobs-memory/         deterministic local job consumer
  jobs-cloudflare/     Cloudflare Queue consumer adapter
  telemetry/           portable semantic tracing contract
  telemetry-cloudflare/ Workers custom-span bridge
  idempotency/         typed idempotency-store capability
  idempotency-memory/  deterministic local lease store
  idempotency-cloudflare-do/ Durable Object structural adapter

examples/
  hello-world/
    src/                real application + Cloudflare composition
    wrangler.jsonc      deployable local/Cloudflare resource configuration
    test/               outside-in and adapter contract tests

docs/
  VISION.md
  ARCHITECTURE.md
  DEVELOPMENT.md
  ROADMAP.md
  PROGRESS.md
  RESEARCH-2026-09.md
  CLOUDFLARE.md
  DATABASE.md
  JOBS.md
  OBSERVABILITY.md
  QUALITY-GATES.md
  decisions/
```

## Non-negotiable design principles

1. **Explicit over magical.** Definitions must remain inspectable.
2. **Capabilities over vendors.** Domain code asks for abilities, adapters speak to vendors.
3. **Web Standards at runtime boundaries.** Portability starts with `Request`, `Response`, streams and URLs.
4. **Application Graph is a product artifact.** Runtime, CLI, agents, deployment and future IDE tooling share it.
5. **Example-first, outside-in development.** Design from the desired final application API.
6. **Contract tests for every portability claim.** Two implementations before generalizing a resource abstraction.
7. **Progressive architecture.** Simple apps stay simple; distributed primitives are opt-in.
8. **No fake portability.** Provider feature mismatches are explicit.
9. **Escape hatches remain reachable.** Adapters may expose `native()` where necessary.
10. **Human DX = Agent DX.** Errors and tooling are deterministic and machine-readable.

See `docs/IDEMPOTENCY.md`, `docs/QUALITY-GATES.md`, and `docs/ROADMAP.md` for the current guarantees and remaining gates.
