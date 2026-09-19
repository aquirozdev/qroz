export type TraceAttribute = string | number | boolean
export type TraceAttributes = Readonly<Record<string, TraceAttribute>>

export interface ArcSpan {
  setAttribute(name: string, value: TraceAttribute): void
  recordError?(error: unknown): void
}

export interface ArcTracer {
  enterSpan<T>(name: string, attributes: TraceAttributes, callback: (span: ArcSpan) => T | Promise<T>): Promise<T>
}

const noopSpan: ArcSpan = { setAttribute() {} }

export const noopTracer: ArcTracer = Object.freeze({
  async enterSpan<T>(_name: string, _attributes: TraceAttributes, callback: (span: ArcSpan) => T | Promise<T>): Promise<T> {
    return await callback(noopSpan)
  }
})

export interface RecordedSpan {
  readonly name: string
  readonly attributes: Record<string, TraceAttribute>
  readonly errors: unknown[]
}

export function createRecordingTracer(): ArcTracer & { readonly spans: readonly RecordedSpan[] } {
  const spans: RecordedSpan[] = []
  return {
    spans,
    async enterSpan(name, attributes, callback) {
      const recorded: RecordedSpan = { name, attributes: { ...attributes }, errors: [] }
      spans.push(recorded)
      const span: ArcSpan = {
        setAttribute(key, value) { recorded.attributes[key] = value },
        recordError(error) { recorded.errors.push(error) }
      }
      try {
        return await callback(span)
      } catch (error) {
        span.recordError?.(error)
        throw error
      }
    }
  }
}
