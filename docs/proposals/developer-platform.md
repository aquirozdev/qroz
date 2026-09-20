---
title: Proposal — developer platform
description: Planned preview environments, Dev Console, LSP and semantic PR experience.
---

# Proposal — developer platform

Status: **planned**.

## Semantic pull-request experience

Instead of only source-line changes:

```text
HTTP
+ POST /users/:id/suspend

Permissions
+ users.suspend

Events
+ user.suspended@1

Consumers
+ notifications.user-suspended

Infrastructure
+ queue audit
```

## Preview environments

A future integration should map a PR's deployment plan into an isolated environment, run integration tests and attach semantic changes/results to review.

## Dev Console

The local/preview console should organize the application by semantic concepts:

- requests;
- events;
- jobs;
- workflows;
- database;
- storage/cache;
- traces/logs;
- agents;
- architecture graph.

It should consume framework telemetry/graph APIs rather than instrumenting an independent shadow model.

## LSP

Potential language-server features:

- route navigation;
- event producer → consumer navigation;
- job producer → handler navigation;
- capability usage;
- undeclared-effect diagnostics;
- graph context for editors/agents.

LSP, MCP, CLI and Dev Console should share semantic services.
