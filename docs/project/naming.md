---
title: Naming decision
description: Final public identity and naming conventions for Qroz.
---

# Naming decision

## Decision

**Qroz is the definitive public product identity.**

The earlier Arc codename and Ceryva exploration are retired. The repository owner has explicitly selected Qroz and accepts the previously documented collision/search-discovery tradeoffs.

## Canonical names

- product: **Qroz**
- repository: `aquirozdev/qroz`
- CLI: `qroz`
- npm scope: `@qroz/*`
- scaffold package: `create-qroz`
- Studio: **Qroz Studio**
- stable framework error prefix: `QROZxxxx`
- internal Studio/dev namespace: `/__qroz/*`

## Consistency rule

New public APIs, documentation, examples, automation, agent integrations and diagnostics must use Qroz naming. Arc/Ceryva identifiers are not a supported second naming surface.

Because the project remains pre-1.0 and has not established a stable public compatibility contract, remaining legacy identifiers should be migrated rather than preserved indefinitely as aliases.

## Publication checks that remain separate

Choosing the product name does not by itself prove registry or legal availability. Before public package publication, verify:

1. ownership/availability of the intended npm scope and package names;
2. trusted-publisher configuration for each public package;
3. selected domains and documentation URLs;
4. trademark/legal review appropriate to the intended markets;
5. package metadata, license and release provenance.

Those are release-readiness checks, not reasons to keep the product identity undecided.
