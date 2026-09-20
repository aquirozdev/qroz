import type { JobIdempotencyClaim, JobIdempotencyStore } from "@qroz/core"

interface Entry {
  state: "processing" | "completed"
  token: string
  leaseExpiresAt: number
  expiresAt?: number
}

export interface MemoryIdempotencyStore extends JobIdempotencyStore {
  readonly entries: ReadonlyMap<string, Readonly<Entry>>
  clear(): void
}

export function createMemoryIdempotencyStore(now: () => number = Date.now): MemoryIdempotencyStore {
  const entries = new Map<string, Entry>()

  function purgeExpired(key: string) {
    const current = entries.get(key)
    if (!current) return
    if (current.expiresAt !== undefined && current.expiresAt <= now()) entries.delete(key)
  }

  return {
    entries,
    clear() { entries.clear() },
    async claim(key, options): Promise<JobIdempotencyClaim> {
      purgeExpired(key)
      const current = entries.get(key)
      const timestamp = now()
      if (current?.state === "completed") return { acquired: false, state: "completed" }
      if (current?.state === "processing" && current.leaseExpiresAt > timestamp) {
        return { acquired: false, state: "processing", retryAfterSeconds: Math.max(1, Math.ceil((current.leaseExpiresAt - timestamp) / 1000)) }
      }
      const token = crypto.randomUUID()
      entries.set(key, {
        state: "processing",
        token,
        leaseExpiresAt: timestamp + options.leaseSeconds * 1000
      })
      return { acquired: true, token }
    },
    async complete(key, token, options = {}) {
      const current = entries.get(key)
      if (!current || current.state !== "processing" || current.token !== token) return false
      entries.set(key, {
        state: "completed",
        token,
        leaseExpiresAt: current.leaseExpiresAt,
        ...(options.ttlSeconds === undefined ? {} : { expiresAt: now() + options.ttlSeconds * 1000 })
      })
      return true
    },
    async release(key, token) {
      const current = entries.get(key)
      if (!current || current.state !== "processing" || current.token !== token) return false
      entries.delete(key)
      return true
    }
  }
}
