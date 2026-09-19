# ADR 0010 — Validate providers per execution surface

Status: accepted in v0.4.

## Context

HTTP endpoints, queue consumers and future scheduled/workflow handlers can be deployed separately. Requiring every deployment surface to provide every capability in the whole application would couple otherwise independent services and violate least privilege.

This surfaced as soon as a Cloudflare HTTP Worker and Queue consumer shared one application definition: the HTTP surface should not need the consumer-only delivery provider, and the consumer should not need R2 or unrelated HTTP repositories.

## Decision

Application build still validates structural invariants globally, but runtime provider presence is validated at the active execution owner:

- current endpoint;
- current listener;
- current job.

Runtime adapters may therefore compose only the capabilities required by their surface.

## Consequences

- cleaner serverless decomposition;
- smaller binding/IAM sets;
- one Application Model can drive multiple independently deployed entrypoints;
- deployment planning must derive capabilities per surface, not only per application.
