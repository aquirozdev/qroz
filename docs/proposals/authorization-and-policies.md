---
title: Proposal — authorization and policies
description: Planned portable identity, authorization and agent-capability model.
---

# Proposal — authorization and policies

Status: **planned**.

## Goal

Keep authentication providers replaceable while making authorization visible in the Application Model.

Possible application shape:

```ts
export const updatePost = endpoint({
  auth: required(),
  authorize: [can("posts.update")],
  // ...
})
```

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

## Evidence required

Prototype at least two auth integrations and define testable behavior for missing/invalid identity, permission denial and machine-to-machine principals before stabilizing the API.
