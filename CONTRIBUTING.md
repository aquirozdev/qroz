# Contributing to Arc

Arc is an early research framework. Contributions should strengthen its semantic model and evidence base rather than maximize feature count.

## Before changing framework behavior

1. Read `AGENTS.md`.
2. Read `docs/README.md`.
3. Check the relevant concept/architecture page and ADRs.
4. Design the desired application-facing API first.
5. Add an outside-in failing test.
6. If portability is claimed, add or extend a shared contract.
7. Implement the smallest coherent change.
8. Run `npm run verify`.
9. Update graph fixtures/documentation when semantics change.
10. Add an ADR when the decision constrains future architecture.

## Pull requests

A PR description should state:

- user/application problem;
- public API change;
- graph/model change;
- portability impact;
- tests/gates executed;
- docs/ADR updates;
- known limitations.

## Documentation contributions

Follow `docs/project/documentation-strategy.md`. Prefer links over duplicated explanations and distinguish implemented/verified/planned behavior.

## Compatibility

Arc is pre-1.0. Breaking changes are possible, but accidental breaking changes are not acceptable. Changes to public APIs, graph schema or message envelopes must be explicit and documented.
