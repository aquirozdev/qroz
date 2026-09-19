# Development method

## Why this project uses example-first, outside-in development

The greatest risk is not that we cannot write a router. The greatest risk is designing an impressive architecture that becomes unpleasant or impossible to use in a real application.

The development loop is therefore:

```text
1. Write the application API we wish existed.
2. Write an end-to-end acceptance test from the application developer's perspective.
3. Implement the minimum framework behavior required to pass it.
4. Run the same behavior against multiple implementations when an abstraction claims portability.
5. Extract/refine the abstraction only after concrete implementations reveal the real common contract.
6. Record important architectural decisions.
```

This combines:

- example-first API design;
- outside-in TDD;
- walking skeletons;
- runtime/provider contract tests;
- vertical slices;
- small unit tests only where they add diagnostic value.

## Definition of done for framework features

A framework primitive is not considered implemented until it has:

1. A final-user example.
2. An executable behavior test.
3. TypeScript strict-mode coverage.
4. Application Graph representation when architecturally relevant.
5. Structured failure behavior.
6. Documentation describing purpose and limitations.
7. At least two concrete implementations before claiming a provider abstraction is stable.

## Rules that reduce architectural lock-in

### Do not build abstractions from one cloud product

For example, do not stabilize `Queue` after only implementing Cloudflare Queues. Start with memory + Cloudflare, then validate against SQS before promising portability.

### Abstract capabilities, not vendors

Application code should ask for `publish`, `read`, `write`, `transaction`, etc. Provider-only functionality should be represented as optional capabilities or explicit escape hatches.

### Avoid lowest-common-denominator design

Provider adapters should advertise supported capability features. If an application requires delayed delivery, a queue implementation without delay support should fail during planning/build rather than silently degrading behavior.

### Do not introduce a compiler before the runtime model proves what metadata is useful

The current Application Graph is derived directly from explicit definitions. Static AST extraction can be introduced when it solves measured problems rather than as a prerequisite.

## Verification commands

```bash
npm run verify
npm run inspect
npm run inspect:json
```
