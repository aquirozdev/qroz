---
title: Release process
description: Proposed evidence-driven release workflow for Arc research releases and future packages.
---

# Release process

Arc is pre-1.0. Releases communicate research milestones, not compatibility guarantees.

## Current branch flow

1. create focused feature/docs branch;
2. update examples/tests first for behavior changes;
3. run local `npm run verify`;
4. open PR;
5. run platform integration gates in GitHub Actions;
6. update documentation/ADR/changelog;
7. merge only after relevant gates are green.

## Release evidence

A changelog entry should separate:

- added behavior;
- changed architecture;
- verified integrations;
- known limits;
- migration/breaking notes.

## Future package release requirements

Before publishing packages broadly:

- workspace package versions managed consistently;
- changeset/release-note automation;
- npm provenance/signing strategy;
- API Extractor or equivalent public-surface verification;
- generated TypeDoc/reference strategy;
- compatibility/deprecation policy;
- canary prereleases;
- upgrade tests against a reference application.
