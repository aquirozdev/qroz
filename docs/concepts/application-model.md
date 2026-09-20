---
title: Application Model
description: Arc's semantic model of an application and the Application Graph derived from it.
---

# Application Model

The Application Model is Arc's central abstraction. The runtime, CLI, agents and future deployment tooling consume the same semantic definitions instead of reconstructing architecture independently.

## Current primitives

- `app()` — application boundary.
- `module()` — cohesive application area.
- `endpoint()` — HTTP operation.
- `event()` — versioned fact that occurred.
- `listener()` — event reaction.
- `job()` — typed/versioned unit of asynchronous work.
- `capability()` — typed application dependency.
- resource helpers — capabilities with resource metadata.

Definitions are ordinary inspectable objects. The core does not require decorators or runtime reflection.

## Effects

An operation describes architectural effects explicitly:

- `requires` — capabilities it may resolve;
- `emits` — events it may publish;
- `dispatches` — jobs it may enqueue.

Runtime enforcement prevents the implementation from silently doing more than the model declares.

## Application Graph

The graph is a deterministic serialization of the model. It is not a tracing graph and not a deployment plan. It captures semantic structure that other systems can transform.

Current consumers include CLI inspection, module context, semantic diff and MCP read-only tools.

Future consumers include IAM generation, deployment planning, LSP navigation, previews and the Dev Console.

## Static analysis later

Arc currently derives the graph from explicit runtime objects. Static compilation may be added later only after the model stabilizes. The compiler is an optimization and tooling layer, not the source of semantics.
