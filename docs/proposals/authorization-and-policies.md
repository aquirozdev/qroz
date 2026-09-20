---
title: Proposal — authorization and policies
description: Planned portable identity, authorization and agent-capability model.
---

# Proposal — authorization and policies

Status: **experimental / partially implemented**.

## Goal

Keep authentication providers replaceable while making authorization visible in the Application Model.

Current application shape:

```ts
export const updatePost = endpoint({
  auth: {
    permissions: ["posts.update"],
    policies: [{
      name: "posts.owner",
      evaluate({ principal, input }) {
        return principal.id === input.params.authorId
      }
    }]
  },
  // ...
})
```

HTTP runtimes can resolve identity through a portable `authenticate(request) -> Principal | undefined` hook. The `@arc/auth` package currently demonstrates bearer-credential and cookie-session mechanisms with application-supplied verification/resolution.

## Model candidates

A runtime resolves a principal:

```ts
interface Principal {
  id: string
  roles?: string[]
  permissions?: string[]
  claims?: Record<string, unknown>
}
```

Policies should describe semantic permissions independently from Clerk/Auth0/Cognito/Better Auth.

## Application Graph

Potential metadata:

- authentication required/optional;
- required permissions/policies;
- principal type;
- resource ownership conditions where statically expressible.

## Agent relationship

The same capability vocabulary may later authorize mutating MCP tools, but end-user authorization and agent authorization should remain distinct policy domains.

## Current evidence

- missing identity returns ARC3001 / HTTP 401 for protected endpoints;
- permission or policy denial returns ARC3002 / HTTP 403;
- named policies evaluate after route/query/body validation and are represented in the Application Graph;
- bearer and cookie-session mechanisms exercise two HTTP credential shapes without coupling Arc to a specific identity vendor;
- Cloudflare and AWS HTTP adapters can resolve principals per invocation;
- HTTP runtimes can emit structured allow/deny decisions for authentication, permissions and policies without copying arbitrary principal claims into the audit record.

## Still required before stabilization

- at least two real external identity-provider integrations;
- explicit invalid/expired credential semantics;
- machine-to-machine integration evidence beyond synthetic principals;
- policy composition semantics beyond all-of named policies;
- durable authorization audit sinks/export adapters and retention guidance;
- agent authorization/approval/audit rules;
- a compatibility policy for principal claims and policy metadata.
