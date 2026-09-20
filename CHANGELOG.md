# Changelog

## 0.8.0 - second-cloud portability proof

- add API Gateway HTTP API v2 → Web Request/Response runtime adapter;
- add SQS producer adapter with AWS batch/delay constraints;
- add Lambda/SQS consumer with Arc retry → `batchItemFailures` mapping;
- add S3 Object Storage adapter preserving streaming reads;
- add DynamoDB lease-based idempotency with conditional claim/takeover/complete/release semantics;
- validate S3, SQS and DynamoDB through AWS SDK v3 against Floci 2.1.0;
- validate the complete zero-cost Docker flow API Gateway v2 → Lambda Node 24 → Arc endpoint → SQS → Lambda consumer → Arc Job → DynamoDB idempotency → S3 side effect;
- fix DynamoDB expression alias strictness discovered by SDK integration;
- fix Web Crypto `randomUUID()` receiver semantics discovered under Lambda Node 24;
- document AWS lifecycle differences and the Floci-first evidence strategy.

## 0.7.0 - trace propagation and MCP read-only

- propagate W3C `traceparent`/`tracestate` from HTTP requests into typed Job envelopes;
- expose propagated trace context to Job handlers;
- add official MCP v2 integration tests for `arc.inspect`, `arc.context`, and `arc.explain`.

## 0.6.0 - lifecycle and database integration

- added `ProviderScope` with deterministic invocation disposal;
- added `@arc/database`;
- added PostgreSQL 18 + pg + Drizzle integration;
- added real SQLite Durable Object workerd integration.

## 0.5.0 - durable idempotency and CI gates

- added lease-based job idempotency;
- memory and Durable Object stores;
- Application Graph schema v3;
- GitHub Actions/workerd gates.

## 0.4.0 - distributed execution research release

- typed/versioned jobs;
- retries and poison handling;
- memory/Cloudflare consumers;
- execution-surface capability validation;
- semantic tracing.

## 0.3.0

- runtime-web/runtime-cloudflare;
- storage and queue adapters;
- agent context and semantic diff.

## 0.2.0

- capabilities/providers;
- events/listeners;
- graph dependencies;
- CLI inspect/validate.

## 0.1.0

- endpoint DSL;
- memory runtime;
- first Application Graph.
