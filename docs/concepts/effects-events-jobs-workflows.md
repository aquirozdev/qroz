---
title: Events, jobs and workflows
description: The semantic differences between facts, asynchronous commands, transports and durable processes.
---

# Events, jobs and workflows

Arc keeps these concepts distinct because they answer different questions.

## Event

An event says **something happened**.

```ts
const UserCreated = event({
  name: "user.created",
  version: 1,
  schema: UserCreatedSchema
})
```

Events may have zero or many listeners. They are versioned because old producers/consumers may coexist during deployments.

## Job

A job says **perform this work**.

```ts
const SendWelcomeEmail = job({
  name: "email.send-welcome",
  version: 1,
  transport: emailQueue,
  input: SendWelcomeEmailInput,
  retry: { strategy: "exponential", attempts: 5 },
  idempotency: {
    store: jobIdempotency,
    key: input => `welcome:${input.userId}`
  },
  async handler(input, ctx) {
    // ...
  }
})
```

Jobs have explicit retry and idempotency semantics. Arc models delivery as at-least-once and does not promise exactly-once side effects.

## Queue

A queue is a transport resource. It is not the job itself. This distinction allows job semantics to remain portable while queue adapters map to Cloudflare Queues, SQS or future providers.

## Workflow

A workflow is a durable multi-step process that may wait, retry and compensate over long periods.

Planned examples:

```text
reserve inventory
→ charge payment
→ wait for fulfillment
→ create shipment
→ notify customer
```

Cloudflare Workflows, AWS Step Functions and Temporal are candidate adapters. Workflow semantics will not be stabilized until at least two implementations are exercised.

## Rule of thumb

- Event: fact.
- Job: asynchronous command.
- Queue: transport.
- Workflow: durable orchestration.
