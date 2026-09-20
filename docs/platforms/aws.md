---
title: AWS platform
description: Planned AWS validation surface for Lambda, SQS, S3, EventBridge, Step Functions, and least-privilege IAM.
---

# AWS platform

AWS is Arc's next major portability proof. Support is **planned**, not currently implemented.

## First target slice

The first AWS slice should intentionally mirror already-proven Arc semantics:

```text
HTTP        → Lambda/API Gateway adapter
Object data → S3
Jobs        → SQS + Lambda consumer
Idempotency → DynamoDB conditional writes or another atomic store
Tracing     → OpenTelemetry/X-Ray-compatible bridge
```

## Why SQS matters first

Arc jobs already model at-least-once delivery and per-message outcomes. Lambda's SQS integration supports partial batch failure reporting, which can map naturally to Arc's per-message ack/retry outcome model.

The adapter must test:

- standard queue retries;
- partial batch responses;
- FIFO-specific constraints separately;
- visibility timeout implications;
- DLQ/redrive configuration;
- idempotency under duplicate delivery.

## IAM

The long-term deployment planner should derive candidate IAM from execution-surface capability requirements, then expose the generated policy for review rather than hiding it.

## Workflows

Step Functions is a candidate workflow adapter, but workflow semantics will not be stabilized from AWS alone. Cloudflare Workflows or Temporal must exercise the same higher-level contract before portability is claimed.
