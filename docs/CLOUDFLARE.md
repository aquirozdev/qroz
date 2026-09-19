# Cloudflare runtime plan and current implementation

## Why Cloudflare is the first external runtime

It stresses Arc's portability claim early: Workers exposes Web Standard APIs while resource access arrives through bindings rather than conventional process-global clients.

Current Cloudflare documentation states that local Worker execution uses Miniflare backed by `workerd`, the same runtime family used in production. Cloudflare recommends Wrangler or the Vite plugin for most projects; direct Miniflare use is an advanced path.

Arc therefore does **not** embed or wrap Miniflare. `@arc/runtime-cloudflare` and provider packages adapt Arc to Worker contracts; Cloudflare tooling owns simulation/build/deployment.

## Current combined Worker

The example exports both HTTP and queue entrypoints:

```ts
export default {
  fetch: httpWorker.fetch,
  queue: jobsConsumer.queue
}
```

HTTP composition obtains R2/Queue producer bindings from `env`; the queue consumer composes only the providers needed by jobs. Domain modules never receive raw Cloudflare binding types.

## Execution-surface providers

A key v0.4 change is that provider validation occurs for the active surface. An HTTP request does not need providers used only by a job consumer, and a queue consumer does not need unrelated HTTP capabilities.

Provider factories may also be asynchronous:

```ts
createCloudflareWorker(application, {
  async providers(env) {
    // create invocation-scoped resources here
    return [/* providers */]
  }
})
```

This is required for the planned Hyperdrive + `pg` integration, where Cloudflare guidance requires clients to be created inside the invocation.

## Jobs and Queues

The example now has:

- Queue producer binding for ordinary application messages;
- Queue producer binding for Arc job envelopes;
- consumer configuration with batch settings, retry budget and a DLQ;
- a consumer adapter using per-message `ack()` / `retry()`.

Arc treats Cloudflare Queue as a transport implementation. The job definition owns schema/version/handler/retry semantics.

## Observability

Workers already provides automatic spans for requests/bindings and supports native custom spans plus OTLP export. Arc therefore supplies a semantic tracing bridge rather than embedding a separate tracing backend.

Current Arc spans include endpoint/listener/job names and application metadata. Cross-process W3C trace-context propagation through job envelopes is still pending.

## Local config

`examples/hello-world/wrangler.jsonc` defines:

- Worker entrypoint;
- compatibility date;
- observability logs/traces;
- R2 binding `FILES`;
- Queue producer bindings;
- job Queue consumer and DLQ.

## Pending real-runtime gate

The current environment returns npm `EAI_AGAIN`, so Wrangler and `@cloudflare/vitest-plugin` cannot be installed. Real workerd tests remain pending and are explicitly not counted as passed.

The required gate is documented in `QUALITY-GATES.md`.

## Future service decomposition

Cloudflare Service Bindings allow one Worker to call another without exposing a public URL and support HTTP/RPC patterns. Arc should keep a modular-monolith default and let a future deployment planner introduce service isolation from the Application Graph when justified.

Sources reviewed September 2026:

- https://developers.cloudflare.com/workers/local-development/
- https://developers.cloudflare.com/workers/runtime-apis/bindings/
- https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/
- https://developers.cloudflare.com/queues/configuration/javascript-apis/
- https://developers.cloudflare.com/queues/configuration/batching-retries/
- https://developers.cloudflare.com/queues/configuration/dead-letter-queues/
- https://developers.cloudflare.com/workers/observability/traces/custom-spans/
- https://developers.cloudflare.com/workers/observability/exporting-opentelemetry-data/
- https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/node-postgres/
