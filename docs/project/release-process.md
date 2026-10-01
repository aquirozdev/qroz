---
title: Release process
description: Evidence-driven release workflow for Qroz research releases and future packages.
---

# Release process

Qroz is pre-1.0. Releases communicate research milestones, not compatibility guarantees.

## Current branch flow

1. create focused feature/docs branch;
2. update examples/tests first for behavior changes;
3. run local `npm run verify`;
4. open PR;
5. run platform integration gates in GitHub Actions;
6. update canonical documentation/ADR/changelog;
7. merge only after relevant gates are green.

## Release evidence

A changelog entry should separate:

- added behavior;
- changed architecture;
- verified integrations;
- known limits;
- migration/breaking notes.

## Public beta package release requirements

The repository now carries the beta publication workflow. Before the first registry publication:

- keep every public package on the canonical prerelease line;
- release-note/changeset automation;
- configure npm trusted publishers for every public package; GitHub Actions already uses OIDC with `id-token: write`;
- preserve npm provenance for every publication;
- public API surface verification;
- generated API/reference strategy;
- compatibility/deprecation policy;
- canary prereleases;
- upgrade tests against a reference application.

### Canonical beta path

1. merge a fully green release candidate;
2. ensure `npm run release:verify` passes;
3. create a tag matching the root version, for example `v0.12.0-beta.1`;
4. let the release workflow verify the tag/version match;
5. publish public packages with npm trusted publishing/OIDC, provenance and the `beta` dist-tag;
6. create release notes/GitHub Release from the same versioned commit;
7. run post-publish install/scaffold smoke evidence before announcing the beta.

No long-lived npm automation token should be introduced. The repository license is fixed as Apache-2.0 and enforced by `npm run release:check`. npm trusted-publisher configuration remains an explicit registry setup gate, not a value inferred by automation.
