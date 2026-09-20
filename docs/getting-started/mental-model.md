---
title: Mental model
description: The minimum set of ideas needed to reason about Arc.
---

# Mental model

Arc separates **what the application means** from **where it runs**.

## 1. The application defines intent

Domain/application code declares modules, endpoints, events, jobs and required capabilities.

```text
application
├── modules
├── endpoints
├── events
├── jobs
└── declared dependencies/effects
```

It should not need to know whether storage is R2 or S3, whether a queue is Cloudflare Queues or SQS, or whether HTTP is running in Workers, Lambda, Bun or Node.

## 2. Capabilities describe needs

A capability is a typed semantic token such as:

```text
database.users
storage.avatars
queue.notifications
mail.transactional
```

The application declares what it needs. A provider supplies an implementation at composition time.

## 3. Execution surfaces are isolated

An HTTP worker, queue consumer and workflow runner are different execution surfaces. Each receives only the providers it needs.

This enables least-privilege bindings/IAM and avoids loading unrelated infrastructure.

## 4. The Application Graph is a product artifact

Arc turns explicit declarations into a deterministic graph describing routes, capabilities, events, jobs and their relationships.

The graph is intended to power:

- CLI and IDE tooling;
- MCP and coding agents;
- documentation;
- semantic pull-request diffs;
- deployment planning;
- permission generation;
- observability navigation.

## 5. Distributed behavior is explicit

Arc does not hide important distributed-system properties. Retry, idempotency, versioning, timeouts, consistency and provider feature gaps must be visible in APIs and graph metadata.

## 6. Portability is proven, not claimed

A portable abstraction requires multiple implementations and contract tests. Provider-native escape hatches stay available when the common model is insufficient.
