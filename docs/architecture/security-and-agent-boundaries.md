---
title: Security and agent boundaries
description: Least privilege, capability enforcement, MCP read-only defaults, and future approval boundaries.
---

# Security and agent boundaries

Qroz treats architecture metadata as a future security input, but does not equate metadata with enforcement until platform policies are generated and verified.

## Least privilege

Execution-surface dependency analysis should eventually generate the smallest practical resource bindings/IAM set for each deployable unit.

## Agent interfaces

The first MCP surface is deliberately read-only. Architecture inspection is lower-risk than migration, deployment, queue replay, workflow restart or secret access.

Future mutating tools require:

- explicit tool capability;
- authenticated principal/agent identity;
- authorization policy;
- approval mode for high-impact operations;
- audit trail;
- environment boundary;
- replay/idempotency semantics where applicable.

## Secrets

Application Graph and agent context must describe that a secret capability exists without returning secret values.

## Security claims

Qroz will not claim generated IAM, secret isolation or production-safe agent mutations until provider-specific integration tests prove those paths.
