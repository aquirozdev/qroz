---
title: Support matrix
description: Current evidence level for runtimes, resources, protocols, and integrations.
---

# Support matrix

Legend:

- **Verified** — exercised in CI against a real service/runtime or runtime-faithful integration environment.
- **Contract** — adapter behavior exercised against shared/interface-faithful contracts.
- **Planned** — roadmap only.

| Capability | Local/portable | Cloudflare | AWS |
| --- | --- | --- | --- |
| HTTP runtime | Verified | Verified in workerd | Verified API Gateway v2/Lambda in Floci |
| Object storage | Verified memory | Contract R2 | Verified AWS SDK v3/S3 via Floci |
| Queue producer | Verified memory | Contract | Verified AWS SDK v3/SQS via Floci |
| Job consumer | Verified memory | Contract semantics | Verified Lambda/SQS ESM via Floci |
| Durable idempotency | Verified memory | Verified SQLite DO/workerd | Verified DynamoDB conditional semantics via SDK/Floci |
| PostgreSQL + Drizzle | Verified PostgreSQL 18 | Hyperdrive real-cloud pending | N/A |
| Semantic tracing | Verified recording tracer | Contract/native bridge | Planned OTel/ADOT bridge |
| W3C job trace propagation | Verified | Verified envelope path | Envelope path portable; AWS span linkage pending |
| MCP v2 read-only | Verified CI | Web-compatible | Runtime-neutral |
| Durable workflows | Planned | Planned Cloudflare Workflows | Planned Step Functions |
| Auth/policies | Planned | Planned adapter | Planned adapter |
| IAM/deployment planning | Planned | Planned bindings plan | Planned least-privilege IAM |

**Floci evidence is emulator evidence**, not production AWS equivalence. Real-cloud tests remain optional until a behavior cannot be established locally.
