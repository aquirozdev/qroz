---
title: Package map
description: Current Qroz packages and their responsibilities.
---

# Package map

## Application/runtime

| Package | Responsibility |
| --- | --- |
| `@qroz/core` | DSL, capabilities, authorization policies, events/jobs metadata, graph, invariant errors |
| `@qroz/auth` | Portable HTTP authentication mechanisms and composition |
| `@qroz/runtime-web` | Portable Web Standards HTTP execution |
| `@qroz/runtime-memory` | Deterministic reference runtime |
| `@qroz/runtime-cloudflare` | Workers adapter and invocation providers |
| `@qroz/testing` | Shared runtime/adapter contract probes |

## Resources

| Package | Responsibility |
| --- | --- |
| `@qroz/database` | ORM-transparent database capability |
| `@qroz/storage` | Object storage contract |
| `@qroz/storage-memory` | Memory storage adapter |
| `@qroz/storage-r2` | Cloudflare R2 adapter |
| `@qroz/queue` | Queue producer capability/feature contract |
| `@qroz/queue-memory` | Memory queue adapter |
| `@qroz/queue-cloudflare` | Cloudflare Queues producer adapter |

## Distributed execution

| Package | Responsibility |
| --- | --- |
| `@qroz/jobs` | Job envelope, registry, executor and retry semantics |
| `@qroz/jobs-memory` | Local deterministic consumer |
| `@qroz/jobs-cloudflare` | Cloudflare Queue consumer |
| `@qroz/idempotency` | Durable idempotency capability contract |
| `@qroz/idempotency-memory` | Lease store for tests/local |
| `@qroz/idempotency-cloudflare-do` | SQLite Durable Object implementation |
| `@qroz/workflows` | Workflow memory executor and portable execution semantics |
| `@qroz/workflows-aws` | AWS Step Functions definition compiler for the supported workflow subset |
| `@qroz/workflows-cloudflare` | Cloudflare Workflows step planner for the supported workflow subset |

## Telemetry and agents

| Package | Responsibility |
| --- | --- |
| `@qroz/telemetry` | Portable semantic tracer contract |
| `@qroz/telemetry-cloudflare` | Workers custom-span bridge |
| MCP integration | Currently exercised through `integration/mcp`; package shape is not stable yet |
| `@qroz/cli` | inspect/validate/explain/context/diff commands |

Package names and boundaries remain pre-1.0 and may change.
