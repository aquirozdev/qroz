# Observability strategy

Arc does not own a proprietary tracing backend.

## Portable layer

`@arc/telemetry` defines a tiny `ArcTracer` contract and a recording tracer for tests/local tools.

Semantic spans currently include:

- `arc.endpoint` with app/module/endpoint/method/route attributes;
- `arc.listener` with app/module/listener/event/version attributes;
- `arc.job` with app/module/job/version/attempt attributes.

## Cloudflare

`@arc/telemetry-cloudflare` bridges Arc spans to Workers custom spans through `ExecutionContext.tracing`. Cloudflare continues to instrument fetches and bindings itself, so Arc does not duplicate those spans.

`examples/hello-world/wrangler.jsonc` enables logs and traces.

## Open items

- W3C trace-context propagation in job envelopes and outbound adapters;
- redaction policy for attributes/logs;
- deployment/version identifiers;
- standardized error/status attributes;
- local trace viewer / Dev Console integration;
- second runtime adapter validating the portable tracer abstraction.
