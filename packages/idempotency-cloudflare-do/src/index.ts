import type { JobIdempotencyClaim, JobIdempotencyStore } from "@arc/core"

export interface DurableObjectStubLike {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>
}

export interface DurableObjectNamespaceLike {
  getByName?(name: string): DurableObjectStubLike
  idFromName?(name: string): { toString(): string }
  get?(id: { toString(): string }): DurableObjectStubLike
}

export interface DurableObjectStorageKvLike {
  get<T = unknown>(key: string): T | undefined
  put(key: string, value: unknown): void
  delete(key: string): boolean
}

export interface DurableObjectStateLike {
  readonly storage: { readonly kv: DurableObjectStorageKvLike }
}

interface StoredClaim {
  state: "processing" | "completed"
  token: string
  leaseExpiresAt: number
  expiresAt?: number
}

/**
 * Storage-side implementation intended to live inside a SQLite-backed Durable Object.
 * Its synchronous KV operations are atomic within a Durable Object event.
 */
export class ArcIdempotencyDurableObjectLogic {
  constructor(private readonly state: DurableObjectStateLike) {}

  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 })
    const body = await request.json() as Record<string, unknown>
    const operation = body.operation
    const key = typeof body.key === "string" ? body.key : ""
    if (!key) return Response.json({ error: "invalid-key" }, { status: 400 })

    const storage = this.state.storage.kv
    const now = Date.now()
    let current = storage.get<StoredClaim>(key)
    if (current?.expiresAt !== undefined && current.expiresAt <= now) {
      storage.delete(key)
      current = undefined
    }

    if (operation === "claim") {
      const leaseSeconds = Number(body.leaseSeconds)
      if (!Number.isFinite(leaseSeconds) || leaseSeconds <= 0) return Response.json({ error: "invalid-lease" }, { status: 400 })
      if (current?.state === "completed") return Response.json({ acquired: false, state: "completed" })
      if (current?.state === "processing" && current.leaseExpiresAt > now) {
        return Response.json({
          acquired: false,
          state: "processing",
          retryAfterSeconds: Math.max(1, Math.ceil((current.leaseExpiresAt - now) / 1000))
        })
      }
      const token = crypto.randomUUID()
      storage.put(key, { state: "processing", token, leaseExpiresAt: now + leaseSeconds * 1000 } satisfies StoredClaim)
      return Response.json({ acquired: true, token })
    }

    const token = typeof body.token === "string" ? body.token : ""
    if (!token || !current || current.state !== "processing" || current.token !== token) {
      return Response.json({ ok: false })
    }

    if (operation === "complete") {
      const ttlSeconds = body.ttlSeconds === undefined ? undefined : Number(body.ttlSeconds)
      storage.put(key, {
        state: "completed",
        token,
        leaseExpiresAt: current.leaseExpiresAt,
        ...(ttlSeconds === undefined || !Number.isFinite(ttlSeconds) ? {} : { expiresAt: now + ttlSeconds * 1000 })
      } satisfies StoredClaim)
      return Response.json({ ok: true })
    }

    if (operation === "release") {
      storage.delete(key)
      return Response.json({ ok: true })
    }

    return Response.json({ error: "unknown-operation" }, { status: 400 })
  }
}

export function createDurableObjectIdempotencyStore(namespace: DurableObjectNamespaceLike, scope = "arc-idempotency"): JobIdempotencyStore {
  const stubFor = (key: string) => {
    const name = `${scope}:${key}`
    if (namespace.getByName) return namespace.getByName(name)
    if (namespace.idFromName && namespace.get) return namespace.get(namespace.idFromName(name))
    throw new Error("Durable Object namespace must expose getByName() or idFromName()+get()")
  }
  const call = async <T>(key: string, payload: Record<string, unknown>): Promise<T> => {
    const response = await stubFor(key).fetch("https://arc.internal/idempotency", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key, ...payload })
    })
    if (!response.ok) throw new Error(`Arc idempotency Durable Object returned HTTP ${response.status}`)
    return await response.json() as T
  }

  return {
    async claim(key, options): Promise<JobIdempotencyClaim> {
      return call<JobIdempotencyClaim>(key, { operation: "claim", leaseSeconds: options.leaseSeconds })
    },
    async complete(key, token, options = {}) {
      const result = await call<{ ok: boolean }>(key, { operation: "complete", token, ...(options.ttlSeconds === undefined ? {} : { ttlSeconds: options.ttlSeconds }) })
      return result.ok
    },
    async release(key, token) {
      const result = await call<{ ok: boolean }>(key, { operation: "release", token })
      return result.ok
    }
  }
}
