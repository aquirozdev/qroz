---
title: Production readiness
description: What must be true before Arc should be recommended for production workloads.
---

# Production readiness

Arc is **not currently production-ready**. This page defines evidence needed to change that statement.

## Framework correctness

- fuzz/property coverage for parsers and routing boundaries;
- stable public error behavior;
- load/concurrency tests;
- cancellation/timeout model;
- documented memory/bundle/runtime constraints.

## Distributed execution

- duplicate/retry failure testing across real providers;
- idempotency lease extension for long jobs;
- DLQ/redrive operational guides;
- job schema migration/draining strategy;
- second external queue provider verified.

## Security

- threat model;
- dependency/security scanning;
- auth/policy model;
- secret handling guarantees;
- generated IAM review/testing;
- MCP authentication + authorization + approval model before mutations.

## Data

- real Hyperdrive integration;
- transaction guidance;
- migration workflow;
- backup/restore expectations remain provider responsibilities but must be documented.

## Operations

- observability/export verified;
- deploy/rollback story;
- version compatibility policy;
- incident/debugging workflow;
- upgrade tests;
- release provenance.

## Ecosystem/DX

- public docs site;
- API/reference docs;
- starter/reference application;
- installable published packages;
- clear support matrix;
- reproducible local environment.

Until these gates are met, Arc releases should continue to describe themselves as research/experimental.
