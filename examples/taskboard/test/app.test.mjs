import test from "node:test"
import assert from "node:assert/strict"
import { createTestClient } from "@arc/testing"
import application from "../dist/app.js"

function client() {
  return createTestClient(application)
}

test("reads a task through the application-facing API", async () => {
  const response = await client().get("/tasks/task-1")

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    id: "task-1",
    title: "Ship the first Arc app",
    completed: false
  })
})

test("creates a task with concise JSON test ergonomics", async () => {
  const response = await client().post("/tasks", {
    json: { title: "Drive Arc with executable examples" }
  })

  assert.equal(response.status, 201)
  assert.deepEqual(await response.json(), {
    id: "task-2",
    title: "Drive Arc with executable examples",
    completed: false
  })
})

test("keeps validation behavior visible from outside the framework", async () => {
  const response = await client().post("/tasks", {
    json: { title: "" }
  })

  assert.equal(response.status, 400)
  const payload = await response.json()
  assert.equal(payload.error, "Validation failed")
  assert.deepEqual(payload.issues[0].path, ["title"])
})
