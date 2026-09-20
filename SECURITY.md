# Security policy

Qroz is currently a research project and should not yet be treated as a production-hardened security boundary.

## Reporting

Do not publish suspected vulnerabilities in public issues. Use GitHub's private vulnerability reporting/security advisory flow when enabled for this repository, or contact the repository owner privately.

## Current security posture

Qroz is actively designing:

- least-privilege execution-surface capabilities;
- agent/MCP authorization boundaries;
- secret-safe graph/context output;
- provider IAM generation;
- input/output schema validation;
- job idempotency and poison-message behavior.

These mechanisms are not a substitute for provider IAM, network controls, secret management, dependency scanning or application-level authorization.

## Security-sensitive changes

Changes involving authentication, authorization, secret handling, deployment/IAM, MCP mutations, deserialization, job envelopes or provider credentials require explicit tests and documentation before merge.
