# Instructions for coding agents

Arc is developed from final-user examples inward. Do not optimize for adding framework surface; optimize for preserving a small, truthful semantic model.

## Required loop

Before adding or changing an abstraction:

1. Write/modify an example showing the desired final application API.
2. Add an outside-in test that fails for the missing behavior.
3. If portability is claimed, add/extend a shared contract and run it against at least two implementations.
4. Implement the smallest coherent behavior.
5. Run `npm run verify`.
6. Update Application Graph output if architecture changed.
7. Update docs/ADR when a decision constrains future design.

## Architectural invariants

Do not:

- introduce decorators/reflection into `@arc/core`;
- import AWS/Cloudflare/Node vendor types into `@arc/core`;
- bypass `requires`, `emits`, or `dispatches` metadata;
- relax strict compiler options;
- introduce an abstraction from one provider and label it portable;
- invent a custom ORM/schema/test runner/bundler without evidence;
- hide provider-specific functionality when an explicit escape hatch is more truthful;
- create process-global database clients for serverless invocations;
- claim exactly-once delivery or durable idempotency without a durable enforcement mechanism;
- add a second tracing backend when a runtime already exposes compatible native tracing primitives.

Prefer:

- Web Standards;
- deterministic JSON-friendly definitions;
- semantic capability names;
- Standard Schema compatible validation;
- application-specific repository ports;
- small adapters around vendor SDKs;
- invocation-scoped providers;
- explicit execution surfaces and least-privilege composition;
- contract tests;
- native platform telemetry bridged through a portable semantic interface.

## Current status

At v0.4:

- 43 tests pass;
- runtime-web/memory/cloudflare adapters exist;
- storage memory/R2 adapters pass shared contract;
- queue memory/Cloudflare producer adapters pass shared contract;
- typed/versioned jobs, memory consumer and Cloudflare Queue consumer exist;
- job dispatch declarations are enforced and represented in Application Graph schema v2;
- execution surfaces validate only the providers they actually require;
- async invocation-scoped providers are supported;
- portable semantic tracing and Cloudflare custom-span bridging exist;
- `inspect`, `validate`, `explain`, `context`, `diff` exist;
- real workerd execution is not yet verified because npm registry DNS is unavailable;
- durable idempotency and cross-process trace propagation are not implemented yet.

## Current priority

1. Real workerd integration via official Cloudflare tooling.
2. Drizzle + `pg` + PostgreSQL/Hyperdrive vertical slice using invocation-scoped clients.
3. Durable idempotency contract/store and W3C trace-context propagation for jobs.
4. Read-only MCP v2 server over the Application Graph.
5. SQS adapter as the second external queue/consumer implementation before stabilizing advanced job semantics.
6. Auth/policies and durable Workflows only after the above gates are green.

Read `docs/ROADMAP.md`, `docs/QUALITY-GATES.md`, `docs/JOBS.md`, `docs/OBSERVABILITY.md`, and relevant ADRs before large changes.
