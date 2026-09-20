---
title: Release and compatibility policy
description: Pre-1.0 release lifecycle, compatibility expectations and migration rules.
---

# Release and compatibility policy

## Status

This policy applies to the planned public beta. It becomes enforceable for users once the first packages are published under the final project identity.

## Release channels

Arc's final public identity should use three channels:

- **alpha** — architectural experiments; APIs may change quickly;
- **beta** — intended for real applications and developer feedback; breaking changes are allowed but deliberate, documented and migration-noted;
- **stable** — reserved for 1.0+ compatibility commitments.

The first public registry release should be a beta, not a misleading stable 0.x release.

## Versioning

Published packages in the core distribution should move together on one release version unless a package is explicitly documented as independently versioned.

Every release must have:

- one source commit;
- one release version;
- one changelog/release note set;
- one Git tag;
- matching package versions;
- a GitHub Release;
- registry provenance.

## Pre-1.0 compatibility

Before 1.0:

- breaking public API changes are permitted;
- accidental breaking changes are bugs;
- breaking changes require changelog entries and migration guidance;
- Application Graph schema changes require an explicit schema version bump;
- serialized envelopes/protocol contracts require compatibility notes;
- provider behavior changes require support-matrix updates.

## What counts as public API

Public API includes:

- exported package symbols;
- CLI commands, flags, exit behavior and JSON contracts;
- Application Graph schemas;
- job/event/workflow serialized envelopes;
- stable Arc error codes;
- documented provider adapter behavior;
- generated deployment/change-plan schemas;
- documented MCP/tool contracts.

Internal file layout is not public API unless documented otherwise.

## Deprecation

During beta, prefer at least one release of overlap when doing so is inexpensive and does not preserve a harmful design.

For 1.0, define a stronger deprecation window before release.

## Experimental features

Experimental features must be visibly labeled in docs and may evolve faster than the beta core.

A feature may graduate only after:

- outside-in acceptance coverage;
- relevant portability/provider evidence;
- failure-path coverage;
- documentation;
- compatibility decision.

## Release verification

The canonical release workflow should verify:

1. clean checkout;
2. deterministic install;
3. build/typecheck/tests/docs;
4. visual evidence journeys where applicable;
5. package readiness audit;
6. package tarball contents;
7. clean consumer install from tarballs;
8. CLI/scaffold smoke;
9. provenance-enabled publication;
10. post-publish installation smoke from the registry.

A release is incomplete until the published artifacts themselves have been installed and exercised.
