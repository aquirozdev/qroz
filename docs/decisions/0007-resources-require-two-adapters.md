# ADR 0007 — Resource abstractions require multiple implementations

Status: accepted

## Decision

A portable resource abstraction should not stabilize from one vendor SDK alone. The first resource capabilities are validated through a memory implementation and a Cloudflare implementation using the same contract probe.

Implemented:

- Object Storage: memory + R2.
- Queue producer: memory + Cloudflare Queues.

## Why

This exposes semantic mismatches before they become public framework APIs and prevents “Cloudflare SDK renamed as generic interface”.

## Consequence

Database support remains pending until Drizzle/PostgreSQL can actually be installed and executed.
