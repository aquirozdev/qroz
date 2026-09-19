# Research log — September 2026

This log records external facts that materially changed implementation decisions.

## Runtime interoperability

TC55 / WinterTC's Minimum Common Web API now defines a curated common Web Platform API surface for server runtimes. This reinforces Arc's decision to keep the portable execution boundary around `Request`, `Response`, URL, Headers, streams and related Web APIs instead of Node or vendor request types.

Source: https://min-common-api.proposal.wintertc.org/

## Cloudflare local execution

Cloudflare documents that Wrangler and the Cloudflare Vite plugin run local Workers through Miniflare using `workerd`, the same runtime base used in production. Miniflare v5 (September 2026) further positions higher-level tooling as the normal integration path.

Decision: Arc does not depend directly on Miniflare. It exposes a thin Worker adapter and lets Cloudflare's official tooling own simulation/build/deployment.

Sources:

- https://developers.cloudflare.com/workers/local-development/
- https://developers.cloudflare.com/workers/testing/miniflare/
- https://developers.cloudflare.com/changelog/post/2026-09-08-miniflare-v5/

## Cloudflare bindings

Bindings are Cloudflare's native mechanism for resources such as R2, D1, Hyperdrive, KV and Queues. Local simulations use the same binding API, and selected resources can use remote bindings during local development.

Decision: runtime providers must be able to derive Arc capabilities from per-invocation `env` bindings.

Sources:

- https://developers.cloudflare.com/workers/runtime-apis/bindings/
- https://developers.cloudflare.com/workers/local-development/bindings-per-env/

## R2

The Workers R2 API exposes `get`, `head`, `put` and delete operations; retrieved bodies are streams. This supported a portable Object Storage contract without buffering every object.

Source: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/

## Queues

Cloudflare Queues producer APIs expose `send` and `sendBatch`; per-message delays are supported up to 86400 seconds. Consumer configuration owns retries, retry delays and DLQ behavior.

Decision: v0.3 models only a producer resource. “Job” will be a higher-level primitive only after consumer/retry/idempotency semantics are designed end-to-end.

Sources:

- https://developers.cloudflare.com/queues/configuration/javascript-apis/
- https://developers.cloudflare.com/queues/configuration/batching-retries/
- https://developers.cloudflare.com/queues/configuration/dead-letter-queues/
- https://developers.cloudflare.com/queues/platform/limits/

## PostgreSQL / Hyperdrive

Hyperdrive supports PostgreSQL drivers and ORMs including Drizzle. Cloudflare currently recommends `pg` for JavaScript/TypeScript PostgreSQL connectivity through Hyperdrive.

Decision: first DB experiment is Drizzle + pg + PostgreSQL/Hyperdrive; no custom ORM.

Sources:

- https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/
- https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/drizzle-orm/

## Competitive architecture lesson retained from earlier research

Projects such as Encore demonstrate the value of a machine-readable application model; Hono demonstrates Web Standards portability; Laravel demonstrates high-productivity conventions; Effect demonstrates typed services/layers. Arc's differentiation remains the combination of explicit Application Graph + serverless portability + Laravel-like product ergonomics + agent-oriented tooling, rather than invention of every lower-level component.

## Queue consumer semantics and jobs

Cloudflare Queue consumers expose `MessageBatch`; individual messages include `id`, `body` and `attempts`, and can be explicitly `ack()`ed or `retry()`ed. Batch-level `ackAll()` / `retryAll()` also exist. If a consumer handler throws, the batch is retried except for messages already explicitly acknowledged. Dead-letter queues receive messages after the configured retry budget is exhausted.

Decision: Arc v0.4 maps a provider-neutral job outcome to per-message acknowledgement/retry. Unknown, malformed or explicitly non-retryable job messages are acknowledged as poison-safe failures rather than consuming the entire retry budget. Retryable failures use the job policy and provider adapter.

Sources:

- https://developers.cloudflare.com/queues/configuration/javascript-apis/
- https://developers.cloudflare.com/queues/configuration/batching-retries/
- https://developers.cloudflare.com/queues/configuration/dead-letter-queues/
- https://developers.cloudflare.com/queues/platform/limits/

## Database connection lifecycle

Cloudflare's Hyperdrive guidance for `node-postgres` requires creating database clients inside each Worker invocation rather than storing connected clients globally. Hyperdrive owns underlying pooling; Workers integrations do not need to call `client.end()` after every invocation.

Decision: Arc v0.4 added asynchronous invocation-scoped provider factories before implementing the PostgreSQL adapter. A future DB package must fit this lifecycle rather than forcing a global DI singleton.

Sources:

- https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/node-postgres/
- https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/

## Workers custom spans and OpenTelemetry export

Workers added native custom spans in 2026 through tracing APIs such as `ctx.tracing.enterSpan` / active spans. Workers already performs automatic platform instrumentation and can export logs/traces via OpenTelemetry/OTLP; metrics export has separate current limitations.

Decision: Arc does not embed an OpenTelemetry SDK/backend into every Worker. It defines a minimal semantic tracer and maps it onto the platform's native custom spans. Cross-process W3C trace-context propagation remains an explicit future task because external propagation/export has platform-specific caveats.

Sources:

- https://developers.cloudflare.com/workers/observability/traces/custom-spans/
- https://developers.cloudflare.com/workers/observability/traces/
- https://developers.cloudflare.com/workers/observability/exporting-opentelemetry-data/

## MCP 2026 direction

The official MCP TypeScript SDK v2 implements the 2026-07-28 protocol generation and provides Web-standard HTTP server integration suitable for serverless runtimes.

Decision: the first Arc MCP integration should be read-only and generated from Application Graph v2 (`inspect`, module context, semantic diff, error explanations). Arc should not hand-roll MCP framing and should not expose mutating deployment/database tools until an authorization/capability model is defined.

Sources:

- https://github.com/modelcontextprotocol/typescript-sdk
- https://github.com/modelcontextprotocol/typescript-sdk/tree/main/packages/server
