# Qroz repository instructions for GitHub Copilot

Qroz is a pre-1.0 research framework. Optimize for architectural truth, portability evidence, and small public APIs rather than feature count.

## Required context

Before a substantial change, read:

- `AGENTS.md`
- `docs/README.md`
- `docs/project/vision.md`
- `docs/project/principles.md`
- `docs/project/status.md`
- `docs/project/roadmap.md`
- relevant ADRs under `docs/decisions/`

## Development method

Qroz uses example-first API design + outside-in TDD + contract tests.

For behavior changes:

1. start from the desired application-facing API;
2. add or update an executable example;
3. add a failing outside-in test;
4. if portability is claimed, exercise a shared contract against multiple implementations;
5. implement the smallest coherent behavior;
6. run `npm run verify`;
7. update graph fixtures/docs/ADR if semantics changed.

## Architectural invariants

- Never import cloud/vendor APIs into `@qroz/core`.
- Do not introduce mandatory decorators/reflection.
- Do not bypass `requires`, `emits`, or `dispatches`.
- Do not call a one-provider abstraction portable.
- Do not claim exactly-once execution.
- Do not expose secrets through graph, CLI, MCP, logs, or examples.
- Keep runtime HTTP boundaries Web Standards-oriented.
- Prefer Standard Schema over validator-specific APIs.
- Prefer small adapters over reimplementing an ORM, validator, test runner, IaC engine, or telemetry backend.
- Preserve provider-native escape hatches.
- Mutating MCP/agent operations require an authorization/approval/audit model first.

## Repository workflow

- Work in a focused branch.
- Keep one architectural concern per PR where practical.
- Use the PR template.
- Never merge while required CI gates are red.
- Update canonical docs rather than creating duplicate explanations.
- Time-sensitive ecosystem facts belong in `docs/research/`.
- Durable architectural decisions require an ADR.

## Machine-friendly behavior

Prefer deterministic JSON-safe output, stable semantic names and structured errors. Avoid output that requires an agent to parse decoration or infer architecture from file layout.
