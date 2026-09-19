# ADR 0006 — Separate portable web execution from platform adapters

Status: accepted

## Decision

HTTP execution lives in `@arc/runtime-web`, which depends on Web Standards and Arc core definitions. Platform packages are thin adapters.

`@arc/runtime-memory` wraps this engine without platform context. `@arc/runtime-cloudflare` maps `(request, env, executionCtx)` into an Arc execution context and can derive request-scoped providers from bindings.

## Why

Duplicating routers/validation/event execution per runtime would cause semantic drift. Putting Cloudflare types into the shared runtime would destroy portability.

## Consequence

Platform adapters remain intentionally small. Provider-specific behavior belongs in resource adapters such as `@arc/storage-r2` rather than in the HTTP engine.
