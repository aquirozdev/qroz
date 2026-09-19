# ADR 0011 — Prefer platform-native tracing bridges

Status: accepted in v0.4.

## Context

Cloudflare Workers now provides automatic tracing plus custom spans through `ctx.tracing` / `cloudflare:workers`, and can export traces/logs in OpenTelemetry format. Shipping a full telemetry SDK inside every Worker by default would duplicate platform instrumentation and increase bundle/runtime overhead.

## Decision

Arc defines a minimal portable `ArcTracer` contract and semantic span names/attributes. Runtime adapters bridge that contract to platform tracing when available.

Current semantic spans:

- `arc.endpoint`;
- `arc.listener`;
- `arc.job`.

Cloudflare maps them to native custom spans. Memory/testing uses a recording tracer.

## Consequences

- platform-native traces remain the source of low-level fetch/binding spans;
- Arc adds application semantics without owning a telemetry backend;
- future Node/Bun adapters may map to OpenTelemetry SDKs when appropriate.
