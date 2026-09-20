---
name: ci-failure-debugging
description: Use when a GitHub Actions gate fails for Arc, especially TypeScript/tests, workerd, PostgreSQL/Drizzle, MCP, or documentation integrity.
---

# CI failure debugging

1. Identify the exact failing job and step; do not rerun everything blindly.
2. Read the failing job log and classify:
   - deterministic code/test failure;
   - dependency/toolchain change;
   - external service/runtime incompatibility;
   - transient infrastructure failure.
3. Reproduce locally when possible using the same pinned versions.
4. Fix code/configuration rather than weakening assertions or skipping the gate.
5. If the failure exposes a compatibility assumption, update research/docs/ADR.
6. Rerun only the failed job first when GitHub supports it; run the full suite before merge.
7. Record any newly discovered provider limitation in the support matrix.

Never convert a failing integration gate into a mocked test just to restore green CI.
