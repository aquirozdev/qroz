---
title: Product vision
description: Arc's current product thesis: exceptional developer experience backed by truthful application semantics.
---

# Product vision

Arc explores a **TypeScript application framework for humans and AI agents** whose primary product is a coherent developer experience backed by a truthful semantic model.

It is not “Laravel rewritten in TypeScript”, another routing framework, another cloud abstraction layer, or another workflow engine.

Arc's thesis is:

> Developers should be able to start with almost no ceremony, grow into distributed systems without changing architectural frameworks, and always understand what their application does, depends on, can access and will change when deployed.

## Product problem

The TypeScript backend ecosystem repeatedly forces developers to choose between:

- minimal frameworks with excellent first-run simplicity but little application-level structure;
- batteries-included frameworks whose structure arrives with substantial ceremony or magic;
- cloud platforms with excellent primitives but fragmented configuration and provider leakage;
- platform engineering systems that understand infrastructure but not enough application intent;
- AI coding tools that can generate changes faster than teams can understand their architectural, security and deployment consequences.

Arc should make those trade-offs less necessary.

## Product promise

The desired progression is:

```text
hello world
    ↓
ordinary CRUD
    ↓
database + auth
    ↓
jobs + events
    ↓
policies + workflows
    ↓
multi-surface deployment
```

without replacing the application model along the way.

The first ten minutes must feel small. The hundredth module must still feel understandable.

## The semantic core

```text
                     Application source
                            │
                            ▼
                    Application Model
                            │
                    Application Graph
                            │
       ┌────────────────────┼─────────────────────┐
       ▼                    ▼                     ▼
    Runtime              Developer DX         Change intelligence
 HTTP/events/jobs     CLI/Studio/tests       security/deploy diff
 workflows/policies    docs/agents/LSP        IAM/bindings/plans
       │
       ▼
 capability/resource adapters
       │
 ┌─────┴──────┬─────────────┐
 ▼            ▼             ▼
Cloudflare    AWS       local/other providers
```

The Application Graph is valuable only because execution and tooling remain truthful to it.

## Differentiation

Arc should not compete on “we also have routes, auth, queues and workflows.”

The differentiation is the combination of:

1. **low-ceremony application API**;
2. **explicit semantic architecture**;
3. **runtime enforcement of declared intent**;
4. **beautiful, explainable local tooling**;
5. **semantic deployment and security diffs**;
6. **machine-readable context for agents without making MCP or any single protocol the product**.

## Experience target

Arc should feel:

- minimal when the application is minimal;
- batteries-included when common production behavior is needed;
- structured without decorator-heavy ceremony;
- visual without making a dashboard the source of truth;
- portable without hiding provider differences;
- safe for agents without reducing human control.

The UI and CLI are two views over the same model. A setting must never exist only in a dashboard if it changes application semantics.

## Explainability rule

Any important behavior should be explainable by at least one of four artifacts:

1. application source;
2. Application Graph;
3. execution trace;
4. deployment/change plan.

If important state exists outside those surfaces, Arc should treat it as architectural debt.

## Provider rule

**Arc owns semantics. Providers own primitives.**

Arc integrates existing databases, auth providers, cloud resources, AI SDKs, infrastructure tools and durable engines through capabilities/adapters. Provider-native escape hatches remain first-class.

## Long-term outcome

A developer should be able to open an unfamiliar Arc application and quickly answer:

- what does this application expose?
- which modules depend on each other?
- which resources and operations can each surface use?
- which identities and policies authorize an action?
- what happens when this code changes?
- what will deployment create, remove or grant?
- what context is safe to give a coding agent?

A modular application should be able to evolve toward distributed execution without rewriting its domain model, and a coding agent should be able to understand that architecture without reverse-engineering the entire repository.
