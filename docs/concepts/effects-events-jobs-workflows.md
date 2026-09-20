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

A workflow is a durable multi-step process whose orchestration must be inspectable independently from task implementation.

Arc currently models an experimental portable subset: task states, durable sleeps, explicit transitions, terminal success, task capability requirements and bounded retry policies. A deterministic memory executor proves application semantics; AWS Step Functions and Cloudflare Workflows planners prove that this subset can be represented without hiding provider differences.

Compensation, portable choices, signals, cancellation and running-instance version migration remain research areas. Workflow semantics will not be stabilized until real durable execution is exercised against at least two engines.

## Rule of thumb

- Event: fact.
- Job: asynchronous command.
- Queue: transport.
- Workflow: durable orchestration.
