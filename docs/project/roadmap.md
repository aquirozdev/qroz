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

Invocation-scoped provider lifecycle, database capability, real PostgreSQL/Drizzle integration and real SQLite Durable Object in workerd.

### v0.7 — trace propagation and read-only MCP

W3C job-envelope propagation and official MCP v2 read-only integration.

## v0.8 — second-cloud portability proof

Highest current priority.

Implement and contract-test:

- AWS Lambda HTTP adapter;
- SQS producer/consumer adapter;
- partial batch failure mapping;
- S3 storage adapter;
- durable idempotency candidate on AWS;
- AWS tracing bridge;
- execution-surface IAM input model.

Exit criterion: the same representative application semantics execute on Cloudflare and AWS without domain rewrites.

## v0.9 — authorization and identity

- principal/auth contracts;
- policies/permissions;
- execution-context identity;
- provider adapters;
- graph representation;
- agent authorization foundations.

Do not conflate authentication provider integration with the core authorization model.

## v0.10 — durable workflows

Prototype against at least two engines among Cloudflare Workflows, AWS Step Functions and Temporal.

Required semantics to investigate:

- durable steps;
- sleeps/timers;
- retries;
- compensation;
- versioning;
- deterministic replay constraints;
- cancellation;
- observability.

## v0.11 — deployment model

Transform Application Graph + platform configuration into a reviewable deployment plan.

Targets:

- deployable execution surfaces;
- resource/binding requirements;
- IAM suggestions;
- graph-based breaking-change checks;
- environment configuration;
- semantic deployment diff.

Arc should generate or integrate with infrastructure tools rather than build a cloud control plane prematurely.

## v0.12 — developer platform

- preview-environment integration;
- Dev Console;
- LSP;
- richer `arc context`;
- generated OpenAPI/SDK contracts where semantics are proven;
- documentation generation from graph/schema metadata.

## 1.0 readiness gates

A 1.0 discussion begins only after:

- two serious cloud/runtime implementations;
- stable graph compatibility policy;
- documented package/API compatibility policy;
- security threat model;
- auth/policy model;
- production-grade jobs/idempotency story;
- workflow decision;
- publishable docs site;
- release/upgrade process;
- representative production-scale reference application.
