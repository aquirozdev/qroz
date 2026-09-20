---
title: Roadmap
description: Evidence-driven sequence for evolving Arc from research framework to credible portable application platform.
---

# Roadmap

The roadmap is ordered by architectural risk, not feature count.

## Completed research milestones

### v0.1 — executable application DSL
HTTP, Standard Schema contract, memory runtime and outside-in tests.

### v0.2 — truthful application model
Capabilities/providers, events, dependency/effect enforcement, deterministic graph and CLI inspection.

### v0.3 — resource portability
Portable Web runtime, Cloudflare runtime, storage/queue adapters, agent context and semantic diff.

### v0.4 — distributed jobs
Typed jobs, consumers, retry semantics, execution-surface isolation and semantic tracing.

### v0.5 — durable idempotency and CI
Lease-based idempotency, Durable Object adapter and repeatable CI/workerd gates.

### v0.6 — lifecycle/database integration
Provider lifecycle, database capability, PostgreSQL/Drizzle and SQLite Durable Object/workerd.

### v0.7 — trace propagation and read-only MCP
W3C job-envelope propagation and official MCP v2 read-only integration.

### v0.8 — second-cloud portability proof
Completed with API Gateway v2, Lambda, SQS, S3, DynamoDB idempotency, AWS SDK v3 + Floci, and the full API Gateway → Lambda → Arc → SQS → Lambda → Arc Job → DynamoDB/S3 flow.

## v0.9 — operation-level access and authorization foundations

In progress.

Completed framework/infrastructure access:
- operation-level grants for portable resources;
- storage and queue operations represented in the Application Graph;
- runtime enforcement so declared least privilege cannot be bypassed silently;
- provider-neutral deployment plans;
- candidate Cloudflare bindings and AWS IAM derived from execution surfaces;
- warnings for unrestricted resource access.

Current application/user authorization slice:
- portable principal contract;
- declarative endpoint permissions;
- named contextual policies evaluated over validated input;
- portable HTTP authentication hook;
- bearer and cookie-session authentication mechanisms;
- Cloudflare/AWS per-invocation identity resolution;
- runtime 401/403 enforcement;
- graph representation.

Still open in v0.9:
- real external authentication provider integrations;
- richer policy composition/resource authorization where justified;
- principal propagation into jobs/events where justified;
- agent authorization foundations;
- known-overgranting policy tests beyond current resource contracts;
- OTel/ADOT-compatible AWS tracing bridge.

Cloud IAM and end-user authorization must remain separate concepts even if they share a permission vocabulary.

## v0.10 — durable workflows

Prototype against at least two engines among Cloudflare Workflows, AWS Step Functions and Temporal. Investigate durable steps, timers, retries, compensation, versioning, replay constraints, cancellation and observability.

## v0.11 — deployment model

Transform Application Graph + platform configuration into a reviewable plan: execution surfaces, resources, bindings, IAM suggestions, breaking-change checks, environment configuration and semantic deployment diff.

## v0.12 — developer platform

Preview integration, Dev Console, LSP, richer agent context, generated OpenAPI/SDK contracts and docs generation.

## 1.0 readiness gates

A 1.0 discussion begins only after two serious cloud/runtime implementations, stable graph/API compatibility policies, security/auth models, production-grade jobs/idempotency, workflow decision, public docs, release process and a representative production-scale reference application.
