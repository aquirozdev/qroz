---
title: Proposal — durable workflows
description: Planned portable model for long-running multi-step orchestration.
---

# Proposal — durable workflows

Status: **experimental application model implemented; provider execution not yet verified**.

## Goal

Represent long-running processes separately from jobs.

Current experimental shape:

```ts
export const Purchase = workflow({
  name: "purchase",
  version: 1,
  input: PurchaseInput,
  start: "reserve",
  states: {
    reserve: workflowTask({ next: "settle", handler: reserveInventory }),
    settle: workflowSleep(60, "charge"),
    charge: workflowTask({
      retry: { maxAttempts: 3, strategy: "exponential", delaySeconds: 2 },
      next: "done",
      handler: chargePayment
    }),
    done: workflowSucceed()
  }
})
```

The graph is intentionally declarative. Arc does not treat arbitrary JavaScript branching as portable workflow control flow.

## Implemented research semantics

- versioned workflow definitions in the Application Model;
- explicit task, sleep and succeed states;
- build-time transition validation;
- workflow task capabilities and operation-level access;
- deterministic memory execution;
- explicit total-attempt retry semantics;
- workflow execution surfaces in deployment planning;
- Application Graph representation;
- AWS Step Functions definition compilation for the supported subset;
- Cloudflare Workflows step plan for the supported subset.

## Still required

- real durable provider execution gates;
- cancellation;
- compensation/sagas;
- portable serializable choices/branching;
- child workflows;
- signal/event inputs;
- versioning and migration of running workflow instances;
- replay/determinism rules;
- trace propagation and operator controls.

## Candidate engines

- Cloudflare Workflows;
- AWS Step Functions;
- Temporal.

The current API remains experimental. Memory execution plus two provider plans are architectural evidence, not proof of durable execution equivalence. Stabilization still requires real execution against at least two workflow engines.
