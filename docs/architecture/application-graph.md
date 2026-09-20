---
title: Application Graph architecture
description: Purpose, boundaries, consumers, and evolution rules for Arc's semantic graph.
---

# Application Graph architecture

The Application Graph is Arc's machine-readable description of application structure.

It currently represents:

- application and modules;
- HTTP endpoints;
- capability dependencies;
- resource metadata/features;
- event definitions, producers and listeners;
- job definitions, transports, retry and idempotency metadata;
- declared job producers;
- endpoint authentication and permission requirements.

## What it is not

The graph is not:

- a runtime call graph;
- a distributed trace;
- an infrastructure plan;
- an AST dump;
- a vendor resource manifest.

Those artifacts may be **derived** from it.

## Integrity

Graph metadata is useful only if application code cannot bypass it. Arc therefore enforces declared `requires`, `emits` and `dispatches`.

## Schema evolution

The graph has an explicit schema version. Breaking schema changes require:

1. changelog entry;
2. compatibility note;
3. CLI/MCP consumer updates;
4. fixture/snapshot update;
5. migration strategy once third-party consumers exist.

## Long-term consumers

- `arc inspect`;
- `arc context`;
- `arc diff`;
- MCP;
- generated docs;
- LSP navigation;
- security/permission analysis;
- deployment planner;
- preview environment planner;
- Dev Console.
