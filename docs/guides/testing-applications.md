---
title: Testing applications
description: Outside-in TDD for Arc applications with the in-memory runtime and application test client.
---

# Testing applications

Arc application tests should exercise the same public application definition that production runtimes execute.

Use `createTestClient()` for concise HTTP-level acceptance tests:

```js
import test from "node:test"
import assert from "node:assert/strict"
import { createTestClient } from "@arc/testing"
import application from "../dist/app.js"

test("creates a task", async () => {
  const client = createTestClient(application)

  const response = await client.post("/tasks", {
    json: { title: "Ship it" }
  })

  assert.equal(response.status, 201)
  assert.deepEqual(await response.json(), {
    id: "task-2",
    title: "Ship it",
    completed: false
  })
})
```

The client runs against Arc's memory runtime. It is intentionally an HTTP boundary, not a handler shortcut, so routing, input validation, authorization, capability resolution, output validation and framework errors remain observable.

## Development loop

For public framework behavior:

1. change the desired example/API first;
2. add an outside-in acceptance test that fails;
3. implement the smallest coherent framework change;
4. add a shared runtime/provider contract when portability is part of the claim;
5. run `npm run verify`;
6. update canonical docs and graph fixtures when semantics change.

The small executable reference is `examples/taskboard`. The broader integration suite remains `examples/hello-world`.
