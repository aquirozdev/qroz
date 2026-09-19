import type { ArcSpan, ArcTracer, TraceAttribute } from "@arc/telemetry"

export interface CloudflareSpanLike {
  setAttribute(name: string, value: TraceAttribute): void
}

export interface CloudflareTracingLike {
  enterSpan<T>(name: string, callback: (span: CloudflareSpanLike) => T | Promise<T>): T | Promise<T>
}

export function createCloudflareTracer(tracing: CloudflareTracingLike): ArcTracer {
  return {
    async enterSpan(name, attributes, callback) {
      return await tracing.enterSpan(name, async (nativeSpan) => {
        for (const [key, value] of Object.entries(attributes)) nativeSpan.setAttribute(key, value)
        const span: ArcSpan = {
          setAttribute(key, value) { nativeSpan.setAttribute(key, value) }
        }
        return await callback(span)
      })
    }
  }
}
