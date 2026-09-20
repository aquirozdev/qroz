---
title: Proposal — durable workflows
description: Planned portable model for long-running multi-step orchestration.
---

# Proposal — durable workflows

Status: **planned**.

## Goal

Represent long-running processes separately from jobs.

Desired conceptual shape:

```ts
export const Purchase = workflow({
  input: PurchaseInput,
  steps: {
    reserveInventory,
    chargePayment,
    createShipment
  },
  compensate: {
    chargePayment: refundPayment,
    reserveInventory: releaseInventory
  }
})
```

## Required semantics to investigate

- durable step completion;
- retry and backoff;
- timers/sleeps;
- cancellation;
- compensation/sagas;
- child workflows;
- signal/event inputs;
- versioning of running workflow instances;
- exactly what determinism/replay constraints each provider imposes;
- traceability and operator controls.

## Candidate engines

- Cloudflare Workflows;
- AWS Step Functions;
- Temporal.

No portable API should stabilize from one engine. The first goal is to identify the semantic intersection and explicit feature extensions, not to hide meaningful differences.
