---
title: Repository governance
description: Arc's branch, issue, pull-request, merge, automation and maintainer workflow.
---

# Repository governance

Arc uses GitHub Issues/PRs as the executable engineering record and canonical docs/ADRs as the durable architecture record.

## Branch naming

Use focused branches:

- `feat/<topic>`
- `fix/<topic>`
- `docs/<topic>`
- `chore/<topic>`
- `research/<topic>`

Do not use long-lived feature branches as an alternative to integrating small vertical slices.

## Issue types

Repository issue forms separate:

- bugs;
- features;
- architecture proposals;
- documentation.

A feature/architecture issue should start from the user/application problem and desired API rather than an internal class hierarchy.

## Pull requests

A PR should normally represent one coherent architectural/product change.

The template asks for:

- problem;
- user-facing behavior;
- graph/semantic impact;
- provider/portability impact;
- tests/integration evidence;
- docs/ADR;
- security/agent considerations;
- breaking changes.

## Merge strategy

Preferred strategy: **squash merge** for focused PRs, preserving a readable mainline while PR/issue history retains iterative discussion.

Avoid direct pushes to `main` for normal development.

## Desired main-branch ruleset

When repository plan/settings permit rulesets for this private repository, configure:

- require pull request before merge;
- required approvals: 0 while there is only one human maintainer; raise to 1 when another maintainer exists;
- require conversation resolution;
- require status checks:
  - Typecheck and test
  - Cloudflare workerd smoke
  - PostgreSQL 18 + Drizzle + pg
  - MCP v2 read-only integration
- require branch to be up to date when practical;
- require linear history;
- block force pushes;
- block branch deletion;
- allow administrator bypass only for emergencies, with a follow-up issue.

GitHub currently exposes rulesets as the preferred modern policy layer. This repository's current private-plan/API configuration does not allow us to enforce the ruleset yet; the policy above remains the target configuration.

## Automation

Dependabot checks npm dependencies in the root/integration projects and GitHub Actions weekly.

Actions should:

- use least-privilege `GITHUB_TOKEN`;
- pin external actions by full commit SHA;
- avoid `pull_request_target` for untrusted code unless a reviewed security design requires it;
- keep deployment credentials environment-scoped when deployment automation arrives.

## Ownership

`.github/CODEOWNERS` currently assigns the repository to the single maintainer. Replace personal ownership with teams/components as maintainership grows.
