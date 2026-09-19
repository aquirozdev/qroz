# Architecture

## 1. Product model

Arc is designed around one semantic application definition and multiple runtime/resource compositions.

```text
portable application definition
        │
        ├─ modules
        │   ├─ endpoints
        │   ├─ listeners
        │   └─ jobs
        │
        └─ declared architectural effects
            ├─ requires capabilities
            ├─ emits events
            └─ dispatches jobs

runtime composition
        ├─ static providers
        └─ request/platform providers
```

The portable definition is intentionally different from deployment configuration.

## 2. Definitions are data

`endpoint()`, `module()`, `event()`, `listener()`, `capability()`, resource helpers and `app()` return explicit objects. No decorator registration or runtime reflection is required.

This enables:

- deterministic runtime inspection today;
- graph tooling without TypeScript AST parsing;
- future static compilation after semantics are proven.

## 3. Build validation

`buildApplication()` validates structural and dependency invariants:

- unique module names;
- unique HTTP method/path pairs;
- one provider per capability token in a composition;
- every required capability has a provider unless an execution adapter explicitly defers validation to the active surface;
- a semantic capability name cannot identify multiple tokens;
- unique job `name@version` pairs;
- declared job transports are part of the graph.

Runtime adapters validate global structure first and then validate providers for the **active execution surface** (HTTP endpoint, event listener, or job). This permits a Worker HTTP entrypoint and a Queue consumer to receive independent least-privilege provider sets.

## 4. Capability model

Application code depends on typed semantic tokens:

```ts
const storage = capability<Storage>("storage.files", {
  kind: "resource",
  resourceType: "object-storage"
})
```

Handlers declare them:

```ts
requires: [storage]
```

and resolve them:

```ts
ctx.use(storage)
```

Using a capability that is not in `requires` fails at runtime (`ARC1005`). The graph is therefore an enforced architecture contract, not informal metadata.

### Static and runtime composition

Static/local:

```ts
withProviders(application, [
  provide(storage, createMemoryStorage())
])
```

Cloudflare:

```ts
createCloudflareWorker(application, {
  providers(env) {
    return [provide(storage, createR2Storage(env.FILES))]
  }
})
```

This is how bindings remain outside domain code.

## 5. Resource capabilities

A resource capability adds semantic metadata to the same token system.

Current resource types:

- `object-storage`;
- `message-queue` producer.

The Application Graph records resource type and required/common features. Provider adapters preserve a `native()` escape hatch where necessary.

### No fake portability

Queue capabilities may require provider features such as delay. `provideQueue()` validates those requirements instead of pretending every queue is equivalent.

Future resource abstractions must be tested against at least two implementations before stabilization.

## 6. Events, jobs and effect integrity

Events are versioned definitions. Endpoints/listeners declare what they may emit:

```ts
emits: [UserCreated]
```

`ctx.events.emit(UserCreated, payload)` is rejected with `ARC1007` if the producer did not declare it.

Listeners declare consumed event and capabilities. The graph therefore knows producers and consumers.

Events and jobs remain distinct concepts:

- event: something happened;
- job: work must be performed;
- queue: a transport/resource used by the current job implementation, not the job semantics themselves.

Jobs are typed/versioned definitions with an input schema, declared capabilities, retry policy and transport. Producers must declare `dispatches: [Job]`; undeclared dispatch fails with `ARC1009`. Job envelopes carry a stable logical message schema and optional idempotency key metadata. Durable idempotency is intentionally **not** claimed until a durable store enforces it.

The memory runner and Cloudflare Queue consumer share the same job executor. Invalid/unknown/non-retryable messages are poison-safe; retryable failures produce explicit retry outcomes. Cloudflare maps those outcomes to per-message `ack()` / `retry()`.

## 7. Runtime architecture

```text
@arc/core
    │
    ▼
@arc/runtime-web
    │
    ├─ @arc/runtime-memory
    └─ @arc/runtime-cloudflare
```

`runtime-web` owns portable HTTP execution: routing, validation, capability resolution, event delivery and error conversion.

Platform adapters own platform context/provider wiring and may provide native bridges such as Cloudflare tracing. Provider factories may be asynchronous per invocation, which is required for integrations such as Hyperdrive + `pg` that must create clients inside the request/consumer invocation.

The portable interface is Web Standards based:

```ts
interface ArcRuntime<Context> {
  fetch(request: Request, context?: Context): Promise<Response>
}
```

## 8. Validation

Arc consumes the Standard Schema contract rather than owning a validation language. The example contains a tiny local implementation because external npm access was unavailable; production integrations should work with Standard-Schema-compatible libraries such as Zod/Valibot/ArkType.

Current validation points:

- route params;
- query;
- JSON body;
- output.

Invalid client input returns 400. Invalid handler output is an internal contract violation (`ARC2002`) and returns 500.

## 9. Application Graph v2

The graph currently contains:

- schema version;
- application name;
- all referenced/configured capabilities;
- whether capabilities are statically configured;
- resource type/features;
- modules;
- endpoint method/path/status;
- endpoint schemas presence;
- required capabilities;
- emitted events;
- dispatched jobs;
- job definitions, versions, transports, retry metadata and required capabilities;
- listeners and consumed/emitted events.

Consumers already include:

- `arc inspect`;
- `arc context`;
- `arc diff`;
- tests.

Future consumers:

- MCP;
- LSP;
- deployment planner;
- IAM/binding generation;
- Dev Console;
- breaking-change analyzer.


## 10. Observability contract

Arc defines a minimal semantic tracing interface rather than shipping its own telemetry backend. Portable execution creates spans for endpoints, listeners and jobs and attaches Arc/application metadata.

Cloudflare adapts this interface to native Workers custom spans (`ctx.tracing`). This preserves automatic platform instrumentation and OTLP export while allowing Arc to name and annotate framework semantics.

Cross-process W3C trace-context propagation through job envelopes is a future gate; it is not implied by the current local span API.

## 11. Error model

Framework invariants use stable error codes. `arc explain ARCxxxx` exposes remediation to humans, CI and agents.

Long term errors should also include:

- source location;
- docs link/version;
- structured suggested changes;
- related graph nodes.

## 12. Progressive distribution

Arc begins as a modular monolith. Service boundaries are deployment decisions, not prerequisites for organizing business logic.

Future Cloudflare decomposition can use Service Bindings; AWS may use Lambda/service infrastructure. The domain should not be rewritten around those protocols.
