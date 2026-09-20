---
title: Competitive landscape
description: What Arc learns from adjacent frameworks and where it intends to differ.
---

# Competitive landscape

This is a design comparison, not a claim that other frameworks are deficient.

## Laravel / AdonisJS

Lesson: cohesive application DX, conventions, batteries-included workflows and ecosystem matter more than isolated primitives.

Arc difference: serverless/distributed semantics and provider portability are first-order architecture concerns.

## Hono

Lesson: Web Standards are a practical cross-runtime boundary and a small core travels well.

Arc difference: Arc targets the application layer above routing, including capabilities, effects, jobs and graph tooling.

## Encore

Lesson: a machine-readable Application Model can power local infrastructure, previews, IAM/dependency analysis, observability and agent workflows.

Arc difference: Arc is exploring a provider-portable core with explicit adapters and native escape hatches rather than making its platform model the only execution path.

## Effect Platform

Lesson: typed services/layers can separate application logic from runtime implementations cleanly.

Arc difference: Arc optimizes for conventional application-framework ergonomics and an explicit graph rather than requiring a functional effect model.

## SST / infrastructure tools

Lesson: resource linking, environment composition and high-quality TypeScript infrastructure DX are powerful.

Arc difference: Arc's source model begins with application semantics and intends to produce deployment requirements; it is not primarily IaC.

## Positioning hypothesis

```text
Laravel-like application DX
+ Hono/Web Standards portability
+ Encore-like semantic application model
+ explicit capability/resource adapters
+ agent-native deterministic tooling
```

The hypothesis remains subject to validation through real applications and second-cloud portability.
