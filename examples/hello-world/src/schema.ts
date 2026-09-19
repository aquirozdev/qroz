import type { StandardSchemaLike } from "@arc/core"

type Issue = { message: string; path?: readonly unknown[] }

export function string(options: { min?: number } = {}): StandardSchemaLike<unknown, string> {
  return {
    "~standard": {
      version: 1,
      vendor: "arc-example",
      validate(value) {
        const issues: Issue[] = []
        if (typeof value !== "string") issues.push({ message: "Expected string" })
        if (typeof value === "string" && options.min !== undefined && value.length < options.min) {
          issues.push({ message: `Expected at least ${options.min} character(s)` })
        }
        return issues.length ? { issues } : { value: value as string }
      }
    }
  }
}

export function object<const Shape extends Record<string, StandardSchemaLike<any, any>>>(shape: Shape): StandardSchemaLike<unknown, { [K in keyof Shape]: Shape[K] extends StandardSchemaLike<any, infer O> ? O : never }> {
  return {
    "~standard": {
      version: 1,
      vendor: "arc-example",
      async validate(value) {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          return { issues: [{ message: "Expected object" }] }
        }
        const output: Record<string, unknown> = {}
        const issues: Issue[] = []
        for (const [key, schema] of Object.entries(shape)) {
          const result = await schema["~standard"].validate((value as Record<string, unknown>)[key])
          if (result.issues) {
            issues.push(...result.issues.map((issue) => ({ ...issue, path: [key, ...(issue.path ?? [])] })))
          } else {
            output[key] = result.value
          }
        }
        return issues.length ? { issues } : { value: output as any }
      }
    }
  }
}
