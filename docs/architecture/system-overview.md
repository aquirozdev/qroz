---
title: System architecture
description: The high-level technical architecture of Arc.
---

# System architecture

Arc separates semantic application definition, portable execution and platform composition.

```text
                       TypeScript application
                               │
                               ▼
                     Application Model
                               │
                     Application Graph
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
     Runtime execution    Developer tooling    Deployment model
          │                    │                    │
     HTTP/events/jobs     CLI/MCP/LSP/docs     bindings/IAM/infra
          │
          ▼
     Capability layer
          │
   ┌──────┼─────────┐
   ▼      ▼         ▼
Memory  Cloudflare  AWS
```

## Layer responsibilities

### Core

Owns semantic definitions, invariants, graph generation and portable error contracts. It cannot import cloud vendor APIs.

### Runtime Web

Owns Web-Standards HTTP execution: route matching, input/output validation, surface capability checks and error conversion.

### Runtime adapters

Translate platform invocation context into Arc execution context. They own platform-specific bindings, tracing bridges and lifecycle hooks.

### Resource packages

Define portable resource capabilities and compatibility contracts.

### Provider adapters

Map resource capabilities onto concrete SDKs/bindings and expose native escape hatches where necessary.

### Developer/agent tooling

Consumes the Application Graph. Tooling must not independently rediscover architecture through source scanning when the model already knows it.

## Architectural invariants

See [project principles](../project/principles.md) and [quality gates](../project/quality-gates.md).
