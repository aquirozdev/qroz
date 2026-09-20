---
title: Capability backlog from reference applications
description: Risk-ordered framework capabilities derived from Arc's production reference corpus.
---

# Capability backlog from reference applications

This is not a feature wishlist. Every item is justified by one or more [reference applications](./reference-applications.md) and should enter implementation through an application-facing example plus failing acceptance test.

## P0 — finish ordinary application semantics

### Authorization policy model
Reference apps: 03, 04, 13, 19, 21.

Need object/resource authorization in addition to static permission strings, tenant context, audit-friendly decisions and runtime enforcement. Cloud IAM remains separate.

### Request idempotency
Reference apps: 05, 06, 13, 15.

Need an HTTP mutation primitive that binds idempotency key + normalized request identity to a stored outcome, handles concurrent duplicates, mismatched payload reuse and TTL.

### Database transaction boundary + after-commit effects
Reference apps: 02, 05, 14, 15.

Need explicit transaction scope and a truthful rule for events/jobs emitted inside a transaction. Research an outbox adapter rather than pretending in-memory event dispatch is transactionally safe.

### External HTTP capability
Reference apps: 05, 06, 08, 19.

Need Web Standards fetch-compatible outbound calls with deadlines, trace propagation and explicit retry policy. SSRF-sensitive destinations need allow/deny policy hooks. Do not build a custom HTTP stack.

## P1 — complete Laravel-class production ergonomics

### Cache + atomic coordination
Reference apps: 03, 10, 13, 15, 17.

Start from cache get/set/delete/TTL, then require a second provider before stabilizing atomic locks. Do not assume all caches provide identical atomic semantics.

### Rate limiting / quotas
Reference apps: 13, 16, 19, 21.

Need keys by IP/principal/tenant/API key, burst/window semantics, deterministic retry metadata and provider capability validation.

### Scheduler
Reference apps: 03, 10.

Need declarative schedule graph nodes, timezone, overlap policy, singleton semantics, missed-run policy and provider plans for Cloudflare/AWS.

### Storage URLs + large upload
Reference apps: 03, 07, 09.

Extend object storage beyond get/put/delete with metadata, signed download/upload URLs and provider-native multipart/streaming features. Avoid forcing unsupported features into the portable minimum.

### Notifications
Reference apps: 03, 08.

Start with email contract + memory fake + two real/provider adapters before generalizing multi-channel notification semantics.

### Browser/session security primitives
Reference app: 21.

Need cookies and session adapter contracts, CSRF primitive for cookie-authenticated mutations, and identity-provider integration boundaries. Arc must not become an OAuth authorization server.

## P2 — distributed-system differentiators

### Durable workflows
Reference apps: 05, 12, 18, 19.

Prototype the same final-user workflow against at least two engines before stabilizing: Cloudflare Workflows and one of Step Functions/Temporal. Cover timers, signals, cancellation, compensation and version/replay rules.

### Realtime/stateful coordination
Reference app: 11.

Design from rooms/presence/reconnect rather than from Durable Objects. Expect provider-specific capabilities and explicit non-portability.

### Event outbox + schema evolution
Reference apps: 05, 14.

Need transaction-safe publishing, event version compatibility checks, migration/draining guidance and semantic diff warnings.

### Batch/stream ingestion
Reference apps: 09, 16.

First determine whether queue semantics are sufficient. Add a stream abstraction only if ordering/partition/checkpoint semantics cannot be represented honestly.

## P3 — developer platform

### OpenAPI + generated clients
Reference apps: 02, 13.

Generate from the same endpoint/schema model; do not introduce duplicate annotations.

### Streaming HTTP/SSE
Reference apps: 19, 22.

Preserve Web Streams, cancellation and provider parity without forcing JSON output.

### Config/secrets model
Reference apps: all, especially 06, 18, 20.

Typed config metadata may be graph-visible; secret values never are. Deployment planning should identify required secret references.

### Observability expansion
Reference apps: all.

Align semantic spans with OpenTelemetry HTTP/database/messaging/object-store conventions, add outbound HTTP and workflow semantics, exporter adapters and failure-safe telemetry.

### Preview/deployment lifecycle
Reference app: 20.

Build on the existing provider-neutral deployment plan: environment mapping, migrations, preview plans, compatibility warnings and safe staged rollout hooks. Arc should remain able to export to external IaC rather than necessarily becoming a full IaC engine.

## P4 — agent-native production

### Agent authorization + approvals
Reference app: 19.

Only after application authorization is stable: tool scopes, agent identity, delegated authority, approval-required operations and immutable audit semantics.

### Mutating MCP
Reference app: 19.

Read-only MCP exists first for a reason. Mutation requires authorization, approval, audit, replay/idempotency and secret-safe outputs.

### Agent security test corpus
Reference app: 19.

Include scope escalation, poisoned tool/context input, cross-tenant access, destructive-action attempts and secret exfiltration. Keep security expectations aligned with current MCP/OWASP agent guidance.

## Working rule

A capability branch should state in its PR:

1. reference app(s) blocked by the missing behavior;
2. desired final-user API;
3. graph/schema change;
4. runtime invariant;
5. memory acceptance test;
6. portability contract when applicable;
7. provider integration evidence;
8. failure cases;
9. docs/ADR impact.

If an item cannot answer those nine points, it is probably too early to implement.
