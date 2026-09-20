---
title: Current status
description: Current implementation and verification state of Arc.
---

# Current status

Current repository version: **0.7 research line**.

## Implemented and verified

- application/module/endpoint/event/listener/job definitions;
- Standard-Schema-compatible HTTP and job validation;
- Web Standards HTTP runtime;
- memory runtime and Cloudflare Worker runtime;
- explicit capabilities/providers and invocation scopes;
- execution-surface provider validation;
- object storage capability with memory/R2 adapters;
- queue producer capability with memory/Cloudflare adapters;
- typed/versioned jobs;
- memory and Cloudflare consumers;
- retry outcomes and poison-message handling;
- lease-based durable idempotency;
- memory idempotency store;
- SQLite Durable Object idempotency executed in workerd;
- PostgreSQL 18 + Drizzle + pg integration in CI;
- semantic tracing contract and Cloudflare native custom spans;
- W3C trace context carried through job envelopes;
- deterministic Application Graph schema v3;
- CLI inspect/validate/explain/context/diff;
- read-only MCP v2 surface over Arc semantics.

## Important limits

- trace context is propagated through jobs, but Cloudflare native custom spans are not claimed to be remotely parented where the platform API does not expose that control;
- R2/Queues have adapter contracts but still need deeper official local/remote integration coverage;
- Hyperdrive itself remains a deployment integration gate;
- AWS adapters do not exist yet;
- workflows/auth/policies/deployment planner are planned, not implemented;
- pre-1.0 APIs and graph schemas may change.

See [roadmap](./roadmap.md) and [quality gates](./quality-gates.md).
