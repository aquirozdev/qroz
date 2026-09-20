---
title: Framework errors
description: Current ARC error-code catalog and stability rules.
---

# Framework errors

Arc uses stable machine-readable error codes so CLI, tests, documentation and agents can reason about framework invariants without parsing prose.

| Code | Meaning | Typical remediation |
| --- | --- | --- |
| `ARC1001` | Duplicate module name | Give every application module a unique semantic name |
| `ARC1002` | Duplicate HTTP route | Change/remove the conflicting method + path pair |
| `ARC1003` | Duplicate capability provider | Configure one provider per capability token in a composition |
| `ARC1004` | Missing capability provider | Supply the required capability for the active execution surface |
| `ARC1005` | Undeclared capability use | Add the capability to `requires` before `ctx.use()` |
| `ARC1006` | Ambiguous capability name | Reuse the same token or choose distinct semantic names |
| `ARC1007` | Undeclared event emission | Add the event to `emits` |
| `ARC1008` | Duplicate job definition | Keep every `name@version` pair unique |
| `ARC1009` | Undeclared job dispatch | Add the job to `dispatches` |
| `ARC2001` | Malformed JSON request | Send syntactically valid JSON |
| `ARC2002` | Endpoint output contract violation | Return a value accepted by the declared output schema |
| `ARC2003` | Invalid job payload | Send a payload compatible with the job's declared version/schema |

Use:

```bash
arc explain ARC1005 --json
```

## Stability

Before 1.0, new codes may be added and categorization may evolve. Reusing an existing code for a materially different meaning is prohibited. Once external automation depends on the catalog, removals/renames require deprecation/migration policy.
