---
title: Support matrix
description: Current evidence level for runtimes, resources, protocols, and integrations.
---

# Support matrix

Legend:

- **Verified** — executed by CI against real service/runtime or official runtime tooling.
- **Contract** — adapter behavior exercised against shared/interface-faithful contracts.
- **Planned** — roadmap only.

| Capability | Local/portable | Cloudflare | AWS |
| --- | --- | --- | --- |
| HTTP runtime | Verified | Verified in workerd | Planned Lambda |
| Object storage | Verified memory | Contract R2 | Planned S3 |
| Queue producer | Verified memory | Contract | Planned SQS |
| Job consumer | Verified memory | Contract semantics | Planned Lambda/SQS |
| Durable idempotency | Verified memory | Verified SQLite DO/workerd | Planned |
| PostgreSQL + Drizzle | Verified CI PostgreSQL 18 | Hyperdrive real-cloud pending | N/A |
| Semantic tracing | Verified recording tracer | Contract/native bridge | Planned |
| W3C job trace propagation | Verified | Verified envelope path | Planned |
| MCP v2 read-only | Verified CI | Web-compatible | Runtime-neutral |
| Durable workflows | Planned | Planned Cloudflare Workflows | Planned Step Functions |
| Auth/policies | Planned | Planned adapter | Planned adapter |

This table is intentionally conservative. “Contract” is not a synonym for production integration.
