# ADR 0004: Web Standards runtime boundary

**Status:** accepted

## Decision

HTTP runtimes expose `fetch(Request): Promise<Response>` and core packages avoid Node-specific HTTP objects.

## Rationale

This maximizes compatibility with modern serverless/edge runtimes and aligns with the project's portability goals.

## Consequence

Node-specific conveniences belong in adapters, not the core.
