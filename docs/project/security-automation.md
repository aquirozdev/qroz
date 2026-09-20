---
title: Repository security automation
description: GitHub Actions, dependency updates, secrets and future security gates for Arc.
---

# Repository security automation

## Actions

All workflows default to:

```yaml
permissions:
  contents: read
```

Grant additional permissions only at the job that requires them.

External actions are pinned to full commit SHAs. Dependabot tracks GitHub Actions updates so immutable references can still be maintained.

## Dependency maintenance

`.github/dependabot.yml` checks:

- root npm/workspace dependencies;
- MCP integration dependencies;
- PostgreSQL integration dependencies;
- GitHub Actions.

Minor/patch root updates are grouped to control PR noise.

## Secrets

Current CI does not require cloud production credentials.

When deployment gates arrive:

- prefer OIDC/workload identity over long-lived cloud keys;
- use GitHub Environments for production/staging boundaries when the repository plan supports the required protections;
- scope every token to minimum permissions;
- do not expose deployment secrets to agent-authored/untrusted PR workflows.

## Code/security scanning

Before public/production readiness, enable the strongest scanning available for the repository plan:

- dependency graph;
- Dependabot security updates;
- secret scanning / push protection;
- CodeQL/code scanning where available;
- dependency review on PRs where available.

Do not add a workflow that pretends these checks are active if the private repository plan does not provide them.

## Vulnerability handling

Follow `SECURITY.md`. If Arc becomes public, enable GitHub private vulnerability reporting and security advisories before announcing production support.
