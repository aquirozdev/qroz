---
title: Quality gates
description: Evidence required before Arc advertises runtime, resource, developer-experience and agent capabilities.
---

# Quality gates

Arc uses evidence gates instead of declaring features complete because code compiles.

## Always-on architecture gates

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
13. no dashboard-only semantic state.
14. no new abstraction whose primary justification is feature-count parity with another framework.

## Developer-experience gates

Public API work must also preserve:

- **progressive disclosure** — simple examples do not inherit advanced-system ceremony;
- **explainability** — important runtime behavior maps back to source/graph/trace/plan;
- **actionable errors** — stable errors explain cause, owner and safe next steps;
- **local-first operation** — core dev/test/inspect workflows require no hosted account;
- **CLI/UI semantic parity** — Arc Studio consumes the same underlying model;
- **type-system scalability** — representative large applications remain responsive in editor/typecheck;
- **feedback performance** — DX latency budgets are measured and regressions are treated as bugs;
- **visual evidence** — browser-facing DX claims have reproducible journeys with screenshots, video and traces where useful.

## DX benchmark suite required before stabilization

Create representative small, medium and large reference applications and track at minimum:

| Operation | Quality target |
| --- | --- |
| test-client startup | effectively immediate for ordinary apps |
| incremental route/module edit | sub-second, with a stretch goal below 200 ms |
| graph incremental update | sub-second, with a stretch goal below 100 ms |
| `arc inspect` medium app | below 500 ms target |
| Studio semantic refresh | visually immediate |
| editor diagnostics | no multi-second pauses caused by whole-app inference |

Exact budgets may change after measurement; publishing and regression-testing them is the invariant.

## Current evidence matrix

| Area | Portable/memory | Cloudflare | AWS |
| --- | --- | --- | --- |
| HTTP | verified | workerd verified | API Gateway v2/Lambda verified via Floci |
| Storage | memory contract | R2 adapter contract | S3 verified via AWS SDK v3 + Floci |
| Queue producer | memory contract | adapter contract | SQS verified via AWS SDK v3 + Floci |
| Job consumer | memory verified | adapter + semantics verified | Lambda/SQS event source verified via Floci |
| Durable idempotency | memory verified | SQLite DO in workerd | DynamoDB conditional semantics verified via SDK + Floci |
| PostgreSQL/Drizzle | CI integration verified | Hyperdrive real-network gate pending | n/a |
| Semantic tracing | recording tracer | custom-span bridge | AWS bridge pending |
| Operation-level access | verified | binding plan verified | IAM plan verified |
| Endpoint authorization | verified foundation | runtime-neutral contract | runtime-neutral contract |
| Workflow graph/execution | memory verified | local provider execution for supported subset | provider execution evidence incomplete |
| Agent interface | read-only integration | Web-compatible | runtime-neutral |
| Local product DX | CLI foundation | n/a | n/a |
| Arc Studio | browser acceptance + screenshot/video/trace evidence | n/a | n/a |

## Before production claims

Resource/platform claims require representative failure-path testing: timeout, duplicate delivery, retries, malformed input, disposal, partial batch failure and provider limits where applicable.

Security-sensitive features require denial-path, cross-tenant/authority escalation and secret-redaction tests.

Browser-facing product claims use the [visual product evidence](./visual-evidence.md) process so reviewable UX artifacts come from executable scenarios rather than manual mockups.

## Before public package publication

Run `npm run release:check` and satisfy [Public beta readiness](./public-beta-readiness.md). Publication additionally requires clean-tarball installation evidence and a trusted-publishing release path.

## Before 1.0

Add package/API compatibility policy, graph JSON Schema, security model, release policy, multi-cloud integration suite, documentation build/link checking, DX performance CI and a stable semantic-diff/change-review contract.
