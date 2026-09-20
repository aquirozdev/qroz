---
title: September 2026 multi-agent repository compatibility
description: Current instruction, skill, and custom-agent conventions across Codex, Claude Code, OpenCode, and GitHub Copilot.
---

# September 2026 multi-agent repository compatibility

Research date: **2026-09-19**.

## Codex

Codex loads hierarchical `AGENTS.md` instructions from the repository and supports repository skills in `.agents/skills/<name>/SKILL.md`. Project-specific custom subagents can be defined as TOML files in `.codex/agents/` with required `name`, `description`, and `developer_instructions`.

Sources:
- https://developers.openai.com/docs/agent-configuration/agents-md
- https://developers.openai.com/docs/build-skills
- https://developers.openai.com/docs/agent-configuration/subagents

## Claude Code

Claude Code's native repository instruction system remains `CLAUDE.md` / `CLAUDE.local.md`; project subagents are Markdown definitions under `.claude/agents/`. Claude Code supports project skills under `.claude/skills/`.

As of the research date, native `AGENTS.md` support remains a requested feature in the Claude Code repository, and reports exist around symlink/import workarounds.

Sources:
- https://code.claude.com/docs/en/memory
- https://code.claude.com/docs/en/sub-agents
- https://github.com/anthropics/claude-code/issues/34235

## OpenCode

OpenCode V2 natively reads `AGENTS.md`. It does not use `CLAUDE.md` as the normal fallback in the V2 instruction model documented on opencode.ai. It supports project custom agents in `.opencode/agents/` and discovers skills from `.agents/skills/`, `.claude/skills/`, and `.opencode/skills/`.

Sources:
- https://opencode.ai/v2/docs/instructions
- https://opencode.ai/v2/docs/agents
- https://opencode.ai/docs/skills

## GitHub Copilot

Qroz keeps GitHub-specific Copilot instructions/agents/skills under `.github/` while `AGENTS.md` remains the vendor-neutral repository contract.

## Symlinks

Git documents that when `core.symlinks=false`, symbolic links are checked out as regular files containing the link text.

Qroz implication: do not use symlinks as the primary compatibility layer for critical agent instructions. Commit regular adapter files and verify synchronization in CI.

Source:
- https://git-scm.com/docs/git-config#Documentation/git-config.txt-coresymlinks
