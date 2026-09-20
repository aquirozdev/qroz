---
title: Getting started
description: The shortest path to understanding and using Qroz.
---

# Getting started

Qroz is a portable TypeScript application framework for serverless and distributed systems. It aims for Laravel-level application ergonomics while keeping runtime, cloud, ORM and infrastructure providers replaceable.

The intended first run is deliberately small:

```bash
npm create qroz@latest my-app
cd my-app
npm install
npm run dev
```

The generated dev command is source-first: Qroz accepts `src/app.ts`, uses the application's own TypeScript project, watches emitted JavaScript internally and keeps Qroz Studio on a stable local URL. Developers should not have to coordinate `dist/` paths or a second build watcher.

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

Those declarations are executable application metadata. Qroz uses them both to run the request and to build an Application Graph for tooling, agents, tests and future deployment planning.

## Learn in this order

1. [Mental model](./mental-model.md)
2. [Application Model](../concepts/application-model.md)
3. [Capabilities and providers](../concepts/capabilities-and-providers.md)
4. [Events, jobs and workflows](../concepts/effects-events-jobs-workflows.md)
5. [Execution surfaces](../concepts/execution-surfaces.md)
6. [System architecture](../architecture/system-overview.md)
7. [Testing applications](../guides/testing-applications.md)
8. [Package map](../reference/package-map.md)

Start with `examples/taskboard` for the smallest application-facing example. Use `examples/hello-world` for the broader portability and provider integration suite.
