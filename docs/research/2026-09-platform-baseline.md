---
title: September 2026 platform baseline
description: Primary external facts used to update Arc's roadmap and architecture in September 2026.
---

# September 2026 platform baseline

Research date: **2026-09-19**.

## TC55 / Web runtime interoperability

The Minimum Common Web API draft dated 31 July 2026 describes the first edition of an Ecma standard for a curated subset of Web Platform APIs in server runtimes, adopted by the Ecma General Assembly in December 2025.

Arc implication: Web-standard `Request`, `Response`, `Headers`, URL and streams remain the correct portable runtime boundary.

Source: https://min-common-api.proposal.wintertc.org/

## Standard Schema

Standard Schema V1 is a common validator interface. The project also defines Standard JSON Schema V1 for entities capable of producing JSON Schema.

Arc implication: keep validation provider-neutral and use Standard JSON Schema opportunistically for generated contracts rather than adding Zod-specific conversion logic.

Sources:
- https://standardschema.dev/schema
- https://standardschema.dev/json-schema

## OpenAPI / JSON Schema

OpenAPI 3.2.1 was published on 2026-09-10. OpenAPI 3.2 uses a JSON Schema 2020-12-based dialect. JSON Schema's current published version remains Draft 2020-12.

Arc implication: future HTTP contract generation should target OpenAPI 3.2.x and must distinguish schemas that can be faithfully converted from opaque Standard Schema validators.

Sources:
- https://spec.openapis.org/oas/v3.2.1.html
- https://json-schema.org/specification

## AsyncAPI

AsyncAPI 3.1.0 was released in January 2026 and describes message-driven APIs independently of transport.

Arc implication: evaluate AsyncAPI as an export/documentation format for public event/message boundaries; do not make it Arc's internal job/event model.

Sources:
- https://www.asyncapi.com/blog/release-notes-3.1.0
- https://www.asyncapi.com/docs/concepts/asyncapi-document

## W3C Trace Context

W3C Trace Context standardizes `traceparent` and `tracestate` propagation. The recommendation also explicitly warns against putting personally identifiable information into `tracestate`.

Arc implication: v0.7 propagation stays standards-compatible and agent/telemetry code must treat trace state as opaque tracing data, not an application metadata carrier.

Source: https://www.w3.org/TR/trace-context/

## MCP

The official TypeScript SDK v2 is the stable line implementing the 2026-07-28 MCP specification. Its server package provides Web-standard HTTP integration through `createMcpHandler()`.

Arc implication: MCP remains an adapter over Arc semantics; no custom protocol implementation is justified.

Sources:
- https://ts.sdk.modelcontextprotocol.io/v2/
- https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/migration/support-2026-07-28.md

## Cloudflare Durable Objects

SQLite-backed Durable Objects are GA and Cloudflare recommends SQLite storage for new Durable Object classes.

Arc implication: SQLite DO remains a credible Cloudflare implementation of coordinated job idempotency state.

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

## AWS Lambda / SQS

AWS Lambda currently lists managed Node.js 24 on Amazon Linux 2023 and Node.js 26 as an upcoming November 2026 runtime target. Lambda SQS integrations support partial batch failure reporting. AWS Powertools documents that partial failure handling reduces duplicate processing but does not guarantee exactly-once execution.

Arc implication: design the AWS adapter for modern AL2023 runtimes and map Arc per-message outcomes to SQS partial batch responses while retaining idempotency.

Sources:
- https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html
- https://docs.aws.amazon.com/powertools/typescript/latest/features/batch/

## npm package publishing

npm trusted publishing uses OIDC and can automatically generate provenance in supported public publishing workflows. npm currently documents that provenance is not generated when publishing from private repositories.

Arc implication: do not design public release provenance around the current private-repository state without revisiting this constraint.

Source: https://docs.npmjs.com/trusted-publishers/

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
