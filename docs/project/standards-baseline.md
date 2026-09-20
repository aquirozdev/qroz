---
title: Standards baseline
description: External standards and protocol families Arc deliberately aligns with.
---

# Standards baseline

Arc should integrate with ecosystem standards when a durable standard exists instead of inventing project-specific equivalents.

This page records architectural dependencies; exact time-sensitive versions remain in research notes.

## Server runtime APIs

**Ecma TC55 Minimum Common Web API**

Arc's portable HTTP/runtime boundary follows Web Platform primitives rather than Node- or vendor-specific request types.

## Validation

**Standard Schema V1**

Arc accepts the common TypeScript validation interface instead of requiring Zod/Valibot/ArkType.

**Standard JSON Schema V1**

Where schemas support this optional interface, Arc can request JSON Schema conversion without a validator-specific adapter.

## HTTP API descriptions

**OpenAPI 3.2.x**

OpenAPI is the intended external HTTP API description format once Arc implements generation. OpenAPI 3.2 uses a JSON Schema 2020-12-based dialect.

## Event/message API descriptions

**AsyncAPI 3.x**

AsyncAPI is a candidate generated description for externally meaningful event/message channels. Arc events/jobs remain application semantics; AsyncAPI is an interchange/documentation artifact, not Arc's internal model.

## Data schemas

**JSON Schema 2020-12**

Current published JSON Schema baseline. Arc should not require every Standard Schema implementation to support lossless JSON Schema conversion.

## Trace propagation

**W3C Trace Context**

`traceparent` and `tracestate` are the portable propagation fields for distributed trace context.

## Telemetry semantics/export

**OpenTelemetry**

Arc aligns semantic attributes with stable OTel conventions where available and keeps unstable areas (notably messaging semantics as of September 2026) namespaced/versionable.

## Agent interoperability

**Model Context Protocol (MCP) 2026-07-28**

Arc uses the official TypeScript SDK v2 for MCP instead of hand-rolling framing/transports.

## Rule

Standards are integration boundaries, not excuses to leak every external specification into `@arc/core`. The core owns Arc semantics; adapters/generators map those semantics to standards.
