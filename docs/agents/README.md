---
title: Agents and machine DX
description: How Qroz makes application architecture discoverable and safe for coding and operational agents.
---

# Agents and machine DX

Qroz treats machine usability as a first-class form of developer experience.

The goal is not to make an AI agent omnipotent. The goal is to make architecture explicit enough that tools do not need to infer fundamental facts by scanning an entire repository.

## Existing machine surfaces

- deterministic Application Graph;
- `qroz inspect --json`;
- `qroz context --json`;
- `qroz diff --json`;
- `qroz explain --json`;
- read-only MCP v2 integration;
- stable framework error codes;
- repository instructions and reusable skills compatible with Codex, Claude Code, OpenCode, and GitHub Copilot.

## Repository agent compatibility

See [multi-agent compatibility](./multi-agent-compatibility.md) for the canonical `AGENTS.md`, Claude adapter, shared skills, specialist agents, and why Qroz does not rely on symlinks.

GitHub-specific agent workflows are documented in [GitHub agents and repository instructions](./github-copilot.md).

## Design rules

1. Machine output is deterministic.
2. Human and agent tools consume the same semantic functions.
3. The Application Graph is the source of architecture context.
4. Read operations come before mutations.
5. Mutations require explicit authorization/approval models.
6. Secret values are never returned as architecture context.
7. Agent convenience does not bypass application invariants.
8. Repository agent instructions have one canonical source and compatibility adapters are mechanically checked.

See [MCP](./mcp.md) and [security boundaries](../architecture/security-and-agent-boundaries.md).
