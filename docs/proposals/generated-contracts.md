---
title: Proposal — generated contracts
description: Planned OpenAPI, SDK, MCP and schema artifacts derived from Arc application definitions.
---

# Proposal — generated contracts

Status: **planned/partial**. MCP already consumes Arc semantics, while OpenAPI/SDK generation is not implemented.

One declared endpoint contains useful information:

```text
method
path
input schema
output schema
auth/policies
semantic identity
```

Potential generated artifacts:

- OpenAPI;
- JSON Schema where source schemas can be represented faithfully;
- TypeScript client;
- optional external-language SDKs;
- API documentation;
- MCP tools for explicitly exposed actions.

## Rule

Generation must not silently lie when a Standard Schema implementation cannot be losslessly converted to JSON Schema/OpenAPI. Arc should expose unsupported/opaque schema information explicitly.

## Monorepo DX

For same-TypeScript-workspace consumers, direct type inference may be preferable to code generation. Generated clients primarily matter across repository/language/deployment boundaries.
