---
title: Roadmap
description: Evidence-driven sequence optimized for exceptional DX, truthful application semantics and portable execution.
---

# Roadmap

The roadmap is ordered by **user value and architectural risk**, not feature count.

Qroz has enough foundational primitives to prove the architecture. The next phase deliberately prioritizes product/DX depth before broadening the framework surface.

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

### v0.7 — trace propagation and read-only agent interface
W3C job-envelope propagation and read-only MCP integration.

### v0.8 — second-cloud portability proof
API Gateway v2, Lambda, SQS, S3, DynamoDB idempotency, AWS SDK v3 + Floci and end-to-end AWS-shaped execution.

## v0.9 — security semantics

In progress.

Current foundation:

- operation-level resource grants and runtime enforcement;
- provider-neutral deployment/IAM/binding plans;
- portable principal contract;
- endpoint permissions;
- capability-aware contextual policies;
- portable authentication composition;
- Cloudflare/AWS per-invocation identity resolution;
- stable 401/403 semantics;
- graph representation;
- auditable authorization decisions with claim-redacted principals.

Before closing this line:
- explicit credential failure semantics;
- proof with real external identity integration(s);
- known-overgranting tests;
- minimal foundation for service/agent identity and delegated authority;
- AWS-compatible tracing bridge where needed for end-to-end explainability.

Do not turn v0.9 into a general policy-language project.

## v0.10 — minimal durable execution

In progress.

The goal is **not** to build another Temporal/Inngest/Trigger.dev.

Stabilize only the portable semantics needed by Qroz applications:

- task;
- sleep/timer;
- explicit choice/branching;
- wait/signal or approval;
- bounded retry;
- succeed/fail;
- cancellation semantics where provider evidence supports them.

Required evidence:

- deterministic memory execution;
- at least two credible provider execution paths;
- workflow tracing;
- truthful provider limitations;
- versioning decision before compatibility claims.

Compensation, child workflows, rich orchestration DSLs and advanced migration systems remain deferred until reference applications demonstrate demand.

## v0.10.5 — Qroz DX Preview

This milestone is intentionally before broad deployment automation.

### First-run experience

```bash
npm create qroz@latest
cd app
qroz dev
```

should produce a useful local application and open Qroz Studio without account, API key or mandatory Docker.

### Qroz Studio

Local-first visual projection of the Application Graph and execution data:

- application/module graph;
- endpoint explorer;
- API request runner;
- jobs and workflow instances;
- resources and operation-level access;
- auth/policy decisions;
- traces;
- semantic change view;
- source navigation.

Studio must never become a second source of truth.

### Error experience

Every stable Qroz error should have:

- short human explanation;
- machine code;
- responsible semantic owner;
- declared vs attempted behavior where relevant;
- actionable fixes;
- source navigation metadata where practical.

### DX performance budgets

Establish representative benchmark applications and regression budgets for:

- incremental development rebuild;
- graph regeneration;
- CLI inspect;
- test client startup;
- TypeScript diagnostics;
- Studio update latency.

Avoid type-level designs that require the TypeScript compiler to infer the entire application to type one endpoint.

## v0.11 — change and deployment experience

Transform Application Graph + environment/platform configuration into a reviewable semantic plan.

The primary user experience is a **Git-like application diff**, not cloud-provider forms.

It should explain:

- endpoints/execution surfaces added or removed;
- resource dependencies;
- operation/IAM changes;
- configuration/secret requirements without exposing secret values;
- compatibility risks;
- security privilege expansion;
- provider-specific consequences.

Qroz may export or integrate with external IaC. It does not need to become a full IaC engine.

## v0.12 — agent-native developer experience

Upgrade the machine interface around the same application model:

- current MCP/protocol compatibility;
- progressive context/tool discovery;
- module-scoped context;
- safe mutating operations;
- service/agent identity;
- delegated authority;
- approval-required actions;
- authorization/audit integration;
- generated agent instructions/context artifacts.

MCP is an adapter, not the product. CLI, APIs and future protocols should be able to consume the same model.

## v0.13 — ecosystem and developer platform

Only after the local product is excellent:

- generated OpenAPI and SDK contracts;
- LSP/editor integrations;
- preview environments;
- documentation generation;
- richer platform integrations;
- optional hosted collaboration/operations surfaces.

## Explicit non-goals for the near term

Do not prioritize:

- a custom ORM;
- an Qroz identity provider;
- an Qroz LLM/agent SDK;
- a general-purpose IaC replacement;
- every durable-workflow feature;
- additional cloud providers before AWS + Cloudflare tell us something architecturally new;
- benchmark-driven HTTP micro-optimizations at the expense of DX.

## Public beta release track

Public package publication is now a separate track from full production readiness.

Before the first public beta:

- select the final project/package identity and replace the Qroz codename;
- choose and commit the repository license;
- make every publishable package registry-safe and metadata-complete;
- prove clean install/scaffold/dev/test from packed artifacts;
- declare and test Node/TypeScript/OS compatibility;
- publish canonical documentation;
- use npm trusted publishing with provenance;
- document pre-1.0 compatibility and migration expectations.

The executable checklist is [Public beta readiness](./public-beta-readiness.md).

## 1.0 readiness gates

A 1.0 discussion begins only after:

- the ordinary CRUD/SaaS experience is excellent;
- two serious runtime/provider implementations remain green;
- API and graph compatibility policies exist;
- security/auth models are coherent;
- jobs/idempotency are production credible;
- durable workflow scope is explicitly decided;
- local Qroz Studio and CLI explain the same application truthfully;
- canonical DX claims have reproducible browser evidence;
- DX performance budgets are enforced;
- semantic change/deployment review is credible;
- public docs and release process are mature;
- at least one representative production-scale application validates the model.
