---
title: MCP integration
description: Qroz's read-only Model Context Protocol surface and extension policy.
---

# MCP integration

Qroz uses the official MCP TypeScript SDK v2 rather than implementing JSON-RPC or Streamable HTTP itself.

The stable v2 SDK implements the MCP 2026-07-28 specification and provides a Web-standards HTTP handler suitable for Qroz's runtime philosophy.

## Current read-only tools

- `qroz.inspect` — full deterministic Application Graph.
- `qroz.context` — compact context for one module.
- `qroz.explain` — framework error explanation/remediation.

## Why read-only first

Operations such as migrations, production deployment, queue replay, workflow restart and secret access introduce identity, authorization, approval, idempotency and audit requirements.

Qroz will add those only after a common agent-policy model exists.

## Architectural rule

MCP is an adapter over Qroz semantic functions, not a second source of architecture.

```text
Application Graph / semantic services
        ├── CLI
        ├── MCP
        ├── future LSP
        └── future Dev Console
```

## Future considerations

- MCP Resources for architecture/documents may be preferable to tools for some read-only data.
- mutating tools should declare required agent capabilities;
- production-impacting tools should support explicit approval;
- server authentication must remain transport/environment specific rather than embedded into the core.
