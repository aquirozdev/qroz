# MCP integration

Arc's MCP integration is intentionally a thin, read-only view over the existing Application Graph. MCP is a transport/protocol surface, not a second architecture model.

## SDK

The integration targets the official `@modelcontextprotocol/server` / `@modelcontextprotocol/client` v2 line implementing the 2026-07-28 MCP specification. The Web Standard `createMcpHandler()` is used directly; Arc does not implement JSON-RPC or Streamable HTTP itself.

## Initial tools

- `arc.inspect` returns the deterministic Application Graph.
- `arc.context` returns compact semantic context for one module.
- `arc.explain` returns a stable `ARCxxxx` error descriptor.

These tools are read-only. Database migration, deployment, queue retry, workflow restart, secret access, and other mutations require a future capability/approval policy and are not exposed merely because MCP makes them convenient.

## Design rule

CLI, MCP, future LSP and Dev Console must share the same semantic functions. They must not independently rediscover the application by scanning files.
