---
title: Quality gates
description: Evidence required before Arc advertises runtime, resource, distributed-system, and agent capabilities.
---

# Quality gates

Arc uses evidence gates instead of declaring features complete because code compiles.

## Always-on

Every change preserves:

1. TypeScript strictness.
2. No cloud vendor imports from `@arc/core`.
3. No mandatory decorators/reflection.
4. deterministic graph/machine output.
5. `requires`, `emits` and `dispatches` integrity.
6. stable machine-readable framework errors.
7. outside-in tests for public behavior.
8. contract tests for portability claims.
9. invocation lifecycle for resources that require it.
10. no exactly-once claim without durable proof.
11. no secret values in graph/agent context.
12. documentation and ADR update when a change alters architectural contracts.

## Current evidence matrix

| Area | Portable/memory | Cloudflare | AWS |
| --- | --- | --- | --- |
| HTTP | verified | workerd verified | planned |
| Storage | memory contract | R2 adapter contract | planned S3 |
| Queue producer | memory contract | adapter contract | planned SQS |
| Job consumer | memory verified | adapter + semantics verified | planned SQS/Lambda |
| Durable idempotency | memory verified | SQLite DO in workerd | planned |
| Database lifecycle | verified | Hyperdrive path designed; deployment gate pending | planned |
| PostgreSQL/Drizzle | CI integration verified | Hyperdrive real-network gate pending | n/a |
| Semantic tracing | recording tracer | custom-span bridge | planned |
| Job trace propagation | verified | envelope propagation verified | planned |
| MCP | official v2 integration | Web Standards compatible | runtime-neutral |

## Before production claims

Resource/platform claims require representative failure-path testing: timeout, duplicate delivery, retries, malformed input, disposal, partial batch failure and provider limits where applicable.

## Before 1.0

Add package/API compatibility policy, graph JSON Schema, security model, release policy, multi-cloud integration suite and documentation build/link checking.
