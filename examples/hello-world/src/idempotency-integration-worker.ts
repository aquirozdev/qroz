import { createDurableObjectIdempotencyStore, type DurableObjectNamespaceLike } from "@arc/idempotency-cloudflare-do"
export { ArcIdempotencyDurableObject } from "@arc/idempotency-cloudflare-do/worker"

interface Env {
  IDEMPOTENCY: DurableObjectNamespaceLike
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname !== "/idempotency") return new Response("Not Found", { status: 404 })

    const key = url.searchParams.get("key") ?? crypto.randomUUID()
    const store = createDurableObjectIdempotencyStore(env.IDEMPOTENCY, "workerd-smoke")
    const first = await store.claim(key, { leaseSeconds: 30 })
    if (!first.acquired) return Response.json({ key, first, error: "first claim was not acquired" }, { status: 500 })
    const completed = await store.complete(key, first.token, { ttlSeconds: 300 })
    const duplicate = await store.claim(key, { leaseSeconds: 30 })

    return Response.json({ key, first: { acquired: first.acquired }, completed, duplicate })
  }
}
