---
title: Reference applications
description: Application-first production corpus that drives Arc capabilities, contracts and quality gates.
---

# Reference applications

These applications are executable specifications for Arc. We design the final application API first, write acceptance and failure tests, then implement only the framework semantics needed to make the scenario truthful.

Each reference app should eventually live under `examples/` with an explicit README, tests and provider evidence. A single app may exercise many capabilities, but each hard semantic should also have a focused contract test.

## 01 — Minimal API / health service

**Purpose:** prove the framework remains small.

```ts
export const health = endpoint({
  method: "GET",
  path: "/health",
  output: Health,
  handler: () => ({ ok: true })
})
```

Must prove routing, typed output, 404/405, deterministic errors, memory runtime, Cloudflare/AWS HTTP parity and tracing with near-zero configuration.

## 02 — Conventional CRUD application

Example: notes, tasks or address book.

Must prove params/query/body validation, create/read/update/delete, pagination, filtering/sorting, database lifecycle, transactions, conflict handling, migrations, auth, policies, testing and future OpenAPI/client generation.

This is Arc's "can a normal developer be productive?" example.

## 03 — Content/admin application

Example: CMS with authors, drafts, images and scheduled publishing.

Must prove authentication, roles/permissions, rich validation, file upload, temporary URLs, cache invalidation, scheduled publishing, slug uniqueness, admin-only actions, background image processing and notifications.

## 04 — Multi-tenant SaaS

Example: organizations, members, invitations, projects and audit log.

```ts
const updateProject = endpoint({
  method: "PATCH",
  path: "/projects/:id",
  auth: {
    required: true,
    permissions: ["projects.update"]
  },
  handler: async (ctx) => {
    // Future policy semantics must prove tenant + resource access.
  }
})
```

Must prove tenant identity, invitation flow, role/permission policy, object-level authorization, tenant-safe queries/RLS option, audit attribution, tenant-scoped quotas, background work that retains tenant context and prevention of cross-tenant leakage.

## 05 — E-commerce checkout

Example: cart → order → payment → stock reservation → fulfillment.

Must prove transaction boundaries, request idempotency, inventory concurrency, async side effects after commit, versioned events, retries, compensation, webhook reconciliation and trace continuity.

Critical failure tests:
- client retries `POST /orders`;
- payment succeeds but the HTTP response is lost;
- duplicate payment webhook;
- inventory changes concurrently;
- notification provider fails after the order commits.

## 06 — Webhook ingestion service

Example: Stripe, GitHub or partner events.

Potential desired shape:

```ts
export const stripeWebhook = webhook({
  path: "/webhooks/stripe",
  verify: stripeSignature(secret),
  idempotency: eventId(),
  handler: async ({ event }) => {}
})
```

The exact API is intentionally undecided.

Must prove raw-body access, signature verification, replay protection, deduplication, fast acknowledgement, queue handoff, retries, event versioning, unknown-event handling, secret rotation, audit and observability.

## 07 — File/media pipeline

Example: large images, video or document processing.

Must prove signed/direct uploads, temporary downloads, streaming, size/content-type validation, multipart/provider-native large upload, metadata/checksum, async processing, retry/idempotency, deletion and retention/lifecycle semantics.

Failure tests include interrupted upload, duplicate completion callback and processor failure after object creation.

## 08 — Notification service

Example: transactional email plus optional SMS/push/chat.

Must prove templates, localization, recipient preferences, queued delivery, retries/backoff, suppression/unsubscribe, provider errors/callbacks, test fakes and trace correlation from originating request through delivery.

## 09 — Large import/export

Example: import a 1 GB CSV and export a tenant's records.

Must prove streaming, chunking, queue fan-out/batching, progress, partial failure accounting, resumability/idempotency, cancellation, generated-file storage, temporary download URL and completion notification.

The HTTP request must never own the long-running work.

## 10 — Scheduler / recurring operations

Example: daily invoices, hourly cleanup, tenant reports in local timezones.

Potential desired shape:

```ts
schedule("daily-invoices", {
  cron: "0 2 * * *",
  timezone: "America/Guayaquil",
  overlap: "forbid",
  job: GenerateInvoices
})
```

Must prove cron expressions, timezone semantics, overlap prevention, singleton behavior, missed-execution policy, environment targeting, job handoff and visible failures.

## 11 — Realtime chat / collaborative room

Must prove authenticated WebSocket upgrade, room identity, membership authorization, presence, fan-out, reconnect, state restoration after runtime eviction, backpressure/rate limits, connection telemetry and provider-native durable coordination.

Cloudflare may use Durable Objects; AWS may require a different model. Arc must expose semantic differences rather than hide them.

## 12 — Durable human-in-the-loop workflow

Example: onboarding or expense approval.

Potential desired shape:

```ts
export const onboarding = workflow({
  name: "customer.onboarding",
  version: 1,
  async run(ctx, input) {
    const account = await ctx.step("create-account", () => createAccount(input))
    await ctx.waitFor("approval", { timeout: "7d" })
    await ctx.step("activate", () => activate(account.id))
  }
})
```

Must prove persisted steps, retry, timers, external signals, human approval, cancellation, compensation, version upgrades/replay safety and observability.

At least two engines must validate any portable workflow abstraction.

## 13 — Public developer API

Example: customer-facing REST API with generated SDK.

Must prove API keys/OAuth bearer principals, scoped permissions, per-key/tenant rate limits, quotas, idempotency keys, pagination, API versioning, deprecation metadata, CORS, OpenAPI generation, typed SDK generation, request IDs and abuse-safe errors.

## 14 — Event-driven modular monolith

Example: users, billing, notifications and audit modules in one deployable application.

Must prove versioned domain events, multiple consumers, dependency graph, transaction-aware publication/outbox strategy, consumer retries, optional independent execution surfaces, semantic diff and module-focused agent context.

This is the canonical proof that "modular monolith first, split later" works.

## 15 — High-contention reservation system

Example: seats, appointments or limited inventory.

Must prove uniqueness, atomic mutation/transactions, optimistic or pessimistic concurrency where supported, distributed-lock capability when appropriate, request idempotency, bounded retries and deterministic conflict responses.

A hundred concurrent requests for one slot must not create two successful reservations.

## 16 — High-throughput ingestion / telemetry

Example: IoT or analytics events.

Must prove batch input, schema validation, buffering, backpressure, queue/stream partition semantics, ordering requirements, partial batch failure, poison-event isolation, throughput-oriented observability and graceful provider-limit behavior.

This scenario determines whether Arc needs a distinct stream abstraction rather than pretending queues cover streams.

## 17 — Global edge application

Example: globally read-heavy catalog with regional writes.

Must prove cache semantics/invalidation, region-aware configuration, documented consistency expectations, provider-native edge storage, failover behavior, trace region attribution and explicit handling of features that cannot be portable.

## 18 — Privacy/compliance workload

Example: application storing personal customer data.

Must prove structured audit log, data export, deletion workflow, retention, encryption/provider integration, secret redaction, sensitive logging controls, access attribution and background cleanup.

This is not a compliance certification; it proves Arc does not make common privacy/security operations structurally difficult.

## 19 — AI agent / MCP application

Example: support agent that can read customer state, draft actions and request approval for mutations.

Potential desired shape:

```ts
agentPolicy({
  tools: {
    "customer.read": allow(),
    "refund.propose": allow(),
    "refund.execute": approval(),
    "secrets.read": deny()
  }
})
```

Must prove human/service/agent identities, bounded tool permissions, approval-required mutations, tool audit, token/secret protection, deterministic MCP metadata, long-running task semantics where used, context scoping and protection from accidental authority escalation.

Security tests must include malicious tool input/context, cross-tenant attempts and secret-exfiltration attempts.

## 20 — Production operations / change lifecycle

This is an existing reference application deployed through change.

Must prove:
- typed configuration validation;
- secret references;
- preview environment;
- graph/deployment diff;
- database migration plan;
- backwards-compatible event/job rollout;
- staged/canary hooks where a provider supports them;
- health/readiness signals;
- rollback/recovery path;
- trace/log/metric access;
- no secret values in CLI/MCP/graph output.

## 21 — Browser/BFF application

Example: server-backed web application using secure session cookies and OAuth/OIDC login.

Must prove cookie parsing/setting, Secure/HttpOnly/SameSite defaults, session rotation and logout/invalidation hooks, CSRF protection for cookie-authenticated mutations, OAuth callback/state/PKCE integration boundaries, redirects, flash-style short-lived state if supported and BFF access to upstream APIs without exposing backend credentials to browser JavaScript.

Arc should provide safe primitives and adapter contracts rather than becoming an identity provider.

## 22 — Streaming/SSE application

Example: AI chat response, build log or long-running progress feed over HTTP streaming/SSE.

Must prove Web Streams compatibility, cancellation when clients disconnect, backpressure, heartbeat/timeout behavior, trace continuity, auth before stream establishment, error behavior after headers are committed and provider/runtime parity where streaming is advertised.

This prevents Arc's HTTP abstraction from being accidentally JSON-only.

## Cross-cutting failure suite

Every applicable reference app should run a reusable matrix covering:

- duplicate request/message;
- timeout before response;
- downstream timeout;
- transient and permanent downstream failure;
- retry exhaustion;
- malformed input;
- anonymous and authenticated-but-forbidden access;
- missing/misconfigured provider;
- provider feature mismatch;
- concurrent mutation;
- stale version/schema;
- partial batch failure;
- poisoned message;
- deployment/config drift;
- telemetry exporter failure without application failure;
- runtime restart/eviction between operations.

## Capability coverage map

| Capability family | Primary reference apps |
| --- | --- |
| HTTP/schema/contracts | 01, 02, 03, 13, 21, 22 |
| Database/transactions | 02, 04, 05, 15 |
| Auth/policies | 03, 04, 13, 19, 21 |
| Cache/locks/rate limiting | 03, 10, 13, 15, 17 |
| Storage/files | 03, 07, 09 |
| Events | 05, 14 |
| Queues/jobs | 05, 07, 08, 09, 14, 16 |
| Scheduling | 03, 10 |
| Workflows | 05, 12, 18, 19 |
| Realtime | 11 |
| External HTTP/webhooks | 05, 06, 08 |
| Observability | all |
| Deployment/change management | 14, 17, 20 |
| Agent/MCP | 19 |
| Security/privacy | 04, 06, 13, 18, 19 |

## Execution order

Do not implement these applications in numerical order. Product experience now interrupts feature breadth deliberately:

1. CRUD + SaaS authorization and authorization-decision evidence;
2. minimal durable workflow proof on two credible execution paths;
3. **DX proof across apps 01, 02 and 04**: create → dev → test → inspect → diagnose in Arc Studio/CLI;
4. semantic deployment/security diff using app 20 as the change-lifecycle harness;
5. webhook + request idempotency and transaction-aware effects;
6. public API contracts/OpenAPI/SDK where they improve real developer workflows;
7. agent authorization and mutation approval over the same Application Graph;
8. scheduling/cache/locks/rate limiting only when blocked apps justify them;
9. files/import/realtime/high-throughput/global/privacy proofs as evidence demands.

### Cross-cutting DX acceptance

Apps 01, 02 and 04 are also the canonical UX corpus. For each, Arc must prove:

- a new developer can identify the application shape without reading framework internals;
- the common path uses little ceremony;
- invalid capability/auth/policy behavior produces actionable errors;
- the CLI and Arc Studio explain the same semantics;
- source → graph → trace/decision → deployment impact is navigable;
- representative editor/typecheck/dev-loop latency remains within published budgets.

Every new framework abstraction should name the reference application, user workflow and failure case that required it.
