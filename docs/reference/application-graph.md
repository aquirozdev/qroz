---
title: Application Graph reference
description: Compatibility rules and semantic fields for Arc's machine-readable application graph.
---

# Application Graph reference

The Application Graph is versioned independently from package versions.

Current graph lineage has evolved as features were added:

- schema v1: modules/endpoints/resources/events;
- schema v2: jobs and dispatch relationships;
- schema v3: durable idempotency metadata;
- schema v4: operation-level resource access;
- schema v5: endpoint principal/permission authorization metadata;
- schema v6: named contextual authorization policies;
- schema v7: workflow definitions, states, transitions and task dependencies.

Consumers must inspect `schemaVersion` rather than assume fields by Arc package version.

## Compatibility rules

Before 1.0, Arc may introduce breaking graph changes, but every breaking change must be documented in CHANGELOG and reflected in fixtures/tests.

Once external graph consumers are encouraged, Arc should provide:

- JSON Schema;
- compatibility policy;
- deprecation window;
- graph migration helpers if necessary.

## Intended machine consumers

Graph fields should be JSON-safe, deterministic and based on semantic identifiers instead of runtime object identities.
