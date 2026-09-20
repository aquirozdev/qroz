---
title: Production readiness
description: Evidence Qroz must collect before claiming broad production readiness.
---

# Production readiness

Qroz is **not currently production-ready**. Production readiness is demonstrated by representative applications and failure-path evidence; package count, API surface or one large demo are not sufficient.

The external baseline is [Production readiness research baseline](../research/2026-09-production-readiness-baseline.md). The executable product corpus is [Reference applications](./reference-applications.md).

## Evidence levels

Every capability progresses through:

1. **Designed** — desired application API and semantics are written.
2. **Memory verified** — deterministic happy and failure paths run locally.
3. **Contract verified** — interchangeable implementations pass the same contract.
4. **Platform verified** — behavior runs in a runtime-faithful or real provider environment.
5. **Failure verified** — retries, duplicates, timeouts, partial failures and limits are exercised where relevant.
6. **Operationally verified** — telemetry, deployment planning and remediation information exist.
7. **Reference-app proven** — an end-to-end reference application depends on the capability.

A capability should not be advertised as production-ready before the applicable levels are green.

## Required production surfaces

### HTTP and API contracts
Routing, params/query/body/header/cookie validation, content negotiation, streaming, multipart/form-data, CORS, request-size limits, errors, redirects, conditional requests, pagination and versioned public contracts.

### Identity and authorization
Anonymous/authenticated principals, bearer/API identities, tenant membership, roles/permissions, object ownership, resource policies, service/agent identities, audit attribution and deny-by-default behavior.

### Database and transactions
Connection lifecycle, migrations, transactions/rollback, isolation/concurrency conflicts, transaction-aware events/jobs, query timeouts/cancellation, tenant isolation and safe schema evolution.

### Cache, coordination and rate limiting
TTL cache, atomic mutation where available, stampede handling, distributed locks, overlap prevention, quotas and explicit degradation when cache/coordination is unavailable.

### Object storage and files
Streaming, metadata, temporary download URLs, direct/signed uploads, large/multipart objects, validation, deletion and retention/lifecycle expectations.

### Events, queues and jobs
At-least-once delivery, retries/backoff, delay, idempotency, duplicates, poison messages, DLQ/failure destinations, partial batch failure, ordering when requested, versioning and concurrency controls.

### Scheduling
Cron/interval schedules, timezones, singleton execution, overlap prevention, missed-run policy, environment targeting and observable failure.

### Durable workflows
Persisted steps, retries, timers, external signals, approval, cancellation, compensation/sagas, versioning/replay compatibility, child workflows and long execution periods.

### Realtime
WebSockets or equivalent, authenticated subscriptions, rooms/topics, presence, reconnect, backpressure, fan-out and provider-native stateful coordination.

### External services and webhooks
Deadlines/timeouts, safe retries, SSRF-safe URL control, signatures, replay protection, upstream rate limits, trace propagation and explicit third-party failure semantics.

### Notifications
Email at minimum, with room for SMS/push/chat; templates, localization, queued delivery, retries, preferences, suppression/unsubscribe, provider callbacks and test fakes.

### Configuration and secrets
Typed environment config, secret references without graph leakage, rotation-compatible providers, diagnostics and local/test substitutes.

### Observability
Correlated traces across HTTP/jobs/events/workflows, structured logs, HTTP/database/messaging/storage/external-call spans, metrics, sampling, sensitive-data controls and actionable error codes.

### Deployment and change management
Deterministic builds, semantic graph diff, resource/binding/IAM plans, migration plans, environment diffs, previews, compatibility checks, safe rollout/rollback hooks and native escape hatches.

### Testing
Domain tests without cloud dependencies, runtime contracts, provider contracts, local integrations, runtime-faithful/cloud integrations, failure injection, concurrency/duplicate/retry tests and deterministic fakes.

### Agent and machine interfaces
Deterministic inspect/context/plan/diff/explain, read-only MCP, authenticated tool use, permission boundaries, approval-required mutation, audit, secret redaction and context-isolation controls.

## Framework-level gates

Qroz may call a capability **production-ready** only when:

- the public application-facing API is represented by an outside-in reference example;
- graph semantics are explicit and versioned;
- runtime behavior enforces graph claims where enforcement is possible;
- unsupported provider behavior fails during validation/planning instead of silently degrading;
- a portable abstraction normally has at least two implementations;
- failure semantics are documented and tested;
- integration evidence exists for every advertised provider;
- failures are diagnosable through telemetry;
- CLI/agent output is deterministic and secret-safe.

Qroz may describe the **framework as broadly production-ready** only when all Tier 1 reference applications pass their required gates on Cloudflare and AWS, except where a scenario intentionally proves a provider-specific primitive.

## Tiers

**Tier 1 — ordinary production apps:** minimal API, CRUD, content/admin, multi-tenant SaaS, webhook consumer, file/media, notifications, import/export, scheduler and public API.

**Tier 2 — distributed apps:** checkout/order flow, event-driven modular monolith, high-contention reservations, durable workflow and realtime collaboration.

**Tier 3 — specialized/high-complexity apps:** high-throughput ingestion, global edge, privacy/compliance and agentic applications.

Tier 1 is required before encouraging general production adoption. Tier 2 is required before claiming strong distributed-system coverage. Tier 3 demonstrates breadth.

## Existing correctness/security/operations gates

The corpus complements, rather than replaces, these requirements:

- fuzz/property coverage for parsers and routing boundaries;
- load/concurrency tests;
- cancellation/timeout model;
- documented memory/bundle/runtime limits;
- idempotency lease extension for long jobs;
- DLQ/redrive operational guides;
- job/event schema migration strategy;
- threat model and dependency/security scanning;
- real Hyperdrive integration;
- observability export verification;
- deployment/rollback story;
- version compatibility and release provenance;
- reproducible local environment and public reference documentation.

## Anti-goal

The corpus does not imply Qroz should build every subsystem itself. Prefer standards and adapters: Standard Schema, PostgreSQL/Drizzle, OpenTelemetry, Web Standards, provider queues/storage/workflows and official SDKs. Qroz should own application semantics, graph integrity, contracts and portability — not recreate the ecosystem.
