# ADR 0009 — Jobs are Application Model primitives

Status: accepted in v0.4.

## Context

Arc already modeled HTTP endpoints, capabilities and events semantically. Treating jobs as a queue helper would make the Application Graph blind to asynchronous work and would prevent reliable semantic diff, agent context, deployment planning and least-privilege resource derivation.

Cloudflare Queues exposes delivery attempts, per-message ack/retry, delayed retries and DLQ configuration. The platform is at-least-once, so job handlers must assume redelivery.

## Decision

`job()` is a first-class core definition with:

- stable semantic name and version;
- Standard-Schema-compatible input contract;
- explicit transport capability;
- explicit handler capabilities;
- retry-delay policy;
- optional logical deduplication/idempotency key metadata.

Endpoints/listeners must declare `dispatches`. Runtime dispatch that is not declared fails with `ARC1009`.

The Application Graph schema is bumped to v2 and includes job definitions and producers.

## Consequences

- async work is statically discoverable;
- producers and consumers can be deployed independently;
- Cloudflare and future SQS adapters can share the application-level job definition;
- a generated idempotency key does **not yet** mean exactly-once execution. Durable idempotency enforcement remains a separate phase.
