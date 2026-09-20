# ADR 0006 — Separate portable web execution from platform adapters

Status: accepted

## Decision

HTTP execution lives in `@qroz/runtime-web`, which depends on Web Standards and Qroz core definitions. Platform packages are thin adapters.

`@qroz/runtime-memory` wraps this engine without platform context. `@qroz/runtime-cloudflare` maps `(request, env, executionCtx)` into an Qroz execution context and can derive request-scoped providers from bindings.

## Why

Duplicating routers/validation/event execution per runtime would cause semantic drift. Putting Cloudflare types into the shared runtime would destroy portability.

## Consequence

Platform adapters remain intentionally small. Provider-specific behavior belongs in resource adapters such as `@qroz/storage-r2` rather than in the HTTP engine.
