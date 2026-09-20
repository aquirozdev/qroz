---
title: Repository readiness checklist
description: Operational checklist for keeping Arc ready for human and agent-driven development.
---

# Repository readiness checklist

## Already encoded in the repository

- [x] canonical `AGENTS.md`;
- [x] GitHub Copilot repository instructions;
- [x] path-specific TypeScript/docs instructions;
- [x] specialist custom agents;
- [x] agent skills for architecture changes, code review and CI failures;
- [x] structured issue forms;
- [x] pull request template;
- [x] CODEOWNERS;
- [x] Dependabot configuration;
- [x] least-privilege Actions token;
- [x] Actions pinned to immutable SHAs;
- [x] CI concurrency/cancellation;
- [x] canonical docs, ADRs, support matrix and research logs;
- [x] security and contribution policies.

## GitHub UI/account settings to enable when available

- [ ] Create user Project **Arc Development** using `docs/project/github-projects.md`.
- [ ] Enable ruleset for `main` using `docs/project/repository-governance.md`.
- [ ] Prefer squash merge; consider disabling merge commits once history policy is enforced.
- [ ] Enable auto-merge after required checks/ruleset exists.
- [ ] Enable dependency graph and Dependabot security updates.
- [ ] Enable secret scanning/push protection and CodeQL where the repository plan permits them.
- [ ] When deployment begins, configure GitHub Environments and OIDC identities instead of static cloud keys.
- [ ] Before public launch, choose/open-source license, enable private vulnerability reporting, Discussions (if useful), and public package/release provenance.

## Agent task readiness

An issue is agent-ready only when:

- objective and non-goals are bounded;
- canonical docs/ADR context is linked;
- expected public behavior/API is shown;
- acceptance tests/gates are named;
- unresolved architecture decisions are not delegated as coding details.

## Merge readiness

A PR is merge-ready only when:

- relevant CI is green;
- implementation/support claims match evidence;
- compatibility impact is documented;
- canonical docs are current;
- security/agent boundaries are preserved;
- reviewer comments are resolved.
