---
title: AWS platform
description: AWS portability work for Lambda, API Gateway, SQS, S3, DynamoDB idempotency and tracing.
---

# AWS platform

AWS is Arc's second-cloud portability proof.

Status: **v0.8 in progress**.

## Implemented contract layer

- API Gateway HTTP API v2 → Web Request/Response adapter;
- SQS producer mapping with 10-message chunking and 0–900 second standard-queue delay validation;
- SQS Lambda consumer mapping Arc retry outcomes to `batchItemFailures`;
- S3 Object Storage adapter preserving streaming reads;
- DynamoDB lease-based idempotency adapter using conditional put/update/delete semantics.

These remain contract-tested adapters until AWS SDK and real-service gates pass.

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

DynamoDB TTL is treated as asynchronous physical cleanup only. Arc uses the stored expiration timestamp logically so an expired completed item can be reclaimed even before DynamoDB deletes it.

## Next gates

1. bind S3/SQS/DynamoDB adapters to AWS SDK for JavaScript v3;
2. execute representative operations against an AWS-compatible integration environment;
3. add a real AWS environment gate for semantics emulators cannot prove;
4. add AWS tracing bridge;
5. derive IAM requirements from execution-surface capabilities.

## Runtime lifecycle difference

AWS Lambda encourages reuse of SDK/database clients across warm invocations where safe. This differs from integrations such as Cloudflare Hyperdrive that motivated invocation-scoped providers.

Arc therefore treats lifecycle as a platform/provider decision, not a universal DI scope rule.

See [AWS v0.8 research](../research/2026-09-aws-v08.md).
