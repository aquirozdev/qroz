---
title: AWS platform
description: Planned AWS validation surface for Lambda, SQS, S3, DynamoDB-backed idempotency and least-privilege IAM.
---

# AWS platform

AWS is Arc's next major portability proof. Support is **planned**, not currently implemented.

## Runtime baseline

As of September 2026, AWS Lambda provides managed Node.js 24 on Amazon Linux 2023 and lists Node.js 26 as an upcoming runtime target. Arc's AWS adapter should therefore avoid assumptions tied specifically to Node.js 22.

The portable Arc application layer should remain Web Standards-oriented; the Lambda adapter translates API Gateway/Lambda event shapes at the boundary.

## First target slice

```text
HTTP        → Lambda/API Gateway adapter
Object data → S3
Jobs        → SQS + Lambda consumer
Idempotency → DynamoDB conditional writes (candidate)
Tracing     → OpenTelemetry/X-Ray-compatible bridge
```

## Why SQS matters first

Arc jobs already model at-least-once delivery and per-message outcomes. Lambda's SQS integration supports partial batch failure reporting, which can map naturally to Arc's per-message ack/retry outcome model.

The adapter must test:

- standard queue retries;
- partial batch responses;
- FIFO constraints separately;
- visibility timeout implications;
- DLQ/redrive configuration;
- duplicate delivery/idempotency;
- batch concurrency and ordering expectations.

## IAM

The long-term deployment planner should derive candidate IAM from execution-surface capability requirements and expose the generated policy for review.

## Workflows

Step Functions is a candidate workflow adapter, but workflow semantics will not be stabilized from AWS alone. Cloudflare Workflows or Temporal must exercise the same higher-level contract before portability is claimed.
