---
title: Design principles
description: Non-negotiable product, DX and architecture principles used to evaluate Arc changes.
---

# Design principles

## Simple first, powerful progressively

Hello world and ordinary CRUD must require almost no ceremony. Distributed-system concepts appear only when the application actually needs them.

## Explicit over magical

Dependencies, effects, permissions, caching, retries, workflow transitions and deployment consequences must be inspectable. Convenience may remove syntax, never understanding.

## One semantic source of truth

Application source produces the Application Graph. Runtime enforcement, CLI, Arc Studio, generated contracts, deployment planning and agent context consume that same model instead of maintaining parallel metadata.

## Capabilities over vendors

Application code requests semantic abilities. Platform composition chooses implementations.

**Arc owns semantics. Providers own primitives.**

Do not build a custom ORM, identity provider, LLM SDK, generic IaC engine or durable engine without compelling evidence that an Arc-specific implementation is required.

## Application Graph over configuration sprawl

Important application intent should not be duplicated across code, YAML, dashboards and provider consoles. Provider configuration may exist, but semantic drift must be detectable.

## Code remains authoritative

Arc Studio is a projection and control surface over the application model, not a second application model. Meaningful UI edits must have an explicit code/config representation.

## Beautiful errors are product features

Framework errors must answer:

1. what happened?
2. why did Arc reject it?
3. where is the responsible application declaration?
4. what are the safe fixes?

Machine-readable error codes remain stable, while human output should be concise and actionable.

## Fast feedback is correctness

DX latency is a quality property. Incremental rebuilds, graph updates, tests, diagnostics and Studio refreshes should remain below explicit performance budgets and be regression-tested on representative applications.

## Progressive architecture

An application must not need a rewrite to move from one endpoint to modules, jobs, policies and workflows.

## Local-first, no-account-first

Core development must work without a hosted Arc account. `arc dev`, testing, graph inspection and Studio should be useful locally before any cloud integration.

## UI and CLI parity

Important functionality should be available from deterministic commands and represented visually where that improves comprehension. Neither interface should conceal capabilities from the other.

## Web Standards over runtime-specific HTTP APIs

Portable runtime boundaries prefer TC55-compatible Web APIs.

## No fake portability

Provider differences are explicit. Portability never means discarding valuable native behavior or claiming parity from compilation alone.

## Native escape hatches

A framework abstraction must not trap an application away from platform capabilities.

## At-least-once aware by default

Retries, duplicates and partial failures are normal distributed behavior. Exactly-once claims require durable evidence.

## Human DX equals machine DX

Definitions, errors and graph output should be understandable by people and deterministic for agents/CI. Agent interfaces consume the same model rather than creating a parallel architecture.

## Design from examples inward

Public application ergonomics are specified before internal machinery.

## Evidence before abstraction

A portable abstraction normally needs at least two implementations or equally strong cross-provider evidence before stabilization.

## Depth before surface area

Once an architectural primitive is sufficient to prove a product flow, prefer improving onboarding, error quality, observability, testing, tooling and reliability over adding adjacent primitives.
