---
title: Runtime model
description: Portable execution boundary and responsibilities of runtime adapters.
---

# Runtime model

Arc's runtime layering is intentionally narrow.

```text
@arc/core
   │
   ▼
@arc/runtime-web
   │
   ├── @arc/runtime-memory
   └── @arc/runtime-cloudflare
```

The portable interface is conceptually:

```ts
interface Runtime<Context> {
  fetch(request: Request, context?: Context): Promise<Response>
}
```

## Runtime Web owns

- route selection;
- Standard Schema input validation;
- capability access enforcement;
- application event/job interfaces;
- semantic tracing hooks;
- output validation;
- framework error conversion.

## Platform adapter owns

- platform invocation shape;
- binding/resource provider creation;
- provider lifecycle;
- platform-native tracing bridge;
- provider-specific execution constraints.

## Why not wrap the platform completely

Arc wants application portability, not platform denial. A runtime adapter should be thin enough that platform-native behavior remains understandable and reachable.
