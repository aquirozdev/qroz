# Changelog

## 0.7.0 - trace propagation and MCP read-only

- propagate W3C `traceparent`/`tracestate` from HTTP requests into typed Job envelopes;
- expose propagated trace context to Job handlers without claiming unsupported Cloudflare parent wiring;
- move compact module context derivation into `@arc/core` so CLI and agents share one semantic implementation;
- add official MCP v2 integration tests for `arc.inspect`, `arc.context`, and `arc.explain`;
- document Cloudflare custom-span limitations and the read-only MCP security boundary.


## 0.6.0 - in progress

- added `ProviderScope` with deterministic invocation disposal
- HTTP and Cloudflare queue runtimes now dispose invocation resources in `finally`
- added `@arc/database` as an ORM-transparent database capability
- added real PostgreSQL 18 + pg + Drizzle integration gate
- added a real Cloudflare Durable Object host for idempotency
- added a SQLite Durable Object workerd integration smoke test

## v0.5.0 — durable idempotency and CI gates

- added first-class lease-based job idempotency policy;
- added atomic claim/complete/release store contract;
- added Memory idempotency implementation;
- added Cloudflare Durable Object structural adapter and storage-side logic;
- duplicate completed jobs now ack without handler re-execution;
- active leases defer duplicates using queue retry;
- failed handlers release claims for subsequent retry;
- Application Graph bumped to schema v3 with idempotency metadata;
- added 5 idempotency/DO tests, bringing local suite to 48/48;
- removed generated build artifacts accidentally committed inside source folders;
- added GitHub Actions verification and pinned Wrangler/workerd smoke test;
- documented current MCP v2, Cloudflare Durable Object and idempotency decisions.

## 0.4.0 — distributed execution research release

### Added

- typed/versioned `job()` primitive as part of the Application Model;
- explicit `dispatches` declarations for endpoint/listener job producers;
- Application Graph schema v2 with job definitions, producers and transport metadata;
- job envelopes with stable schema/version/id/idempotency metadata;
- job execution engine with retry policy, exponential/fixed backoff and poison-message handling;
- memory job runner and Cloudflare Queue consumer adapter;
- per-message Cloudflare `ack()` / `retry()` handling;
- execution-surface capability validation so HTTP/listener/job surfaces can use least-privilege provider sets;
- async invocation-scoped providers for runtimes/consumers;
- portable semantic tracing contract plus Cloudflare native custom-span adapter;
- new errors `ARC1008`, `ARC1009`, and `ARC2003`;
- job-aware `arc inspect`, `arc context`, and `arc diff` output;
- deployable example Worker containing both `fetch` and `queue` entrypoints;
- Cloudflare Queue consumer/DLQ configuration in the example;
- ADRs for jobs, execution-surface validation and platform-native tracing;
- dedicated jobs, observability and updated database research documentation.

### Verified

- strict TypeScript build;
- 43 tests passing;
- typed HTTP -> queue envelope -> memory consumer -> typed job execution;
- Cloudflare-shaped consumer behavior with per-message acknowledgements/retries;
- semantic endpoint/listener/job tracing;
- async invocation-scoped provider resolution;
- graph/CLI determinism.

### Explicitly not claimed yet

- real `workerd`/Wrangler execution, because npm registry DNS is unavailable in the current build environment;
- real R2/Cloudflare Queue integration test against local or remote Cloudflare resources;
- PostgreSQL/Drizzle/Hyperdrive execution;
- durable idempotency enforcement (the envelope carries a key; no durable store enforces it yet);
- cross-process W3C trace-context propagation;
- AWS/SQS adapter parity;
- MCP server implementation.

## 0.3.0 — research release

### Added

- portable `@arc/runtime-web` engine;
- Cloudflare Worker adapter with runtime providers;
- `withProviders()` composition helper;
- Application Graph schema version and resource metadata;
- capability semantic-name validation;
- explicit event producer declarations and enforcement;
- Object Storage capability + memory/R2 adapters;
- Queue producer capability + memory/Cloudflare adapters and feature checks;
- `arc explain`, `arc context`, and `arc diff`;
- deployable Cloudflare example with R2 and Queue bindings;
- research/quality/database/cloudflare documentation.

### Verified

- clean offline workspace installation;
- strict TypeScript build;
- 33 tests passing.

## 0.2.0

- capabilities/providers;
- events/listeners;
- graph dependencies;
- CLI inspect/validate;
- structured errors.

## 0.1.0

- initial endpoint DSL;
- memory runtime;
- first Application Graph;
- outside-in test skeleton.
