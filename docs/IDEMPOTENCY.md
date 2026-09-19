# Durable job idempotency

Arc treats queue delivery as **at-least-once**. A queue message can be delivered more than once, so jobs that cause external side effects need an explicit deduplication strategy.

## Public model

```ts
const store = idempotencyStore("jobs.notifications.idempotency")

const DeliverNotification = job({
  name: "notifications.deliver",
  version: 1,
  transport: jobsQueue,
  input: Notification,
  idempotency: {
    store,
    leaseSeconds: 30,
    ttlSeconds: 86_400,
    key: (input) => `notification:${input.message}`
  },
  async handler(input, ctx) {
    // side effect
  }
})
```

The key is calculated by the producer and carried in the logical job envelope. The consumer still knows how to derive it from the validated payload, which keeps old or manually-created envelopes recoverable.

## State machine

```text
missing
  │ claim(key, lease)
  ▼
processing(token, lease expiry)
  ├─ handler succeeds ──> complete(token, ttl) ──> completed
  └─ handler fails ─────> release(token) ────────> missing

processing + duplicate delivery -> retry after remaining lease
completed  + duplicate delivery -> ack without executing handler
expired processing lease         -> a new consumer may claim
expired completed TTL            -> key becomes claimable again
```

A lease avoids a permanent lock if a worker crashes after claiming. Completion TTL bounds retained deduplication state. Jobs that can run longer than their lease will eventually need a heartbeat/lease-extension API; Arc does not pretend this is solved yet.

## Contracts

`JobIdempotencyStore` requires three atomic operations:

- `claim(key, { leaseSeconds })`
- `complete(key, token, { ttlSeconds? })`
- `release(key, token)`

A store must reject stale tokens. `claim` is the key atomic primitive: only one active lease may exist at a time.

## Implementations

### Memory

`@arc/idempotency-memory` is deterministic and intended for tests/local execution. It is not process-durable.

### Cloudflare Durable Objects

`@arc/idempotency-cloudflare-do` contains a structural adapter and Durable Object storage-side logic. SQLite-backed Durable Objects are selected because Cloudflare documents their storage as transactional and strongly consistent. Arc intentionally does not use Workers KV as the strong deduplication primitive.

The adapter is contract-tested against the documented Durable Object shape. A real workerd/`cloudflare:workers` integration remains part of the Cloudflare quality gate.

## Guarantees

Arc does **not** claim exactly-once execution. The guarantee is:

> When backed by a correct atomic idempotency store, completed duplicate deliveries can be acknowledged without intentionally re-running the Arc job handler.

External APIs should still receive the same idempotency key when they support one (payments, email, etc.). That protects against failures occurring after the external side effect but before Arc persists completion.
