# Instructions for coding agents

Qroz is developed from the desired application experience inward. Optimize for **small, truthful semantics and exceptional DX**, not framework surface area.

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
2. Ask whether the change removes or adds user-visible ceremony.
3. Add an outside-in failing test.
4. If portability is claimed, extend a shared contract and exercise multiple implementations.
5. Implement the smallest coherent behavior.
6. Run `npm run verify`.
7. Update Application Graph fixtures if semantics changed.
8. Update canonical docs.
9. Add an ADR when a decision constrains future architecture.
10. For DX-sensitive work, measure feedback/typecheck impact on representative applications.

## Architectural invariants

Do not:

- introduce decorators/reflection into `@qroz/core`;
- import AWS/Cloudflare/Node vendor APIs into `@qroz/core`;
- bypass `requires`, `emits`, authorization or runtime enforcement;
- weaken TypeScript strictness;
- label a one-provider abstraction portable;
- build a custom ORM/schema/test runner/bundler/identity provider/LLM SDK/IaC engine without compelling evidence;
- hide useful provider-native behavior behind a false common denominator;
- create process-global resource clients where the provider requires invocation lifecycle;
- claim exactly-once behavior without proof;
- expose secret values in graph, CLI, Studio, agent interfaces or docs;
- expose mutating agent tools before authorization/approval/audit semantics exist;
- create dashboard-only semantic state;
- add whole-application type inference merely to make a local API look clever;
- expand workflows into a general-purpose orchestration product without reference-app evidence.

Prefer:

- Web Standards-compatible runtime boundaries;
- deterministic JSON-friendly definitions;
- Standard Schema validation;
- small vendor adapters;
- invocation-scoped providers;
- explicit execution surfaces;
- contract tests;
- actionable error messages;
- local-first workflows;
- incremental computation;
- generated compact contracts instead of unbounded TypeScript inference;
- native platform telemetry behind a portable semantic interface.

## Product direction

**Qroz owns semantics. Providers own primitives.**

The near-term priority is:

1. security/authorization semantics;
2. a deliberately small durable-execution subset;
3. Qroz DX Preview: `qroz dev`, Qroz Studio, beautiful errors, fast inspection/testing;
4. semantic deployment/security diffs;
5. agent-native interfaces over the same Application Graph.

Do not prioritize feature-count parity with Nest, Laravel, Hono, Temporal, Vercel, Encore or cloud providers.

## Product truth rule

Important behavior must be explainable from at least one of:

- application source;
- Application Graph;
- execution trace;
- deployment/change plan.

If a feature requires hidden state outside those surfaces, challenge the design.

## Documentation rule

Do not add a second explanation of an existing concept. Update the canonical page and link to it. Time-sensitive external facts go under `docs/research/`. Run `npm run docs:check`.
