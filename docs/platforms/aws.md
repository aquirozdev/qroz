---
title: AWS platform
description: AWS portability work for Lambda, API Gateway, SQS, S3, DynamoDB idempotency and tracing.
---

# AWS platform

AWS is Qroz's second-cloud portability proof.

Status: **v0.8 in progress**.

## Implemented contract layer

- API Gateway HTTP API v2 → Web Request/Response adapter;
- SQS producer mapping with 10-message chunking and 0–900 second standard-queue delay validation;
- SQS Lambda consumer mapping Qroz retry outcomes to `batchItemFailures`;
- S3 Object Storage adapter preserving streaming reads;
- DynamoDB lease-based idempotency adapter using conditional put/update/delete semantics.

These remain pre-production adapters. Qroz now validates the AWS SDK v3 integration against Floci 2.1.0 in CI for S3, SQS and DynamoDB. That is stronger than interface-only testing, but it is still emulator evidence rather than a claim of production AWS equivalence.

## DynamoDB idempotency model

```text
claim
  ├─ conditional PutItem if absent
  └─ conditional UpdateItem if lease/logical TTL expired

complete
  └─ conditional UpdateItem where token still owns processing claim

release
  └─ conditional DeleteItem where token still owns processing claim
```

DynamoDB TTL is treated as asynchronous physical cleanup only. Qroz uses the stored expiration timestamp logically so an expired completed item can be reclaimed even before DynamoDB deletes it.

## Next gates

1. keep S3/SQS/DynamoDB green through AWS SDK v3 + Floci;
2. extend Floci coverage to Lambda + API Gateway v2 using its Docker-backed Lambda runtime;
3. add AWS tracing bridge;
4. derive IAM requirements from execution-surface capabilities;
5. reserve real-AWS testing for semantics that cannot be established with contracts, the official SDK, SAM or Floci.

## Runtime lifecycle difference

AWS Lambda encourages reuse of SDK/database clients across warm invocations where safe. This differs from integrations such as Cloudflare Hyperdrive that motivated invocation-scoped providers.

Qroz therefore treats lifecycle as a platform/provider decision, not a universal DI scope rule.

See [AWS v0.8 research](../research/2026-09-aws-v08.md).
