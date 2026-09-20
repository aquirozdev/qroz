import test from "node:test"
import assert from "node:assert/strict"

import { createDynamoDbIdempotencyStore } from "../../../packages/idempotency-dynamodb/dist/index.js"

class ConditionalFailure extends Error {}

function fakeDynamo(nowRef) {
  const items = new Map()
  const calls = []

  return {
    items,
    calls,
    operations: {
      isConditionalCheckFailed(error) { return error instanceof ConditionalFailure },

      async put(input) {
        calls.push({ op: "put", input })
        const keyName = input.ExpressionAttributeNames["#key"]
        const key = input.Item[keyName]
        if (items.has(key)) throw new ConditionalFailure()
        items.set(key, { ...input.Item })
      },

      async get(input) {
        calls.push({ op: "get", input })
        const key = Object.values(input.Key)[0]
        return { Item: items.get(key) }
      },

      async update(input) {
        calls.push({ op: "update", input })
        const key = Object.values(input.Key)[0]
        const item = items.get(key)
        if (!item) throw new ConditionalFailure()

        const values = input.ExpressionAttributeValues
        if (input.ConditionExpression.includes("#lease <= :now")) {
          const takeover =
            (item.state === "processing" && item.leaseExpiresAt <= values[":now"]) ||
            (item.state === "completed" && item.expiresAt !== undefined && item.expiresAt <= values[":nowSeconds"])
          if (!takeover) throw new ConditionalFailure()
          items.set(key, {
            ...item,
            state: "processing",
            token: values[":token"],
            leaseExpiresAt: values[":lease"]
          })
          delete items.get(key).expiresAt
          return
        }

        if (item.state !== "processing" || item.token !== values[":token"]) throw new ConditionalFailure()
        item.state = "completed"
        delete item.leaseExpiresAt
        if (values[":expires"] === undefined) delete item.expiresAt
        else item.expiresAt = values[":expires"]
      },

      async delete(input) {
        calls.push({ op: "delete", input })
        const key = Object.values(input.Key)[0]
        const item = items.get(key)
        const values = input.ExpressionAttributeValues
        if (!item || item.state !== "processing" || item.token !== values[":token"]) throw new ConditionalFailure()
        items.delete(key)
      }
    }
  }
}

test("DynamoDB idempotency store implements claim, duplicate completion and lease takeover", async () => {
  const clock = { value: 1_000_000 }
  let sequence = 0
  const fake = fakeDynamo(clock)
  const store = createDynamoDbIdempotencyStore(fake.operations, {
    tableName: "arc-idempotency",
    now: () => clock.value,
    token: () => `token-${++sequence}`
  })

  const first = await store.claim("order:1", { leaseSeconds: 10 })
  assert.deepEqual(first, { acquired: true, token: "token-1" })
  assert.equal(await store.complete("order:1", "wrong", { ttlSeconds: 60 }), false)
  assert.equal(await store.complete("order:1", "token-1", { ttlSeconds: 60 }), true)
  assert.deepEqual(await store.claim("order:1", { leaseSeconds: 10 }), { acquired: false, state: "completed" })

  clock.value += 61_000
  const afterTtl = await store.claim("order:1", { leaseSeconds: 10 })
  assert.deepEqual(afterTtl, { acquired: true, token: "token-3" })

  const active = await store.claim("order:1", { leaseSeconds: 10 })
  assert.equal(active.acquired, false)
  assert.equal(active.state, "processing")

  clock.value += 11_000
  const takeover = await store.claim("order:1", { leaseSeconds: 10 })
  assert.deepEqual(takeover, { acquired: true, token: "token-5" })

  assert.equal(await store.release("order:1", "token-3"), false)
  assert.equal(await store.release("order:1", "token-5"), true)

  assert.ok(fake.calls.some((call) => call.op === "put" && call.input.ConditionExpression === "attribute_not_exists(#key)"))
  assert.ok(fake.calls.some((call) => call.op === "update" && call.input.ConditionExpression.includes("#lease <= :now")))
  assert.ok(fake.calls.some((call) => call.op === "get" && call.input.ConsistentRead === true))
})
