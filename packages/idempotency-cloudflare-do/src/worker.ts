import { DurableObject } from "cloudflare:workers"
import { ArcIdempotencyDurableObjectLogic, type DurableObjectStateLike } from "./index.js"

/**
 * Real Cloudflare Durable Object host for Qroz's idempotency state machine.
 * The namespace must be configured with SQLite storage.
 */
export class ArcIdempotencyDurableObject extends DurableObject {
  readonly #logic: ArcIdempotencyDurableObjectLogic

  constructor(ctx: unknown, env: unknown) {
    super(ctx, env)
    this.#logic = new ArcIdempotencyDurableObjectLogic(ctx as DurableObjectStateLike)
  }

  fetch(request: Request): Promise<Response> {
    return this.#logic.fetch(request)
  }
}
