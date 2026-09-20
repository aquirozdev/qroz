---
title: Portability
description: Qroz's portability contract, Web Standards boundary, feature detection, and native escape hatches.
---

# Portability

Portability is a tested property, not a marketing label.

## Runtime boundary

Qroz's portable HTTP layer uses Web Platform primitives such as `Request`, `Response`, `Headers`, `URL` and streams. This aligns with the TC55 Minimum Common Web API direction for interoperable server runtimes.

## Resource boundary

Application code requests semantic capabilities. Provider adapters map them onto vendor resources.

## Contract tests

Any abstraction described as portable should be tested against at least two implementations. A memory adapter is useful for deterministic contracts, but external-provider behavior also requires integration gates.

## Feature gaps are explicit

Providers can differ in ordering, delay limits, consistency, batching, retry semantics and transaction models. Qroz records required features rather than silently degrading behavior.

## Escape hatches

Portability must not make advanced provider features unreachable. Provider adapters may expose a documented `native()` or provider-specific composition API.

## Target runtimes

Current verified focus: Web Standards runtime + Cloudflare Workers/workerd.

Next portability proof: AWS Lambda + SQS. Node/Bun/Deno adapters remain possible because the core is not tied to Cloudflare.
