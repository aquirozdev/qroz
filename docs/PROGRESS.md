# Progress log

This file records what is **actually implemented and verified**, not what is merely planned.

## v0.1 — walking skeleton

- application/module/endpoint DSL;
- Web Standards request/response execution;
- route params/body validation;
- first Application Graph;
- outside-in tests.

## v0.2 — explicit application dependencies

- typed `capability()` and `provide()`;
- explicit `requires` metadata;
- missing/duplicate provider validation;
- query validation;
- versioned events/listeners;
- stable Arc error codes;
- `inspect` and `validate` CLI;
- capability usage enforcement (`ARC1005`).

## v0.3 — runtime/resource/agent vertical slice

### Runtime architecture

- extracted generic `@arc/runtime-web` execution engine;
- `@arc/runtime-memory` reduced to a reference wrapper;
- added `@arc/runtime-cloudflare`;
- Cloudflare runtime accepts platform providers per request from `env`;
- introduced `withProviders()` so portable application definitions are separate from environment composition;
- same application definition now runs with local resource implementations and a Cloudflare composition.

### Resource capabilities

Object Storage:

- `@arc/storage` contract;
- streaming object bodies;
- metadata and provider-native escape hatch;
- `@arc/storage-memory`;
- `@arc/storage-r2` using the documented R2 Workers API shape;
- one contract probe executed against both implementations.

Queue producer:

- `@arc/queue` contract;
- feature requirements (`batch`, `delay`);
- provider compatibility validation;
- `@arc/queue-memory`;
- `@arc/queue-cloudflare`;
- Cloudflare delay range validation;
- one producer contract probe executed against both implementations.

### Application Graph integrity

- graph schema now has explicit `schemaVersion: 1`;
- resource metadata appears in capabilities (`resourceType`, `features`);
- capability names must be globally unambiguous (`ARC1006`);
- endpoints/listeners declare emitted events;
- undeclared event emission fails (`ARC1007`);
- graph now includes event producers as well as consumers.

### Agent / developer tooling

- `arc explain ARCxxxx`;
- `arc context <app> <module>`;
- semantic `arc diff <before> <after>`;
- deterministic JSON output retained for all machine-oriented commands.

### Reproducibility

- internal workspace dependencies changed to local `file:` references;
- clean `npm install --offline` verified;
- strict TypeScript build verified;
- 33 automated tests passing at the end of this phase.

## Known unverified boundary

Real `workerd` execution is **not yet verified** because the build environment cannot resolve npm registry DNS and therefore cannot install Wrangler / `@cloudflare/vitest-plugin`.

The adapter is tested structurally using the documented Worker `fetch(request, env, ctx)`, R2 and Queue binding interfaces. This is not represented as equivalent to a real workerd integration test.


## v0.4 — distributed jobs, execution surfaces and semantic tracing

### Jobs

- `job()` is now a first-class Application Model primitive;
- Standard-Schema-compatible job input validation;
- stable job name/version identity;
- explicit queue transport;
- producer `dispatches`;
- undeclared dispatch blocked by `ARC1009`;
- duplicate job name/version blocked by `ARC1008`;
- Application Graph bumped to schema v2;
- graph/CLI context/diff include jobs;
- logical job envelope v1;
- memory job consumer;
- Cloudflare Queue consumer adapter;
- explicit per-message ack/retry;
- fixed/exponential retry delay;
- poison-message discard;
- `NonRetryableJobError`;
- example DLQ configuration.

### Execution-surface isolation

- provider validation is now scoped to the active endpoint/listener/job at runtime;
- HTTP workers no longer need queue-consumer-only capabilities;
- queue consumers no longer need unrelated HTTP/storage capabilities;
- this enables smaller bindings and future least-privilege deployment plans.

### Invocation-scoped async providers

- Cloudflare HTTP and queue adapters await async provider factories per invocation;
- this unblocks correct Hyperdrive/node-postgres lifecycle (new client inside each handler invocation).

### Observability

- `@arc/telemetry`;
- recording/no-op tracers;
- semantic spans for endpoints/listeners/jobs;
- `@arc/telemetry-cloudflare` mapping to native Workers custom spans;
- example enables Workers logs/traces.

### Verification

- 43/43 automated tests pass;
- strict TypeScript build passes;
- clean offline install remains supported;
- workerd/real PostgreSQL gates remain blocked by npm DNS in this environment.
