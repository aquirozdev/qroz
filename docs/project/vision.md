---
title: Product vision
description: The complete, current statement of Arc's original idea.
---

# Product vision

Arc explores a **portable TypeScript application framework for humans and AI agents, designed for serverless and distributed systems**.

It is not “Laravel rewritten in TypeScript.” The target is Laravel-level application ergonomics combined with explicit architecture, Web Standards portability, an Encore-like machine-readable application model, provider-neutral capabilities and modern agent tooling.

## The problem

The TypeScript backend ecosystem is fragmented:

- minimal Web frameworks offer portability but little application structure;
- batteries-included frameworks offer structure but are usually process/server oriented;
- serverless platforms expose powerful resources but leak provider details into application code;
- infrastructure tools understand resources but not necessarily domain/application semantics;
- coding agents repeatedly rediscover architecture from files because frameworks expose little machine-readable intent.

Arc's thesis is that these can share one semantic application model.

## The application layer above cloud primitives

```text
                     Application source
                            │
                            ▼
                    Application Model
                            │
                    Application Graph
                            │
      ┌─────────────────────┼──────────────────────┐
      ▼                     ▼                      ▼
   Runtime              Developer DX          Platform planning
 HTTP/events/jobs       CLI/MCP/LSP/docs      bindings/IAM/infra
      │
      ▼
 capability/resource adapters
      │
 ┌────┴──────┬───────────┐
 ▼           ▼           ▼
Cloudflare   AWS      local/other runtimes
```

## Desired experience

Simple applications remain simple. As an application grows, the same model adds capabilities, policies, jobs, workflows, deployment boundaries and observability without requiring a rewrite into a different architectural framework.

## Differentiator

The differentiator is not routing. It is a truthful Application Graph backed by runtime invariants and used consistently by execution, tooling and agents.

## Long-term outcome

A modular serverless monolith should be able to evolve toward independently deployed execution surfaces without rewriting domain/application logic. Provider replacement should be possible where contracts overlap, while provider-native escape hatches preserve access to differentiated capabilities.
