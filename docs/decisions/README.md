---
title: Architecture decisions
description: Index and policy for Qroz Architecture Decision Records.
---

# Architecture Decision Records

ADRs capture decisions that constrain future implementation choices.

## Existing decisions

1. [Example-first TDD](./0001-example-first-tdd.md)
2. [Explicit definitions](./0002-explicit-definitions.md)
3. [Capabilities](./0003-capabilities.md)
4. [Web Standards runtime](./0004-web-standards-runtime.md)
5. [Runtime graph before compiler](./0005-runtime-graph-before-compiler.md)
6. [Runtime Web and Cloudflare](./0006-runtime-web-and-cloudflare.md)
7. [Resources require two adapters](./0007-resources-require-two-adapters.md)
8. [Graph integrity](./0008-graph-integrity.md)
9. [Jobs as application primitives](./0009-jobs-as-application-primitives.md)
10. [Execution-surface provider validation](./0010-execution-surface-provider-validation.md)
11. [Platform-native tracing](./0011-platform-native-tracing.md)
12. [Lease-based job idempotency](./0012-lease-based-job-idempotency.md)

## When to add an ADR

Add one when a decision:

- constrains multiple packages;
- changes portability boundaries;
- commits to a protocol/standard;
- introduces an architectural invariant;
- rejects a plausible alternative for a durable reason.

## Template

```md
# NNNN — Decision title

Status: proposed | accepted | superseded
Date: YYYY-MM-DD

## Context
## Decision
## Consequences
## Alternatives considered
## Evidence / sources
```
