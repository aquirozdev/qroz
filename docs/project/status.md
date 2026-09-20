---
title: Current status
description: Current implementation and verification state of Arc.
---

# Current status

Current repository version: **v0.10 development line**.

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
- named contextual endpoint policies over validated input;
- portable request authentication hook with bearer and cookie-session mechanisms;
- Cloudflare and AWS per-invocation principal resolution;
- experimental workflow graph with task/sleep/succeed states, memory execution and bounded retries;
- workflow task execution surfaces in deployment planning;
- AWS Step Functions and Cloudflare Workflows planning for the supported workflow subset;
- CLI inspect/validate/explain/context/diff/plan;
- read-only MCP v2.

## What the current v0.9 line proves

The same Arc application semantics execute across Cloudflare-shaped and AWS-shaped environments without domain modules importing provider SDKs. AWS validation uses the official AWS SDK v3 plus Floci's Docker-backed Lambda runtime with Node.js 24.

This is strong portability evidence, not a claim that a local emulator reproduces every production AWS behavior.

## Important limits

- authorization now covers runtime principals, permissions, named contextual policies and portable HTTP authentication composition; real identity-provider integrations, richer policy composition and principal propagation through non-HTTP surfaces remain open;
- R2/Cloudflare Queues still need deeper official end-to-end integration coverage;
- Hyperdrive itself remains a deployment integration gate;
- AWS tracing bridge remains open;
- deployment planners are reviewable plans, not yet an infrastructure apply engine;
- workflow provider planning exists, but real durable execution against Cloudflare Workflows and Step Functions is still required before portability claims stabilize;
- pre-1.0 APIs and graph schemas may change.

See [roadmap](./roadmap.md) and [quality gates](./quality-gates.md).
