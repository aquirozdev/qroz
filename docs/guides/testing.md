---
title: Testing Qroz applications
description: Outside-in tests, shared contracts, platform gates, and what each level proves.
---

# Testing Qroz applications

Qroz uses multiple test levels because a unit test cannot prove runtime portability.

## 1. Outside-in application tests

Exercise the same public API an application author uses.

```ts
const runtime = createTestRuntime(application)
const response = await runtime.fetch(
  new Request("https://app.test/users/123")
)
```

These protect application ergonomics and framework behavior.

## 2. Unit tests

Use focused unit tests for pure algorithms, parser behavior, retry calculations and graph transformations.

## 3. Adapter contract tests

A resource abstraction should have a shared contract executed against multiple implementations.

Examples:

- memory storage and R2 adapter;
- memory queue and Cloudflare Queue adapter.

## 4. Runtime/platform integration tests

Execute against official tooling/runtime whenever the compatibility claim depends on platform behavior.

Current examples:

- Wrangler/workerd HTTP smoke;
- SQLite Durable Object in workerd;
- PostgreSQL 18 + Drizzle + pg.

## 5. Deployment integration

Some claims cannot be proven locally: Hyperdrive networking, real IAM, cloud queue redrive, OTLP export. These require environment-specific gates and must remain documented as pending until automated.

See [quality gates](../project/quality-gates.md).
