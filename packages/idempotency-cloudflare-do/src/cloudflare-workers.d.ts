declare module "cloudflare:workers" {
  export class DurableObject<Env = unknown> {
    protected readonly ctx: unknown
    protected readonly env: Env
    constructor(ctx: unknown, env: Env)
  }
}
