# Contributing to Qroz

Qroz is an early research framework. Contributions should strengthen its **developer experience, semantic model and evidence base** rather than maximize feature count.

## Before changing framework behavior

1. Read `AGENTS.md`.
2. Read `docs/README.md`, the product vision and design principles.
3. Check the relevant concept/architecture page and ADRs.
4. Design the desired application-facing experience first.
5. Prefer removing ceremony over adding helpers around ceremony.
6. Add an outside-in failing test.
7. If portability is claimed, add or extend a shared contract.
8. Implement the smallest coherent change.
9. Run `npm run verify`.
10. Update graph fixtures/documentation when semantics change.
11. Measure DX/typecheck impact when changing definitions, inference or dev tooling.
12. Add an ADR when the decision constrains future architecture.

## Pull requests

A PR description should state:

- user/application problem;
- desired developer experience;
- public API change;
- graph/model change;
- portability impact;
- error/failure behavior;
- DX/performance impact where relevant;
- tests/gates executed;
- docs/ADR updates;
- known limitations.

A PR can be rejected for making the framework harder to understand or slower to work with even when its runtime behavior is correct.

## Product constraints

- Code/Application Graph remain the semantic source of truth.
- Qroz Studio must not introduce dashboard-only application state.
- New primitives require reference-application demand, not competitor parity.
- Prefer integrations/adapters over replacing mature ecosystems.
- Workflows remain deliberately scoped until real applications require broader semantics.

## Documentation contributions

Follow `docs/project/documentation-strategy.md`. Prefer links over duplicated explanations and distinguish implemented/verified/planned behavior.

## Compatibility

Qroz is pre-1.0. Breaking changes are possible, but accidental breaking changes are not acceptable. Changes to public APIs, graph schema or message envelopes must be explicit and documented.
