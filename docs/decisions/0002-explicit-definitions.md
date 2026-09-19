# ADR 0002: Explicit definitions over decorators and reflection

**Status:** accepted

## Decision

Core framework primitives return explicit definition objects instead of relying on decorators or runtime reflection.

## Rationale

Definitions are naturally inspectable, deterministic, tree-shakeable and easier for static tooling and coding agents to understand.

## Consequence

Some syntactic convenience may be sacrificed. Ergonomic sugar is allowed later only if it preserves the same semantic graph.
