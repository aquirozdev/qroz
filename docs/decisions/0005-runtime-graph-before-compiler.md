# ADR 0005: Runtime Application Graph before static compiler

**Status:** accepted

## Decision

Derive the initial Application Graph from explicit runtime definitions. Do not build AST/compiler infrastructure yet.

## Rationale

We do not yet know which metadata deserves static extraction. Building a compiler first creates high implementation risk before proving the application model.

## Consequence

Static compilation remains a future optimization/feature. The public definitions should be designed so a compiler can consume or reproduce them later.
