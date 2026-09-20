# Arc — portable TypeScript application framework

> **Research project / codename.** Arc is pre-1.0 and its public API may change.

Arc is a serverless-first TypeScript application framework for **humans and AI agents**. The goal is Laravel-level application ergonomics with explicit distributed-system semantics, Web Standards portability, typed capabilities, a machine-readable Application Graph, and provider-native escape hatches.

```ts
export default app({
  name: "acme",
  modules: [users, billing, notifications]
})
```

## Current research line — v0.8

Implemented and exercised today:

- explicit app/module/endpoint/event/listener/job model;
- Standard-Schema-compatible validation;
- Web Standards HTTP runtime;
- memory, Cloudflare Worker and AWS Lambda/API Gateway adapters;
- typed capabilities, providers and invocation lifecycle;
- deterministic Application Graph schema v3;
- object storage with memory/R2/S3 adapters;
- queue producer with memory/Cloudflare/SQS adapters;
- typed jobs with memory, Cloudflare and Lambda/SQS consumers;
- retries, poison-message handling and partial batch failure mapping;
- durable lease-based idempotency with memory, SQLite Durable Object and DynamoDB adapters;
- SQLite Durable Object idempotency executed in workerd;
- AWS SDK v3 + Floci integration for S3, SQS and DynamoDB;
- full zero-cost AWS-shaped flow in Docker: API Gateway v2 → Lambda Node 24 → Arc → SQS → Lambda → Arc Job → DynamoDB/S3;
- PostgreSQL 18 + Drizzle + pg integration in CI;
- semantic tracing and W3C job-envelope trace propagation;
- deterministic CLI tools: inspect, validate, explain, context and semantic diff;
- official MCP v2 read-only integration.

The next architectural priority is **operation-level resource access/grants**, so the Application Graph can distinguish reads/writes/publishes and later produce honest least-privilege IAM/deployment plans.

## Documentation

The canonical documentation map is [docs/README.md](./docs/README.md).

Recommended entry points:

- [Getting started](./docs/getting-started/README.md)
- [Mental model](./docs/getting-started/mental-model.md)
- [Product vision](./docs/project/vision.md)
- [System architecture](./docs/architecture/system-overview.md)
- [Roadmap](./docs/project/roadmap.md)
- [Current status](./docs/project/status.md)
- [Support matrix](./docs/project/support-matrix.md)
- [Quality gates](./docs/project/quality-gates.md)

## Verify

```bash
npm install
npm run verify
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) before architectural changes.
