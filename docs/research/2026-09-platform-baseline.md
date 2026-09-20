---
title: September 2026 platform baseline
description: Primary external facts used to update Arc's roadmap and architecture in September 2026.
---

# September 2026 platform baseline

Research date: **2026-09-19**.

## TC55 / Web runtime interoperability

The Minimum Common Web API draft dated 31 July 2026 describes the first edition of an Ecma standard for a curated subset of Web Platform APIs in server runtimes, adopted by the Ecma General Assembly in December 2025.

Arc implication: keeping portable runtime boundaries around standard `Request`, `Response`, `Headers`, URL and streams is aligned with an actual standards direction rather than only a framework convention.

Source: https://min-common-api.proposal.wintertc.org/

## MCP

The official TypeScript SDK v2 is the stable line implementing the 2026-07-28 MCP specification. Its server package provides Web-standard HTTP integration through `createMcpHandler()`.

Arc implication: MCP remains an adapter over Arc semantics; no custom protocol implementation is justified.

Sources:
- https://ts.sdk.modelcontextprotocol.io/v2/
- https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/migration/support-2026-07-28.md

## Cloudflare Durable Objects

SQLite-backed Durable Objects are GA and Cloudflare recommends SQLite storage for new Durable Object classes.

Arc implication: the SQLite DO remains a credible Cloudflare implementation of coordinated job idempotency state.

Source: https://developers.cloudflare.com/durable-objects/

## Cloudflare tracing

Workers automatically traces platform operations and exposes custom spans through Workers tracing APIs.

Arc implication: keep a portable semantic tracer and use native tracing bridges rather than shipping an embedded tracing backend.

Source: https://developers.cloudflare.com/workers/observability/traces/custom-spans/

## OpenTelemetry semantic conventions

OpenTelemetry Semantic Conventions are at 1.44.0. HTTP server/client spans and database client spans are stable; messaging conventions remain in development.

Arc implication: use stable HTTP/DB naming where appropriate. Keep Arc messaging/job attributes namespaced/versionable until messaging semantic conventions settle.

Sources:
- https://opentelemetry.io/docs/specs/semconv/
- https://opentelemetry.io/docs/specs/semconv/http/http-spans/
- https://opentelemetry.io/docs/specs/semconv/db/database-spans/
- https://opentelemetry.io/docs/specs/semconv/messaging/

## AWS SQS/Lambda

AWS Lambda supports partial batch failure reporting for SQS. AWS Powertools documents that this reduces repeat processing but does not guarantee exactly-once and recommends idempotent processing.

Arc implication: the next AWS job adapter can map Arc per-message outcomes to SQS partial batch responses without changing the at-least-once model.

Sources:
- https://docs.aws.amazon.com/powertools/typescript/latest/features/batch/
- https://docs.aws.amazon.com/powertools/typescript/latest/

## Documentation systems

Astro Starlight currently provides navigation, search, i18n, SEO, accessibility-oriented defaults and Markdown/MDX/Markdoc support. VitePress remains a strong lightweight alternative with local full-text search.

Arc implication: keep Markdown canonical and target Starlight first, preserving reversibility.

Sources:
- https://starlight.astro.build/
- https://vitepress.dev/reference/default-theme-search

## Competitive baseline

Encore continues to derive an Application Model through static analysis and uses it across local infrastructure, previews, deployment and observability. Hono continues to demonstrate a Web Standards cross-runtime HTTP model. Effect Platform continues to provide typed abstract platform services with runtime-specific layers.

Arc implication: do not compete by rebuilding their strongest lower-level primitives. Differentiate through explicit application semantics, portable capabilities, truthful distributed behavior and human+agent DX.

Sources:
- https://encore.dev/docs/understanding-encore
- https://hono.dev/docs/concepts/web-standard
- https://effect.website/docs/v4/platform/introduction
