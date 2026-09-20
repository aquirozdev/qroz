---
title: Agents and machine DX
description: How Arc makes application architecture discoverable and safe for coding and operational agents.
---

# Agents and machine DX

Arc treats machine usability as a first-class form of developer experience.

The goal is not to make an AI agent omnipotent. The goal is to make architecture explicit enough that tools do not need to infer fundamental facts by scanning an entire repository.

## Existing machine surfaces

- deterministic Application Graph;
- `arc inspect --json`;
- `arc context --json`;
- `arc diff --json`;
- `arc explain --json`;
- read-only MCP v2 integration;
- stable framework error codes.

## Design rules

1. Machine output is deterministic.
2. Human and agent tools consume the same semantic functions.
3. The Application Graph is the source of architecture context.
4. Read operations come before mutations.
5. Mutations require explicit authorization/approval models.
6. Secret values are never returned as architecture context.
7. Agent convenience does not bypass application invariants.

See [MCP](./mcp.md) and [security boundaries](../architecture/security-and-agent-boundaries.md).
