---
title: Multi-agent compatibility
description: How Qroz keeps repository instructions, skills, and specialist agents compatible across Codex, Claude Code, OpenCode, and GitHub Copilot.
---

# Multi-agent compatibility

Qroz is intentionally not tied to one coding-agent vendor.

## Canonical layers

### Repository instructions

`AGENTS.md` is the canonical cross-tool instruction source.

- **Codex** natively reads hierarchical `AGENTS.md`.
- **OpenCode** V2 natively reads hierarchical `AGENTS.md`.
- **Claude Code** still uses `CLAUDE.md` as its native project memory/instruction file.

Qroz therefore commits a generated **real file** `CLAUDE.md` whose body mirrors `AGENTS.md`. CI fails if it drifts.

We do not use a symlink or `@AGENTS.md` import as the compatibility mechanism. Git may materialize symlinks as plain files when `core.symlinks=false` on unsupported/configured filesystems, and Claude Code has had current issues around symlink/import behavior. A generated regular file is more boring and more portable.

### Skills

Canonical repository skills live in:

```text
.agents/skills/<skill>/SKILL.md
```

This location is natively discovered by **Codex** and **OpenCode**.

Claude-compatible mirrors live under:

```text
.claude/skills/
```

GitHub Copilot-compatible mirrors live under:

```text
.github/skills/
```

`npm run agents:check` verifies byte-for-byte synchronization.

### Specialist agents

Agent configuration schemas are vendor-specific, so Qroz does **not** pretend one file can describe all capabilities safely.

Equivalent role adapters are committed for:

```text
.codex/agents/       Codex TOML custom agents
.claude/agents/      Claude Code Markdown subagents
.opencode/agents/    OpenCode Markdown agents
.github/agents/      GitHub Copilot custom agents
```

The shared roles are:

- Qroz Architect
- Qroz Implementer
- Qroz Reviewer
- Qroz Docs

The role intent is shared, while permissions/tool syntax stays native to each harness.

## Why not symlinks

Symlinks look attractive for avoiding duplication, but they create cross-platform checkout behavior and tool-specific edge cases. Git's `core.symlinks=false` behavior checks symlinks out as small regular files containing the target text, which would be catastrophic for an instruction file.

Use generated/mirrored regular files plus an integrity check instead.

## Why not force every tool into CLAUDE.md

OpenCode prioritizes `AGENTS.md` when both `AGENTS.md` and `CLAUDE.md` exist. Codex also treats `AGENTS.md` as its native project instruction model. Making Claude's filename canonical would degrade the two tools that already agree on the cross-tool convention.

## Verification

```bash
npm run agents:check
npm run verify
```

If a canonical instruction/skill changes, update its mirrors in the same PR. Future tooling may add a generator command; the important invariant is that CI prevents silent drift.

## Nested scope

When Qroz grows enough to need package-specific agent rules, add nested `AGENTS.md` files close to the relevant packages. Create corresponding nested Claude instructions only if Claude Code actually needs those scopes; avoid proliferating files preemptively.
