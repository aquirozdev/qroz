import type { AppDefinition } from "@qroz/core"
import { createMemoryRuntime, type ArcRuntime, type MemoryRuntimeOptions } from "@qroz/runtime-memory"

export function createTestRuntime(application: AppDefinition, options: MemoryRuntimeOptions = {}) {
  return createMemoryRuntime(application, options)
}

export interface TestClientOptions extends MemoryRuntimeOptions {
  baseUrl?: string
}

export interface TestRequestOptions extends Omit<RequestInit, "method" | "body"> {
  body?: BodyInit | null
  json?: unknown
}

export interface TestClient {
  request(path: string, method: string, options?: TestRequestOptions): Promise<Response>
  get(path: string, options?: TestRequestOptions): Promise<Response>
  post(path: string, options?: TestRequestOptions): Promise<Response>
  put(path: string, options?: TestRequestOptions): Promise<Response>
  patch(path: string, options?: TestRequestOptions): Promise<Response>
  delete(path: string, options?: TestRequestOptions): Promise<Response>
}

export function createTestClient(application: AppDefinition, options: TestClientOptions = {}): TestClient {
  const { baseUrl = "https://app.test", ...runtimeOptions } = options
  const runtime = createTestRuntime(application, runtimeOptions)

  async function request(path: string, method: string, requestOptions: TestRequestOptions = {}) {
    const { json, body, headers: inputHeaders, ...init } = requestOptions
    const headers = new Headers(inputHeaders)
    const requestBody = json === undefined ? body : JSON.stringify(json)

    if (json !== undefined && !headers.has("content-type")) {
      headers.set("content-type", "application/json")
    }

    return runtime.fetch(new Request(new URL(path, baseUrl), {
      ...init,
      method,
      headers,
      ...(requestBody === undefined ? {} : { body: requestBody })
    }))
  }

  return {
    request,
    get(path, requestOptions) {
      return request(path, "GET", requestOptions)
    },
    post(path, requestOptions) {
      return request(path, "POST", requestOptions)
    },
    put(path, requestOptions) {
      return request(path, "PUT", requestOptions)
    },
    patch(path, requestOptions) {
      return request(path, "PATCH", requestOptions)
    },
    delete(path, requestOptions) {
      return request(path, "DELETE", requestOptions)
    }
  }
}

export async function probeRuntimeContract(runtime: ArcRuntime) {
  const notFound = await runtime.fetch(new Request("https://app.test/__arc_missing__"))
  if (notFound.status !== 404) {
    throw new Error(`Runtime contract failed: expected 404, got ${notFound.status}`)
  }

  const notAllowed = await runtime.fetch(new Request("https://app.test/users/123", { method: "POST" }))
  if (notAllowed.status !== 405) {
    throw new Error(`Runtime contract failed: expected 405, got ${notAllowed.status}`)
  }

  return { notFound: true, methodNotAllowed: true }
}
