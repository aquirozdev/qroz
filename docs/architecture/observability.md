---
title: Observability architecture
description: Arc's semantic telemetry model, W3C trace propagation, and platform-native instrumentation strategy.
---

# Observability architecture

Arc does not ship a proprietary telemetry backend. It emits portable semantic information and integrates with platform-native tracing or OpenTelemetry pipelines.

## Current model

Arc defines semantic spans for:

- endpoints;
- listeners;
- jobs.

Cloudflare maps these to Workers custom spans.

## Trace propagation

v0.7 carries validated W3C `traceparent` and optional `tracestate` values into job envelopes and exposes them to the consumer.

Propagation and span parenting are different guarantees. A platform adapter must not claim parent/child linkage unless its tracing API actually supports injecting the remote parent.

## OpenTelemetry conventions

Arc should align with stable OpenTelemetry semantic conventions where possible:

- HTTP spans are stable;
- database client spans are stable;
- messaging conventions are still in development as of September 2026.

Therefore Arc-specific messaging attributes should remain namespaced and versionable rather than prematurely freezing unstable OpenTelemetry keys.

## Cardinality and privacy

Telemetry metadata must avoid high-cardinality or sensitive values by default. Route templates are preferred over raw paths; payload bodies, credentials and secrets are never telemetry attributes.
