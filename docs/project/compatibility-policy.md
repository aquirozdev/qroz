---
title: Compatibility policy
description: Pre-1.0 compatibility expectations for Qroz APIs, graph schemas, envelopes, packages, and integrations.
---

# Compatibility policy

Qroz is currently pre-1.0 research software. Breaking changes are allowed, but must be intentional and documented.

## Public TypeScript API

Before 1.0:

- signatures may change;
- packages may be renamed/split;
- migration notes are required for material changes once external users exist;
- experimental APIs should be labeled instead of silently treated as stable.

## Application Graph

The graph has its own `schemaVersion`. Consumers must key compatibility on graph schema, not package version.

Breaking graph changes require fixture updates, changelog notes and consumer updates.

## Job envelopes

Queued messages can outlive a deployment. Job name/version and envelope schema must therefore evolve more conservatively than ordinary internal code.

Qroz must not remove support for an old job version while messages of that version can still exist without an explicit migration/drain strategy.

## Platform adapters

Support has levels:

1. structural/contract adapter;
2. official-runtime integration verified;
3. real cloud integration verified;
4. production reference workload verified.

Documentation must state the level instead of using a single ambiguous “supported” label.

## Deprecation

A formal deprecation window will be defined before 1.0/public package adoption. Until then, changelog + migration notes are required for known users and reference applications.
