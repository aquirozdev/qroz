---
title: Current status
description: Current implementation and verification state of Arc.
---

# Current status

Current repository version: **0.8 research line**.

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
- deterministic Application Graph schema v3;
- CLI inspect/validate/explain/context/diff;
- read-only MCP v2.

## What v0.8 proves

The same Arc application semantics execute across Cloudflare-shaped and AWS-shaped environments without domain modules importing provider SDKs. AWS validation uses the official AWS SDK v3 plus Floci's Docker-backed Lambda runtime with Node.js 24.

This is strong portability evidence, not a claim that a local emulator reproduces every production AWS behavior.

## Important limits

- resource dependencies are capability-granular, not yet operation-granular; honest least-privilege IAM generation needs a finer access model;
- R2/Cloudflare Queues still need deeper official end-to-end integration coverage;
- Hyperdrive itself remains a deployment integration gate;
- AWS tracing bridge and IAM/deployment planning are not implemented yet;
- workflows/auth/policies remain planned;
- pre-1.0 APIs and graph schemas may change.

See [roadmap](./roadmap.md) and [quality gates](./quality-gates.md).
