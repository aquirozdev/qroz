# Roadmap

The roadmap is ordered by **risk reduction**, not by feature count. A check mark means the relevant claim has executable evidence. Partial means useful code exists but a required integration gate is still open.

## Phase 0 — Walking skeleton ✅

Goal: prove the final application API can drive a real Web Standards runtime.

Delivered:

- app/module/endpoint DSL;
- params/body/output validation;
- memory runtime;
- outside-in tests;
- initial Application Graph.

## Phase 1 — Explicit dependencies and graph integrity ✅

Goal: make architectural effects visible and enforceable.

Delivered:

- typed capabilities;
- explicit providers;
- `requires` metadata;
- build-time missing/duplicate provider validation;
- duplicate modules/routes validation;
- versioned events/listeners;
- explicit endpoint/listener `emits`;
- undeclared capability and event enforcement;
- globally unambiguous capability semantic names;
- graph schema version;
- stable ARC error codes and explanations.

Remaining hardening:

- provider disposal hooks for runtimes that require explicit teardown;
- richer provider scopes only if real adapters require them (async invocation-scoped providers now work);
- source-location metadata;
- endpoint declared error contracts;
- request headers/cookies schemas;
- non-JSON response bodies and response headers.

## Phase 2 — Runtime portability 🟡 partial

Goal: prove the core is runtime-independent.

Delivered:

- `@arc/runtime-web` portable execution engine;
- `@arc/runtime-memory` wrapper;
- `@arc/runtime-cloudflare` Worker adapter;
- request-scoped runtime providers from Cloudflare env;
- portable application definition separate from runtime composition;
- deployable Worker source and Wrangler config.

Open gate:

- run the shared runtime suite inside real `workerd` via Wrangler / Cloudflare Vitest plugin.

After that:

- add Node/Bun adapters only if they reveal a real runtime-boundary issue;
- maintain a runtime capability matrix.

## Phase 3 — Resource capabilities 🟡 partial

### Object Storage ✅ contract-level

Delivered:

- portable storage contract;
- memory adapter;
- R2 adapter;
- streaming bodies;
- metadata;
- provider-native escape hatch;
- shared contract probe;
- real endpoint in example application.

Open gate:

- execute storage contract against local R2 simulation in workerd.

### Queue producer ✅ contract-level

Delivered:

- portable producer API;
- feature requirements (`delay`, `batch`);
- provider compatibility checks;
- memory adapter;
- Cloudflare Queue adapter;
- documented delay-boundary validation;
- shared producer contract;
- real endpoint in example application.

Open gate:

- execute against local Cloudflare Queue binding in workerd.

### PostgreSQL / database ⏳ next major resource

Selected experiment:

1. Drizzle + `pg`.
2. PostgreSQL local/integration test.
3. Hyperdrive binding through Cloudflare runtime.
4. Application-specific repository capability as the domain port.
5. Migration workflow and query observability.

Do not create a custom ORM or generic database god-object without evidence.

### Cache ⏳ later

Memory + at least two semantically comparable providers before stabilizing the contract. KV and Redis semantics must not be falsely equated.

## Phase 4 — Typed jobs and queue consumers 🟡 partial

Delivered in v0.4:

- first-class `job()` definition and Standard-Schema payload;
- job versioning;
- producer `dispatches` declaration visible/enforced in graph (`ARC1009`);
- job definitions visible in Application Graph v2;
- logical job envelope v1;
- Memory deterministic consumer;
- Cloudflare per-message consumer adapter;
- attempts available to handlers;
- fixed/exponential retry delays;
- delayed producer delivery through Queue transport;
- explicit `ack()`/`retry()` mapping;
- poison-message discard for malformed/unknown/invalid payloads;
- `NonRetryableJobError`;
- job semantic tracing;
- Cloudflare example DLQ/max-retry configuration.

Still required before calling jobs complete:

- durable idempotency claim/lease store (current key is metadata only);
- trace-context propagation inside envelopes;
- deployment-manifest representation for max retries/DLQ/batching;
- `workerd` integration test;
- SQS implementation/contract comparison;
- schema migration/compatibility rules for rolling deployments.

## Phase 5 — Scheduler and durable workflows ⏳

Scheduler:

- typed cron definitions;
- local clock/test harness;
- Cloudflare Cron Triggers;
- AWS EventBridge Scheduler later.

Durable workflows:

- typed steps;
- retries/timeouts;
- sleep/wait;
- compensation/saga hooks;
- local deterministic harness;
- Cloudflare Workflows;
- Temporal/Step Functions only after a second implementation validates the model.

## Phase 6 — Auth and authorization ⏳

Goal: Laravel-level ergonomics without identity lock-in.

Deliver:

- Principal/identity capability;
- endpoint authentication declaration;
- policies and permissions;
- graph-visible authorization requirements;
- adapters for common auth systems;
- same permission metadata reusable by agent tooling.

## Phase 7 — Observability 🟡 started in v0.4

Delivered:

- minimal portable `ArcTracer`;
- deterministic recording tracer for tests;
- semantic endpoint/listener/job spans;
- application/module/action/event/job attributes;
- Cloudflare adapter to native `ctx.tracing` custom spans;
- example tracing/log config.

Remaining:

- W3C trace-context propagation across queue/job/workflow messages;
- standardized error/status attributes;
- request/deployment IDs;
- structured redaction;
- provider-level DB/storage/queue semantic attributes;
- local trace inspection and Dev Console;
- second runtime tracing adapter.

## Phase 8 — Dev Console ⏳

Telescope-like local UI designed for serverless/distributed applications:

- requests;
- events;
- jobs;
- workflows;
- DB queries;
- cache/storage;
- logs/traces;
- architecture graph;
- agent operations.

## Phase 9 — Agent-native tooling 🟡 started early

Already delivered:

- JSON `inspect`;
- JSON `validate`;
- stable ARC errors;
- `arc explain`;
- `arc context <module>` compact semantic context.

Next:

- formal JSON Schemas for CLI outputs;
- context-size budgets and measurements;
- MCP read-only server backed by Application Graph;
- generated AGENTS context;
- mutation tools with allow/approval/deny policy;
- machine-readable remediation including source locations.

## Phase 10 — LSP and IDE ⏳

- go-to endpoint/action/event consumer;
- dependency navigation;
- inline route/capability information;
- architecture diagnostics;
- editor-neutral LSP first.

## Phase 11 — Deployment and semantic diff 🟡 started early

Already delivered:

- basic `arc diff` comparing modules/routes/capabilities/listeners.

Next:

- versioned deployment manifest;
- Cloudflare planner;
- resource binding generation;
- semantic breaking-change classification;
- blast radius;
- previews;
- AWS planner using existing IaC rather than replacing it;
- least-privilege IAM/binding derivation where semantics are reliable.

## Phase 12 — Schema and contract evolution ⏳

- HTTP compatibility analysis;
- event schema/version migration;
- job schema/version migration;
- rolling-deployment compatibility;
- DB migration compatibility hints;
- generated semantic compatibility report.

## Phase 13 — Ecosystem/package model ⏳

- provider lifecycle;
- package manifests;
- package graph contributions;
- contract test conventions;
- extension safety boundaries;
- registry/discovery only after extension APIs stabilize.

## Explicit non-goals until evidence changes

Do not build early:

- custom ORM;
- custom schema language;
- custom bundler;
- custom test runner;
- proprietary telemetry backend;
- package manager;
- full IaC engine;
- general-purpose AI coding agent.

## Immediate execution order

1. **Real workerd gate** using current official Cloudflare tooling.
2. **Drizzle/PostgreSQL/Hyperdrive vertical slice** using invocation-scoped async providers.
3. Durable job idempotency + W3C trace-context propagation.
4. MCP v2 read-only bridge over Application Graph.
5. SQS contract comparison and deployment-manifest queue policy.
6. Then auth/policies, scheduler and durable workflows.

This order intentionally validates the riskiest portability and failure-semantics assumptions before adding Laravel-sized surface area.
