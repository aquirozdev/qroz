---
title: Production readiness research baseline — September 2026
description: External production guidance used to derive Arc's reference application corpus and readiness gates.
---

# Production readiness research baseline — September 2026

This document records the external sources used to derive Arc's production-readiness corpus. It is intentionally dated: provider behavior and protocol guidance change.

Arc should not define "production ready" as "the happy path works". The common pattern across mature framework, cloud, security, observability, payments, database, workflow and agent guidance is that production software must make failure, duplication, concurrency, authorization and operations explicit.

## Cross-source findings

### Serverless systems must assume concurrency, failure and duplicate delivery

AWS's Serverless Applications Lens recommends designing around concurrent requests, stateless execution, event-driven transactions, state machines for orchestration, and failures/duplicate delivery. AWS Lambda's SQS guidance explicitly states that records can be processed more than once and recommends idempotent handlers and partial-batch failure reporting.

Sources:
- https://docs.aws.amazon.com/wellarchitected/latest/serverless-applications-lens/general-design-principles.html
- https://docs.aws.amazon.com/wellarchitected/latest/serverless-applications-lens/reliability-pillar.html
- https://docs.aws.amazon.com/wellarchitected/latest/serverless-applications-lens/failure-management.html
- https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html
- https://docs.aws.amazon.com/powertools/typescript/latest/features/batch/

Implication for Arc: queues/jobs/events/workflows must have explicit retry, idempotency, poison-message, partial-batch and execution-surface semantics.

### Background work and durable workflows are different primitives

Cloudflare's Workers guidance distinguishes Queues for decoupled background work from Workflows for multi-step durable execution. Temporal similarly treats workflow state, retries, timers and resumption as first-class durable semantics.

Sources:
- https://developers.cloudflare.com/workers/best-practices/workers-best-practices/
- https://docs.temporal.io/
- https://developers.cloudflare.com/dynamic-workers/examples/dynamic-workflows-playground/

Implication for Arc: "job" cannot become a catch-all. Jobs, events and workflows need separate semantics and contracts.

### Authorization must include object-level access, not only endpoint roles

OWASP API Security Top 10 highlights broken object-level authorization, broken authentication, object-property authorization, SSRF, inventory/version management and unsafe consumption of third-party APIs. PostgreSQL Row-Level Security demonstrates a database-native default-deny mechanism for row access.

Sources:
- https://api-security.owasp.org/editions/2023/en/0x11-t10/
- https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- https://laravel.com/docs/13.x/authorization

Implication for Arc: production authorization examples must include global permissions, tenant isolation, ownership checks, resource policies and protection against accidental over-exposure.

### Transaction boundaries and async side effects matter

Laravel documents the hazard of dispatching queued listeners before a database transaction commits and supports after-commit event/listener behavior. This is a general distributed consistency problem, not a Laravel-specific feature.

Source:
- https://laravel.com/docs/13.x/events

Implication for Arc: the corpus must force us to model transaction-aware event/job dispatch and eventually an outbox-compatible pattern.

### Production frameworks need scheduling, locks, rate limits and storage ergonomics

Laravel exposes scheduled tasks with timezone/overlap/single-server controls, atomic distributed locks, route/job rate limiting, file streaming and temporary upload/download URLs.

Sources:
- https://laravel.com/docs/12.x/scheduling
- https://laravel.com/docs/12.x/cache
- https://laravel.com/docs/13.x/routing
- https://laravel.com/docs/13.x/filesystem

Implication for Arc: these are not convenience-only features. They encode concurrency, abuse-control and secure data-transfer requirements that production applications repeatedly need.

### Payment/webhook systems require idempotency and replay-safe boundaries

Stripe's API supports idempotency keys for safely retrying state-changing requests. Production webhook consumers must likewise be designed around retries, duplicate delivery and independently authenticated external events.

Source:
- https://docs.stripe.com/api/idempotent_requests

Implication for Arc: request-level idempotency and webhook/event-consumer idempotency are separate production scenarios and should both exist in the corpus.

### Realtime applications introduce stateful coordination

Cloudflare Durable Objects documents WebSocket servers, presence-style coordination and hibernation behavior. Realtime workloads are materially different from stateless request/response APIs.

Sources:
- https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- https://developers.cloudflare.com/durable-objects/examples/websocket-hibernation-server/

Implication for Arc: a production corpus needs long-lived connections, rooms, presence, reconnect behavior, authorization and state restoration.

### Observability must span HTTP, database and messaging boundaries

OpenTelemetry publishes semantic conventions for HTTP, database, messaging, FaaS, object storage, exceptions and other operations.

Sources:
- https://opentelemetry.io/docs/specs/semconv/
- https://opentelemetry.io/docs/specs/semconv/http/
- https://opentelemetry.io/docs/specs/semconv/db/
- https://opentelemetry.io/docs/specs/semconv/messaging/

Implication for Arc: every reference application should be diagnosable through correlated traces/logs/metrics, not just return the correct result.

### Production changes need safe deployment and rollback signals

AWS recommends incremental deployment, monitoring and canary strategies with rollback based on operational indicators.

Source:
- https://docs.aws.amazon.com/wellarchitected/latest/serverless-applications-lens/deployment-approaches.html

Implication for Arc: production readiness includes config/secrets, migration safety, previews, semantic diffs and rollback-aware deployment plans.

### AI/agent applications add authority and tool-security risks

The MCP 2026 specification strengthens authorization and moves toward stateless request handling. OWASP's MCP and Agentic guidance highlights token/secret exposure, scope creep, tool poisoning, command execution, insufficient authorization, missing audit telemetry and context over-sharing.

Sources:
- https://blog.modelcontextprotocol.io/posts/2026-07-28/
- https://owasp.org/projects/mcp-top-10
- https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/

Implication for Arc: agent-native cannot mean agent-unrestricted. The reference corpus must test bounded tools, approvals, audit, identity propagation, sensitive-context controls and deterministic machine interfaces.

### Browser applications need explicit session and OAuth security

OWASP's session guidance emphasizes secure cookie attributes, session lifecycle and avoiding credentials in browser storage. RFC 9700 is the OAuth 2.0 Security Best Current Practice, and RFC 10017 (August 2026) is the current BCP for browser-based OAuth applications.

Sources:
- https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- https://datatracker.ietf.org/doc/html/rfc9700
- https://datatracker.ietf.org/doc/html/rfc10017

Implication for Arc: the corpus must include secure cookie/session behavior, CSRF-sensitive browser mutations, OAuth callback/state/PKCE integration boundaries and a BFF-style application.

## Derived rule

Arc should call itself production-ready only when a representative corpus demonstrates that the same semantic application model survives:

- normal request/response work;
- persistence and transaction boundaries;
- duplicate/retried asynchronous delivery;
- concurrent mutations;
- multi-tenant authorization;
- untrusted external input and webhooks;
- large files and streaming;
- long-running workflows;
- realtime state;
- scheduled execution;
- external service failure;
- production observability;
- safe deployment/change management;
- agent/tool authorization.

The reference applications are documented in [Reference applications](../project/reference-applications.md).
