---
title: Execution surfaces
description: How Arc isolates HTTP, jobs, listeners and future workflow execution for least privilege.
---

# Execution surfaces

A serverless application is not one process with one universal dependency container. Arc models independent execution surfaces.

Current surfaces include:

- HTTP endpoint invocation;
- event listener invocation;
- job consumer invocation.

Future surfaces include scheduler triggers and workflow steps.

## Why surface isolation matters

Suppose an application contains:

```text
HTTP endpoint requires:
  database.users
  queue.email

Email job requires:
  mail.transactional
```

The HTTP Worker should not receive mail credentials, and the queue consumer should not receive the users database unless it needs it.

Arc therefore validates required providers against the **active surface**, not the entire application.

## Benefits

- least-privilege IAM and bindings;
- smaller serverless bundles;
- clearer cold-start/resource ownership;
- independent scaling;
- safer extraction from modular monolith to distributed services;
- more truthful deployment planning.

The Application Graph provides the dependency information needed to derive these surfaces later.
