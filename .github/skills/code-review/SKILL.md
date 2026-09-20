---
name: code-review
description: Review Arc pull requests for correctness, portability, architecture integrity, security, compatibility, and evidence. Use during Copilot code review or explicit PR review tasks.
---

# Arc code review

Review behavior and architectural claims before style.

## Required review lenses

1. **Public DX** — Is the user-facing API simpler than the internal machinery it introduces?
2. **Graph truthfulness** — Can code perform effects not represented by `requires`, `emits`, `dispatches`, auth/policy metadata, or resource metadata?
3. **Portability** — Is provider-specific behavior leaking into portable packages? Is a portability claim supported by more than one implementation?
4. **Distributed correctness** — Check retry, duplicate delivery, idempotency, timeout, lifecycle, partial failures and version skew.
5. **Compatibility** — Check TypeScript API, Application Graph schema, job envelope and deterministic machine output.
6. **Security** — Check secrets, least privilege, unsafe deserialization, agent/MCP capabilities and workflow permissions.
7. **Evidence** — The strongest claim in the PR must have a matching contract/integration gate.
8. **Documentation** — Current status/support matrix must not overstate evidence.

Report high-impact correctness/security/compatibility findings first. Avoid blocking a PR solely for subjective style.
