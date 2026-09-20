import type { JobIdempotencyClaim, JobIdempotencyStore } from "@arc/core"

export interface DynamoDbDocumentItem {
  readonly key: string
  readonly state: "processing" | "completed"
  readonly token: string
  readonly leaseExpiresAt?: number
  readonly expiresAt?: number
}

export interface DynamoDbPutInput {
  readonly TableName: string
  readonly Item: Readonly<Record<string, unknown>>
  readonly ConditionExpression: string
  readonly ExpressionAttributeNames: Readonly<Record<string, string>>
  readonly ReturnValuesOnConditionCheckFailure: "ALL_OLD"
}

export interface DynamoDbGetInput {
  readonly TableName: string
  readonly Key: Readonly<Record<string, unknown>>
  readonly ConsistentRead: true
}

export interface DynamoDbUpdateInput {
  readonly TableName: string
  readonly Key: Readonly<Record<string, unknown>>
  readonly UpdateExpression: string
  readonly ConditionExpression: string
  readonly ExpressionAttributeNames: Readonly<Record<string, string>>
  readonly ExpressionAttributeValues: Readonly<Record<string, unknown>>
  readonly ReturnValuesOnConditionCheckFailure: "ALL_OLD"
}

export interface DynamoDbDeleteInput {
  readonly TableName: string
  readonly Key: Readonly<Record<string, unknown>>
  readonly ConditionExpression: string
  readonly ExpressionAttributeNames: Readonly<Record<string, string>>
  readonly ExpressionAttributeValues: Readonly<Record<string, unknown>>
  readonly ReturnValuesOnConditionCheckFailure: "ALL_OLD"
}

export interface DynamoDbDocumentOperations {
  put(input: DynamoDbPutInput): Promise<void>
  get(input: DynamoDbGetInput): Promise<{ readonly Item?: Readonly<Record<string, unknown>> }>
  update(input: DynamoDbUpdateInput): Promise<void>
  delete(input: DynamoDbDeleteInput): Promise<void>
  isConditionalCheckFailed(error: unknown): boolean
}

export interface DynamoDbIdempotencyOptions {
  readonly tableName: string
  readonly keyAttribute?: string
  readonly keyPrefix?: string
  readonly now?: () => number
  readonly token?: () => string
}

function asItem(item: Readonly<Record<string, unknown>> | undefined): DynamoDbDocumentItem | undefined {
  if (!item) return undefined
  if (typeof item.key !== "string" || (item.state !== "processing" && item.state !== "completed") || typeof item.token !== "string") {
    return undefined
  }
  return {
    key: item.key,
    state: item.state,
    token: item.token,
    ...(typeof item.leaseExpiresAt === "number" ? { leaseExpiresAt: item.leaseExpiresAt } : {}),
    ...(typeof item.expiresAt === "number" ? { expiresAt: item.expiresAt } : {})
  }
}

function classify(item: DynamoDbDocumentItem | undefined, nowMs: number): JobIdempotencyClaim | "takeover" {
  if (!item) return "takeover"
  if (item.state === "completed") {
    if (item.expiresAt !== undefined && item.expiresAt * 1000 <= nowMs) return "takeover"
    return { acquired: false, state: "completed" }
  }

  const lease = item.leaseExpiresAt ?? 0
  if (lease <= nowMs) return "takeover"
  return {
    acquired: false,
    state: "processing",
    retryAfterSeconds: Math.max(1, Math.ceil((lease - nowMs) / 1000))
  }
}

export function createDynamoDbIdempotencyStore(
  operations: DynamoDbDocumentOperations,
  options: DynamoDbIdempotencyOptions
): JobIdempotencyStore {
  const keyAttribute = options.keyAttribute ?? "id"
  const now = options.now ?? Date.now
  const tokenFactory = options.token ?? (() => crypto.randomUUID())
  const storageKey = (key: string) => `${options.keyPrefix ?? "arc#"}${key}`
  const keyOf = (key: string) => ({ [keyAttribute]: storageKey(key) })

  async function read(key: string): Promise<DynamoDbDocumentItem | undefined> {
    const result = await operations.get({
      TableName: options.tableName,
      Key: keyOf(key),
      ConsistentRead: true
    })
    if (!result.Item) return undefined
    return asItem({
      key: typeof result.Item[keyAttribute] === "string" ? String(result.Item[keyAttribute]) : storageKey(key),
      state: result.Item.state,
      token: result.Item.token,
      leaseExpiresAt: result.Item.leaseExpiresAt,
      expiresAt: result.Item.expiresAt
    })
  }

  return {
    async claim(key, claimOptions): Promise<JobIdempotencyClaim> {
      const timestamp = now()
      const token = tokenFactory()
      const leaseExpiresAt = timestamp + claimOptions.leaseSeconds * 1000
      const pk = storageKey(key)

      try {
        await operations.put({
          TableName: options.tableName,
          Item: {
            [keyAttribute]: pk,
            state: "processing",
            token,
            leaseExpiresAt
          },
          ConditionExpression: "attribute_not_exists(#key)",
          ExpressionAttributeNames: { "#key": keyAttribute },
          ReturnValuesOnConditionCheckFailure: "ALL_OLD"
        })
        return { acquired: true, token }
      } catch (error) {
        if (!operations.isConditionalCheckFailed(error)) throw error
      }

      const current = await read(key)
      const currentState = classify(current, timestamp)
      if (currentState !== "takeover") return currentState

      try {
        await operations.update({
          TableName: options.tableName,
          Key: keyOf(key),
          UpdateExpression: "SET #state = :processing, #token = :token, #lease = :lease REMOVE #expires",
          ConditionExpression: "(#state = :processing AND #lease <= :now) OR (#state = :completed AND #expires <= :nowSeconds)",
          ExpressionAttributeNames: {
            "#state": "state",
            "#token": "token",
            "#lease": "leaseExpiresAt",
            "#expires": "expiresAt"
          },
          ExpressionAttributeValues: {
            ":processing": "processing",
            ":completed": "completed",
            ":token": token,
            ":lease": leaseExpiresAt,
            ":now": timestamp,
            ":nowSeconds": Math.floor(timestamp / 1000)
          },
          ReturnValuesOnConditionCheckFailure: "ALL_OLD"
        })
        return { acquired: true, token }
      } catch (error) {
        if (!operations.isConditionalCheckFailed(error)) throw error
        const raced = classify(await read(key), now())
        if (raced === "takeover") {
          return { acquired: false, state: "processing", retryAfterSeconds: 1 }
        }
        return raced
      }
    },

    async complete(key, token, completeOptions = {}) {
      const timestamp = now()
      const values: Record<string, unknown> = {
        ":processing": "processing",
        ":completed": "completed",
        ":token": token
      }
      let updateExpression = "SET #state = :completed REMOVE #lease"
      if (completeOptions.ttlSeconds !== undefined) {
        values[":expires"] = Math.floor(timestamp / 1000) + completeOptions.ttlSeconds
        updateExpression = "SET #state = :completed, #expires = :expires REMOVE #lease"
      } else {
        updateExpression = "SET #state = :completed REMOVE #lease, #expires"
      }

      try {
        await operations.update({
          TableName: options.tableName,
          Key: keyOf(key),
          UpdateExpression: updateExpression,
          ConditionExpression: "#state = :processing AND #token = :token",
          ExpressionAttributeNames: {
            "#state": "state",
            "#token": "token",
            "#lease": "leaseExpiresAt",
            "#expires": "expiresAt"
          },
          ExpressionAttributeValues: values,
          ReturnValuesOnConditionCheckFailure: "ALL_OLD"
        })
        return true
      } catch (error) {
        if (operations.isConditionalCheckFailed(error)) return false
        throw error
      }
    },

    async release(key, token) {
      try {
        await operations.delete({
          TableName: options.tableName,
          Key: keyOf(key),
          ConditionExpression: "#state = :processing AND #token = :token",
          ExpressionAttributeNames: {
            "#state": "state",
            "#token": "token"
          },
          ExpressionAttributeValues: {
            ":processing": "processing",
            ":token": token
          },
          ReturnValuesOnConditionCheckFailure: "ALL_OLD"
        })
        return true
      } catch (error) {
        if (operations.isConditionalCheckFailed(error)) return false
        throw error
      }
    }
  }
}
