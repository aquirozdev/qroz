---
title: Package map
description: Current Arc packages and their responsibilities.
---

# Package map

## Application/runtime

| Package | Responsibility |
| --- | --- |
| `@arc/core` | DSL, capabilities, events/jobs metadata, graph, invariant errors |
| `@arc/runtime-web` | Portable Web Standards HTTP execution |
| `@arc/runtime-memory` | Deterministic reference runtime |
| `@arc/runtime-cloudflare` | Workers adapter and invocation providers |
| `@arc/testing` | Shared runtime/adapter contract probes |

## Resources

| Package | Responsibility |
| --- | --- |
| `@arc/database` | ORM-transparent database capability |
| `@arc/storage` | Object storage contract |
| `@arc/storage-memory` | Memory storage adapter |
| `@arc/storage-r2` | Cloudflare R2 adapter |
| `@arc/queue` | Queue producer capability/feature contract |
| `@arc/queue-memory` | Memory queue adapter |
| `@arc/queue-cloudflare` | Cloudflare Queues producer adapter |

## Distributed execution

| Package | Responsibility |
| --- | --- |
| `@arc/jobs` | Job envelope, registry, executor and retry semantics |
| `@arc/jobs-memory` | Local deterministic consumer |
| `@arc/jobs-cloudflare` | Cloudflare Queue consumer |
| `@arc/idempotency` | Durable idempotency capability contract |
| `@arc/idempotency-memory` | Lease store for tests/local |
| `@arc/idempotency-cloudflare-do` | SQLite Durable Object implementation |

## Telemetry and agents

| Package | Responsibility |
| --- | --- |
| `@arc/telemetry` | Portable semantic tracer contract |
| `@arc/telemetry-cloudflare` | Workers custom-span bridge |
| MCP integration | Currently exercised through `integration/mcp`; package shape is not stable yet |
| `@arc/cli` | inspect/validate/explain/context/diff commands |

Package names and boundaries remain pre-1.0 and may change.
