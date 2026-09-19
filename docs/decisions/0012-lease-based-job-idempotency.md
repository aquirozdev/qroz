# ADR 0012 — Lease-based job idempotency

Status: accepted for v0.5 research implementation.

## Context

Queue delivery is at-least-once. Carrying an `idempotencyKey` in a message is metadata, not enforcement. A consumer can crash during processing and a duplicate may arrive concurrently.

## Decision

Jobs may declare an explicit idempotency policy containing:

- a capability-backed atomic store;
- deterministic key function;
- processing lease duration;
- optional completed-key TTL.

Execution uses `claim -> handler -> complete`. Handler failure releases the claim. Completed duplicates are acknowledged without handler execution. Active claims are retried after the remaining lease.

## Consequences

- idempotency is visible in Application Graph v3;
- the store becomes part of the job execution surface and future deployment/IAM planning;
- memory and Cloudflare Durable Object implementations exercise the contract;
- exactly-once is still not claimed;
- long-running jobs will require claim renewal in a future revision.
