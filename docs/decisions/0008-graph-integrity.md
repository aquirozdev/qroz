# ADR 0008 — Application Graph integrity is runtime-enforced

Status: accepted

## Decision

If Qroz claims an effect is visible in the Application Graph, runtime code cannot silently bypass that declaration.

Current invariants:

- capability use requires `requires`;
- event emission requires `emits`;
- capability semantic names are globally unambiguous;
- graph JSON has a schema version.

## Why

A graph used for agent context, IAM, semantic diff or deployment planning is dangerous if it is only advisory documentation.

## Consequence

Qroz intentionally asks developers to declare architectural effects explicitly even when TypeScript could technically execute without that declaration.
