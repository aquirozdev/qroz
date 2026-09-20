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

## Future package release requirements

Before broadly publishing `@qroz/*` packages:

- consistent workspace package versioning;
- release-note/changeset automation;
- npm trusted publishing through OIDC where repository/publication constraints permit it;
- package provenance strategy;
- public API surface verification;
- generated API/reference strategy;
- compatibility/deprecation policy;
- canary prereleases;
- upgrade tests against a reference application.

### Provenance note

npm trusted publishing can automatically generate provenance for supported GitHub/GitLab CI publishing, but npm currently documents that provenance is not generated from **private repositories**. Qroz must therefore revisit repository visibility/release provenance before treating public package publishing as production-ready.

No long-lived npm automation token should be introduced merely to make early releases easier.
