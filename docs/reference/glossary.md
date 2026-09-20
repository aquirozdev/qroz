---
title: Glossary
description: Canonical vocabulary used across Arc APIs, architecture, documentation, and tooling.
---

# Glossary

**Application Model** — semantic definition formed by Arc application primitives.

**Application Graph** — deterministic machine-readable serialization of the Application Model and declared relationships.

**Capability** — typed semantic token representing something application code is allowed to use.

**Provider** — concrete value/adapter supplying a capability.

**Provider scope** — provider set plus optional lifecycle/disposal behavior for an invocation.

**Resource capability** — capability that also describes an infrastructure/resource category and features.

**Execution surface** — independently invoked unit such as an HTTP endpoint surface, queue consumer or future workflow runner.

**Endpoint** — HTTP operation.

**Event** — versioned fact that occurred.

**Listener** — application reaction to an event.

**Job** — typed/versioned asynchronous command with transport/retry semantics.

**Queue** — messaging transport used by jobs; not synonymous with a job.

**Workflow** — planned durable multi-step orchestration primitive.

**Adapter** — provider/runtime-specific implementation translating Arc contracts to an external platform.

**Contract test** — shared behavioral test executed against multiple adapter implementations.

**Integration gate** — test against a real runtime/service or official emulator/tooling required before compatibility is claimed.

**Semantic diff** — comparison of Application Graph meaning rather than source lines.

**Native escape hatch** — explicit access to provider-specific behavior not represented in the portable contract.

**Agent DX** — machine-oriented discoverability, deterministic output and safe tool boundaries for coding/operational agents.
