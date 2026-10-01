# Qroz — application framework for humans and agents

> **Pre-1.0 public-beta track.** Qroz is the final product name. Its public API may still change before 1.0.

Qroz is a TypeScript application framework designed to stay **simple at the beginning, explicit as applications grow, and understandable to both humans and coding agents**.

The product goal is not to win on routing benchmarks or reproduce every cloud primitive. Qroz owns **application semantics**; providers own **infrastructure primitives**.

```ts
export default app({
  name: "acme",
  modules: [users, billing, notifications]
})
```

From that application source Qroz builds a truthful, machine-readable **Application Graph** used by runtime enforcement, tests, developer tooling, deployment planning, security analysis and agent context.

## Product direction

Qroz is optimizing for a developer experience with five properties:

- **simple like a minimal Web framework** for small applications;
- **productive like a batteries-included framework** without mandatory decorators or ceremony;
- **structured as the application grows** without requiring an architectural rewrite;
- **visual and explainable** through a local-first Qroz Studio and deterministic CLI;
- **transparent rather than magical**: important behavior must be explainable from source, graph, trace or deployment plan.

The current priority is therefore **product/DX depth**, not framework surface-area growth.

Near-term work focuses on:

1. finish authorization decision semantics and security foundations;
2. keep a deliberately small portable durable-workflow subset with real provider evidence;
3. make `qroz dev`, errors, inspection, testing and Qroz Studio exceptional;
4. turn deployment/security changes into reviewable semantic diffs;
5. expose the same application intelligence safely to coding agents.

## Implemented foundation

Today the repository includes:

- app/module/endpoint/event/listener/job definitions;
- Standard-Schema-compatible validation;
- Web Standards HTTP runtime;
- memory, Cloudflare Worker and AWS Lambda/API Gateway adapters;
- typed capabilities/providers and invocation lifecycle;
- deterministic Application Graph schema v7;
- object storage, queues, jobs and durable idempotency across portable/Cloudflare/AWS-shaped environments;
- PostgreSQL + Drizzle integration;
- semantic tracing and W3C job-envelope propagation;
- CLI inspect/validate/explain/context/diff/plan;
- read-only MCP integration;
- endpoint principals, permissions, contextual policies and portable authentication composition;
- experimental durable workflow graph with memory execution, Cloudflare Workflows local execution and AWS Step Functions compilation.

## Product rule

**Qroz owns semantics. Providers own primitives.**

Qroz should not build its own ORM, identity provider, LLM SDK, general-purpose IaC engine or workflow engine when existing tools can implement Qroz capabilities. Qroz should make those tools coherent through one application model.

## Documentation

The canonical documentation map is [docs/README.md](./docs/README.md).

Recommended entry points:

- [Getting started](./docs/getting-started/README.md)
- [Mental model](./docs/getting-started/mental-model.md)
- [Product vision](./docs/project/vision.md)
- [Design principles](./docs/project/principles.md)
- [System architecture](./docs/architecture/system-overview.md)
- [Roadmap](./docs/project/roadmap.md)
- [Current status](./docs/project/status.md)
- [Support matrix](./docs/project/support-matrix.md)
- [Quality gates](./docs/project/quality-gates.md)

## Verify

```bash
npm install
npm run verify
```

For release preparation:

```bash
npm run release:verify
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) before architectural changes.
