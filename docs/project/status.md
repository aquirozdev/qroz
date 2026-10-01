---
title: Current status
description: Current implementation and verification state of Qroz.
---

# Current status

Current repository state: **pre-public-beta consolidation**. Publishable packages are normalized on the coherent `0.12.0-beta.1` prerelease line and licensed under Apache-2.0; publication remains gated by npm registry ownership/trusted-publisher setup and remaining beta acceptance evidence.

## Current product priority

Qroz has enough architectural foundation to shift from breadth toward **developer-experience depth**.

Near-term sequencing is:

1. make the framework publishable as a truthful public beta: final identity, license, package metadata, clean-install proof, docs and trusted release pipeline;
2. finish the Qroz DX Preview: source-first dev, navigable Studio, source-aware errors and performance budgets;
3. keep durable workflows to a deliberately small, provider-proven portable subset;
4. finish security evidence needed for stronger production claims;
5. deepen semantic deployment/change review and agent-safe interfaces.

The framework should not expand primitives merely to match competitors. **Qroz owns semantics; providers own primitives.**

## Implemented and verified

- application/module/endpoint/event/listener/job definitions;
- Standard-Schema-compatible HTTP and job validation;
- Web Standards HTTP runtime;
- memory and Cloudflare Worker runtimes;
- AWS Lambda/API Gateway HTTP API v2 runtime adapter;
- explicit capabilities/providers and invocation scopes;
- execution-surface provider validation;
- object storage with memory/R2/S3 adapters;
- queue producer with memory/Cloudflare/SQS adapters;
- memory, Cloudflare and Lambda/SQS job consumers;
- retry outcomes, poison handling and AWS partial batch responses;
- lease-based durable idempotency;
- memory, SQLite Durable Object and DynamoDB idempotency stores;
- SQLite Durable Object executed in workerd;
- AWS SDK v3 + Floci integration for S3/SQS/DynamoDB;
- full Floci Lambda/API Gateway/SQS/DynamoDB/S3 end-to-end integration;
- PostgreSQL 18 + Drizzle + pg integration;
- semantic tracing contract and Cloudflare custom spans;
- W3C trace context through job envelopes;
- deterministic Application Graph schema v7 with operation-level resource access, authorization policies and workflow state graphs;
- provider-neutral deployment plans plus AWS IAM and Cloudflare binding planners;
- runtime-enforced resource operation grants;
- portable endpoint principal/permission authorization foundations;
- structured authentication/permission/policy authorization decisions with claim-redacted principals;
- named contextual endpoint policies over validated input with declared capability dependencies;
- portable request authentication hook with bearer and cookie-session mechanisms;
- Cloudflare and AWS per-invocation principal resolution;
- experimental workflow graph with task/sleep/succeed states, memory execution and bounded retries;
- supported workflow subset executed through Cloudflare Workflows in Wrangler's local Workflow runtime;
- workflow task execution surfaces in deployment planning;
- AWS Step Functions and Cloudflare Workflows planning for the supported workflow subset;
- CLI inspect/validate/explain/context/diff/plan;
- read-only MCP v2.

## What the current foundation proves

The same Qroz application semantics execute across Cloudflare-shaped and AWS-shaped environments without domain modules importing provider SDKs. AWS validation uses the official AWS SDK v3 plus Floci's Docker-backed Lambda runtime with Node.js 24.

This is strong portability evidence, not a claim that a local emulator reproduces every production AWS behavior.

## Important limits

- authorization now covers runtime principals, permissions, capability-aware contextual resource policies and portable HTTP authentication composition; audit-friendly decision records, richer policy composition, real identity-provider integrations and principal propagation through non-HTTP surfaces remain open;
- R2/Cloudflare Queues still need deeper official end-to-end integration coverage;
- Hyperdrive itself remains a deployment integration gate;
- AWS tracing bridge remains open;
- deployment planners are reviewable plans, not yet an infrastructure apply engine;
- Cloudflare Workflow execution is verified in Wrangler's local Workflow runtime for the supported subset; real Cloudflare account execution and Step Functions execution are still required before portability claims stabilize;
- pre-1.0 APIs and graph schemas may change.

See [roadmap](./roadmap.md) and [quality gates](./quality-gates.md).
