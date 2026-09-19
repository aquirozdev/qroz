# ADR 0003: Capabilities over vendor resources

**Status:** accepted

## Decision

Application code depends on typed capability tokens. Concrete providers bind implementations.

## Rationale

Cloud vendor objects should not leak into domain/application code. Explicit `requires` metadata also gives deployment, security and agent tooling a reliable dependency graph.

## Consequence

The framework must avoid pretending providers have identical semantics. Optional provider features will require a capability matrix rather than lowest-common-denominator APIs.
