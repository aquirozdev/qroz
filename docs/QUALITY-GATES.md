# Quality gates

Arc uses gates instead of feature-count milestones. A phase is not “done” because code exists; it is done when the relevant portability or DX claim is exercised.

## Always-on gates

Every change must preserve:

1. TypeScript `strict` mode.
2. `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`.
3. No decorators/reflection requirement in `@arc/core`.
4. No vendor imports from `@arc/core`.
5. Deterministic Application Graph output.
6. Every `ctx.use()` capability declared in `requires`.
7. Every emitted event declared in `emits`.
8. Every dispatched job declared in `dispatches`.
9. Stable machine-readable errors for framework invariants.
10. Outside-in behavior tests for public APIs.
11. Shared contract tests for cross-provider abstractions.
12. No global serverless DB connections when a provider requires invocation lifecycle.
13. No portability claim until at least two implementations exercise the abstraction.
14. No exactly-once/idempotency claim without durable enforcement.

## v0.4 verified matrix

| Area | Memory / portable | Cloudflare-shaped adapter | Real platform |
|---|---:|---:|---:|
| HTTP runtime | ✅ | ✅ | ⏳ workerd gate |
| invocation-scoped async providers | ✅ | ✅ | ⏳ workerd gate |
| Object Storage | ✅ | ✅ R2 shape | ⏳ real/local R2 |
| Queue producer | ✅ | ✅ Queue shape | ⏳ real/local Queue |
| Queue consumer | ✅ memory | ✅ per-message ack/retry shape | ⏳ real/local Queue |
| Typed jobs/retry engine | ✅ | ✅ mapped to Queue consumer | ⏳ real/local Queue |
| Semantic tracing | ✅ recording tracer | ✅ native custom-span shape | ⏳ workerd trace export |
| Application Graph v2 | ✅ | n/a | n/a |
| CLI / agent output | ✅ | n/a | n/a |

The middle column means the adapter is executed against a contract-faithful fake using the documented platform interface. It is intentionally not labeled a production integration test.

## Cloudflare gate

Before Arc can claim Cloudflare runtime integration rather than adapter compatibility:

- install current Wrangler / Cloudflare Vitest plugin;
- execute HTTP contract tests inside workerd;
- execute R2 contract against local R2 simulation;
- execute Queue producer/consumer integration against local Queue simulation;
- run the deployable `wrangler.jsonc` example with `wrangler dev`;
- verify native custom spans and OTLP export from the example;
- record exact tool versions in CI.

## Database gate

Before database support is called complete:

- run a real PostgreSQL container/local DB test;
- integrate Drizzle + supported `pg` through an invocation-scoped provider;
- execute the same repository contract locally and through Hyperdrive/workerd;
- document transaction semantics;
- test migration workflow independently from request runtime;
- prove client lifecycle does not rely on a process-global connection.

## Durable job gate

Before calling jobs production-ready:

- define and test a durable idempotency store contract;
- enforce idempotency key state transitions rather than merely carrying metadata;
- propagate W3C trace context across producer/consumer boundaries;
- test delayed retry boundaries and provider-specific limits;
- validate DLQ configuration in a real/local provider integration;
- add SQS as a second external consumer implementation;
- document schema evolution for old queued envelopes.

## MCP gate

Before advertising agent-native MCP integration:

- use the current official MCP TypeScript SDK/spec rather than a hand-rolled protocol;
- expose read-only graph/context/error/diff tools first;
- validate auth/capability boundaries before any mutating tool;
- test deterministic machine output independently from LLM behavior.
