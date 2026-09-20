---
title: GitHub Projects operating model
description: Recommended Project fields, views, and automation for Qroz's roadmap and agent-assisted development.
---

# GitHub Projects operating model

GitHub Projects should be the **planning surface**, while Issues/PRs remain the work items and `docs/project/roadmap.md` remains the durable product sequence.

A Project should not become a second undocumented roadmap.

## Recommended project

Name: **Qroz Development**

Default repository: `aquirozdev/qroz`.

## Fields

Use GitHub's native Status plus:

- **Priority** — P0 / P1 / P2 / P3;
- **Area** — Core / Runtime / Resources / Jobs / Data / Telemetry / Agents / Docs / Release;
- **Type** — Bug / Feature / Architecture / Docs / Research / Chore;
- **Target** — research milestone such as v0.8, v0.9, v0.10;
- **Estimate** — small numeric estimate for planning, not performance measurement;
- **Iteration** — optional when active weekly/biweekly planning becomes useful.

## Views

### Backlog

Table grouped by Priority, excluding Done.

### Current

Board grouped by Status, filtered to current Target/iteration.

### Roadmap

Roadmap layout using Target date/iteration for milestone-level work.

### Architecture

Table filtered to Type = Architecture or Research.

### Agent-ready

Items that have a clear problem statement, acceptance criteria and no unresolved architecture decision. This is the safest queue for coding-agent delegation.

## Status workflow

Keep status simple:

```text
Backlog → Ready → In progress → In review → Done
                    ↘ Blocked
```

Avoid encoding every engineering state into a Project field.

## Agent workflow

Before assigning an issue to a coding agent, make sure it contains:

- bounded objective;
- relevant docs/ADR links;
- expected public API/behavior;
- acceptance tests/gates;
- explicit non-goals.

Agents should create PRs; they should not close roadmap issues merely because code was generated. CI + human review determine completion.

For GitHub Copilot cloud agent specifically, assign an issue only after it is agent-ready. GitHub documents that the agent receives the issue title/body/comments that exist **at assignment time** and then opens a PR; follow-up instructions added later should be given on that pull request rather than relying on new issue comments. When assigning, choose the specialist Qroz custom agent that matches the task where useful.

## Automation

Use built-in Project workflows for:

- auto-add repository issues/PRs;
- set new items to Backlog;
- move linked items to Done when their issue/PR closes;
- optionally set In review when a PR is opened.

GitHub Projects supports table, board and roadmap views plus custom/iteration fields, so one Project is sufficient for backlog, execution and roadmap views without separate boards.
