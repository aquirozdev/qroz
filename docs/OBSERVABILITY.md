# Observability

Arc provides semantic tracing while allowing each runtime to use its native tracing implementation.

## Current spans

- `arc.endpoint`
- `arc.listener`
- `arc.job`

Cloudflare maps these to native Workers custom spans so they nest with automatic platform instrumentation.

## Distributed propagation

Arc v0.7 propagates valid W3C `traceparent` and optional `tracestate` from incoming HTTP requests into typed Job envelopes and exposes the context to the Job handler.

This does **not** currently imply that a Cloudflare Queue consumer span becomes a direct child of the producer HTTP span. As of September 2026, Workers custom spans do not support manual parent-child wiring and do not expose span context IDs. Arc therefore preserves the interoperable context without fabricating a relationship the platform cannot currently express.

A future OpenTelemetry adapter (or future Workers API support) may consume the same propagated context to create true cross-boundary parent relationships.
