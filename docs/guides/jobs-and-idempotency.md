---
title: Jobs and idempotency
description: How to design reliable Qroz asynchronous work with retry, leases, duplicates, and external side effects.
---

# Jobs and idempotency

Qroz assumes asynchronous delivery can happen more than once.

## Define a stable job identity

Use a semantic name and explicit version. Payload validation protects consumers from malformed messages, while versioning allows evolution.

## Configure retry deliberately

Retry is part of job semantics. Use fixed or exponential policies based on the operation and provider limits.

## Use durable idempotency for non-trivial side effects

Qroz's durable contract uses:

```text
claim(key, lease)
→ execute
→ complete(key, token)
```

If execution fails, the claim can be released/retried. If another worker observes an active lease, it retries later. A completed key suppresses duplicate execution.

## The external-side-effect rule

Qroz can prevent duplicate handler execution within its idempotency boundary, but cannot magically make an external API exactly-once. Reuse the same idempotency key with providers such as payment/email APIs when they support it.

## Long-running jobs

Lease extension/heartbeat is a planned requirement before Qroz calls very long-running jobs production-ready.

## Schema evolution

Queued messages may outlive a deployment. Old job versions therefore remain a migration concern; deleting a job version without considering queued envelopes is unsafe.
