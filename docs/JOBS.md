# Jobs and asynchronous execution

## User-facing model

```ts
export const DeliverNotification = job({
  name: "notifications.deliver",
  version: 1,
  transport: notificationJobsQueue,
  input: NotificationBody,
  requires: [notificationDeliverySink],
  retry: { strategy: "exponential", delaySeconds: 5, maxDelaySeconds: 60 },
  idempotencyKey(input) {
    return `notification:${input.message}`
  },
  async handler(input, ctx) {
    await ctx.use(notificationDeliverySink).deliver(input.message)
  }
})
```

A producer must declare the effect:

```ts
endpoint({
  method: "POST",
  path: "/notification-jobs",
  dispatches: [DeliverNotification],
  async handler(ctx) {
    const id = await ctx.jobs.dispatch(DeliverNotification, ctx.input.body)
    return { id }
  }
})
```

Undeclared dispatch fails with `ARC1009`.

## Envelope

Arc currently emits a versioned logical envelope:

```ts
{
  kind: "arc.job-message",
  schemaVersion: 1,
  id,
  job,
  version,
  payload,
  createdAt,
  idempotencyKey?
}
```

The logical Arc message id is distinct from a provider message id.

## Consumer behavior

`@arc/jobs` validates the envelope and payload, finds the exact `name@version` job definition and executes only that job's declared capabilities.

Outcomes:

- `ack` — successful handler;
- `retry` — retryable failure, optionally with fixed/exponential delay;
- `discard` — malformed envelope, unknown job/version, invalid payload or explicit `NonRetryableJobError`.

The Cloudflare adapter uses per-message `ack()` / `retry()` so one failed message does not force successful messages in the same batch to be delivered again.

## Delivery guarantee

Arc jobs are designed for at-least-once transports. Handlers must be safe under redelivery.

The current `idempotencyKey` is metadata carried in the envelope and exposed to the handler. **Durable idempotency enforcement is not implemented yet.** The next design step is a lease/claim store with explicit expiry semantics and multiple adapters; Arc will not claim exactly-once execution.

## DLQ

DLQ and maximum retry counts are currently provider/deployment configuration. The Cloudflare example configures a DLQ in `wrangler.jsonc`. The framework will later expose this through a deployment manifest once Cloudflare + SQS semantics have been compared.
