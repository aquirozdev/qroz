---
title: September 2026 GitHub projects and agent baseline
description: Current GitHub repository, Projects, Actions security, Copilot customization, and agent-workflow facts used by Qroz.
---

# September 2026 GitHub projects and agent baseline

Research date: **2026-09-19**.

## Repository agent instructions

GitHub Copilot supports repository-wide instructions in `.github/copilot-instructions.md`, path-specific `.github/instructions/*.instructions.md`, and agent instructions through `AGENTS.md`. Custom agents can be stored under `.github/agents/`.

Qroz implication: use layered context rather than a single oversized agent prompt.

Sources:
- https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions
- https://docs.github.com/en/copilot/reference/custom-instructions-support
- https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-custom-agents

## Agent skills

GitHub Copilot supports project agent skills in `.github/skills/<skill>/SKILL.md`. Skills are task-specific and can be loaded by cloud agent, code review, Copilot CLI/app, and VS Code agent mode.

Qroz implication: detailed repeatable processes such as architecture-change review or CI debugging belong in skills rather than always-on context.

Source: https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills

## Issue forms and pull request templates

Issue Forms live under `.github/ISSUE_TEMPLATE` and support required structured fields. Pull request templates live in `.github/` (or supported alternative locations).

Qroz implication: collect problem/API/semantics/evidence at issue creation time so both humans and coding agents receive well-bounded tasks.

Sources:
- https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms
- https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates

## GitHub Projects

Projects can render the same issues/PRs as table, board and roadmap views, with custom fields, iterations and built-in workflows.

Qroz implication: one Qroz Development Project can cover backlog, current execution, architecture work and roadmap views. Issues remain the canonical work items; the project is a planning view.

Sources:
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/best-practices-for-projects

## Repository rulesets

Rulesets can require PRs/status checks, prevent force pushes and enforce other branch/repository policies. Availability for private repositories depends on the GitHub plan.

Qroz implication: document the intended `main` policy now and enable server-side enforcement when the repository plan permits it.

Sources:
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets

## GitHub Actions hardening

GitHub recommends least-privilege `GITHUB_TOKEN` permissions. A full commit SHA is the only immutable way to reference an action.

Qroz implication: CI uses `contents: read`, pins GitHub-owned actions by full SHA and lets Dependabot propose action updates.

Sources:
- https://docs.github.com/en/actions/reference/security/secure-use
- https://docs.github.com/en/actions/tutorials/authenticate-with-github_token

## Dependabot

Dependabot supports GitHub Actions and npm version updates. Workflows triggered by Dependabot operate with restricted token/secrets behavior.

Qroz implication: dependency PRs must pass the same no-secret CI gates and should not require deployment credentials.

Sources:
- https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-on-actions
- https://docs.github.com/en/actions/reference/security/secure-use

## Current repository limitation

The Qroz repository is private. The current GitHub API/plan configuration returned an upgrade/public-repository requirement when querying rulesets, and branch-protection data was not accessible to the integration.

This is a repository/account constraint, not an Qroz code limitation. Server-side policy enforcement should be revisited if the repository becomes public or its GitHub plan changes.
