---
title: Getting started
description: The shortest path to understanding and using Arc.
---

# Getting started

Arc is a portable TypeScript application framework for serverless and distributed systems. It aims for Laravel-level application ergonomics while keeping runtime, cloud, ORM and infrastructure providers replaceable.

The intended first application shape is deliberately small:

```ts
export default app({
  name: "acme",
  modules: [users, billing]
})
```

A module exposes application primitives:

```ts
export const users = module({
  name: "users",
  endpoints: { createUser, getUser },
  jobs: { SendWelcomeEmail }
})
```

An endpoint explicitly declares its dependencies and effects:

```ts
export const createUser = endpoint({
  method: "POST",
  path: "/users",
  input: { body: CreateUser },
  output: User,
  requires: [usersDatabase],
  emits: [UserCreated],
  dispatches: [SendWelcomeEmail],

  async handler(ctx) {
    const db = ctx.use(usersDatabase)
    const user = await createUserRecord(db, ctx.input.body)
    await ctx.events.emit(UserCreated, { id: user.id })
    await ctx.jobs.dispatch(SendWelcomeEmail, { userId: user.id })
    return user
  }
})
```

Those declarations are executable application metadata. Arc uses them both to run the request and to build an Application Graph for tooling, agents, tests and future deployment planning.

## Learn in this order

1. [Mental model](./mental-model.md)
2. [Application Model](../concepts/application-model.md)
3. [Capabilities and providers](../concepts/capabilities-and-providers.md)
4. [Events, jobs and workflows](../concepts/effects-events-jobs-workflows.md)
5. [Execution surfaces](../concepts/execution-surfaces.md)
6. [System architecture](../architecture/system-overview.md)
7. [Package map](../reference/package-map.md)

The current runnable example lives in `examples/hello-world`.
