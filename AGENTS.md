# Instructions for coding agents

Arc is developed from the desired application API inward. Optimize for a small, truthful semantic model — not framework surface area.

## Read first

Before a substantial change, read:

1. `docs/README.md`;
2. `docs/project/vision.md`;
3. `docs/project/principles.md`;
4. `docs/project/status.md`;
5. `docs/project/roadmap.md`;
6. relevant architecture/concept pages and ADRs.

## Required development loop

1. Write or update the desired final-user example.
2. Add an outside-in test that fails for the missing behavior.
3. If portability is claimed, extend a shared contract and exercise multiple implementations.
4. Implement the smallest coherent behavior.
5. Run `npm run verify`.
6. Update Application Graph fixtures if semantics changed.
7. Update canonical docs.
8. Add an ADR when a decision constrains future architecture.

## Architectural invariants

Do not:

- introduce decorators/reflection into `@arc/core`;
- import AWS/Cloudflare/Node vendor APIs into `@arc/core`;
- bypass `requires`, `emits`, or `dispatches`;
- weaken TypeScript strictness;
- label a one-provider abstraction portable;
- build a custom ORM/schema/test runner/bundler without compelling evidence;
- hide useful provider-native behavior behind a false common denominator;
- create process-global DB clients where the provider requires invocation lifecycle;
- claim exactly-once behavior without proof;
- expose secret values in graph, CLI, MCP or docs;
- expose mutating MCP tools before authorization/approval/audit semantics exist.

Prefer:

- TC55/Web Standards-compatible runtime boundaries;
- deterministic JSON-friendly definitions;
- Standard Schema validation;
- small vendor adapters;
- invocation-scoped providers;
- explicit execution surfaces;
- contract tests;
- native platform telemetry behind a portable semantic interface.

## Current status

The canonical status is `docs/project/status.md`. At v0.7, Cloudflare/workerd, SQLite Durable Object idempotency, PostgreSQL/Drizzle and MCP v2 have CI integration coverage.

Current architectural priority: prove a second cloud with AWS Lambda + SQS/S3, then build auth/policies, durable workflows and the deployment model.

## Documentation rule

Do not add a second explanation of an existing concept. Update the canonical page and link to it. Time-sensitive external facts go under `docs/research/`. Run `npm run docs:check`.
