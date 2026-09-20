---
title: Arc Documentation
description: Canonical map of Arc's product, architecture, guides, references, platform notes, agent interfaces, research, and decisions.
---

# Arc documentation

This directory is the canonical product and engineering knowledge base for Arc. It is intentionally structured so the same Markdown can be used today in GitHub and later rendered as a public documentation website.

## Start here

- [Getting started](./getting-started/README.md) — learn the API from the user's point of view.
- [Mental model](./getting-started/mental-model.md) — understand what Arc is before learning packages.
- [Vision](./project/vision.md) — the full product thesis.
- [System architecture](./architecture/system-overview.md) — how the pieces fit.
- [Roadmap](./project/roadmap.md) — current sequence and release gates.
- [Current status](./project/status.md) — what is implemented and verified today.
- [Production readiness](./project/production-readiness.md) — evidence gates before Arc can make production claims.
- [Reference applications](./project/reference-applications.md) — executable product corpus from simple CRUD to workflows, realtime and agents.
- [Capability backlog](./project/capability-backlog.md) — risk-ordered implementation work derived from the corpus.

## Documentation architecture

| Section | Purpose |
| --- | --- |
| `getting-started/` | First successful experience and mental model |
| `concepts/` | Stable conceptual vocabulary independent of packages |
| `architecture/` | Internal system design and invariants |
| `guides/` | Task-oriented workflows |
| `reference/` | Exact APIs, package map, CLI and graph contracts |
| `platforms/` | Provider/runtime-specific behavior and escape hatches |
| `agents/` | MCP, machine-readable context and agent safety |
| `project/` | Vision, principles, roadmap, status and release process |
| `research/` | Time-stamped external research and source baselines |
| `decisions/` | Architecture Decision Records (ADRs) |

## Source-of-truth rules

1. Product intent belongs in `project/`.
2. Stable vocabulary belongs in `concepts/`.
3. Implementation constraints belong in `architecture/`.
4. Exact commands and schemas belong in `reference/`.
5. Provider-specific facts belong in `platforms/`.
6. Time-sensitive external facts belong in `research/` with date and source.
7. Decisions that constrain future changes require an ADR.
8. A capability is not documented as supported until its quality gate is green.
9. Historical release notes remain in `CHANGELOG.md`; they are not copied into conceptual docs.
10. The public docs site must render these canonical Markdown sources rather than fork them.

## Documentation status

Arc is currently a research framework, not a stable production release. Documentation distinguishes between:

- **implemented** — code exists;
- **contract-tested** — portable behavior is tested against a shared contract;
- **integration-verified** — executed against a real runtime/service;
- **planned** — design direction, not a compatibility promise.

See [quality gates](./project/quality-gates.md).
