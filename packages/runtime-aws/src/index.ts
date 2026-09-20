import { normalizeProviderSource, type AppDefinition, type MaybePromise, type Principal, type ProviderSource } from "@qroz/core"
import { createWebRuntime, type WebExecutionContext } from "@qroz/runtime-web"

export interface ApiGatewayHttpApiV2Event {
  readonly version: "2.0"
  readonly rawPath: string
  readonly rawQueryString?: string
  readonly cookies?: readonly string[]
  readonly headers?: Readonly<Record<string, string | undefined>>
  readonly body?: string
  readonly isBase64Encoded?: boolean
  readonly requestContext: {
    readonly domainName?: string
    readonly http: {
      readonly method: string
      readonly protocol?: string
      readonly sourceIp?: string
    }
  }
}

export interface ApiGatewayHttpApiV2Result {
  readonly statusCode: number
  readonly headers?: Readonly<Record<string, string>>
  readonly cookies?: readonly string[]
  readonly body?: string
  readonly isBase64Encoded?: boolean
}

export interface LambdaContextLike {
  readonly awsRequestId?: string
  readonly functionName?: string
  readonly functionVersion?: string
  readonly invokedFunctionArn?: string
  getRemainingTimeInMillis?(): number
}

export interface AwsRuntimeContext extends WebExecutionContext {
  readonly lambda: LambdaContextLike
  readonly event: ApiGatewayHttpApiV2Event
}

export interface AwsLambdaOptions {
  readonly providers?: (
    event: ApiGatewayHttpApiV2Event,
    context: LambdaContextLike
  ) => MaybePromise<ProviderSource>
  readonly authenticate?: (
    request: Request,
    event: ApiGatewayHttpApiV2Event,
    context: LambdaContextLike
  ) => MaybePromise<Principal | undefined>
  readonly onError?: (error: unknown) => void
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

export function apiGatewayEventToRequest(event: ApiGatewayHttpApiV2Event): Request {
  const headers = new Headers()
  for (const [name, value] of Object.entries(event.headers ?? {})) {
    if (value !== undefined) headers.set(name, value)
  }
  if (event.cookies?.length && !headers.has("cookie")) {
    headers.set("cookie", event.cookies.join("; "))
  }

  const scheme = headers.get("x-forwarded-proto") ?? "https"
  const host = headers.get("host") ?? event.requestContext.domainName ?? "lambda.local"
  const query = event.rawQueryString ? `?${event.rawQueryString}` : ""
  const method = event.requestContext.http.method.toUpperCase()
  const body = event.body === undefined || method === "GET" || method === "HEAD"
    ? undefined
    : event.isBase64Encoded
      ? decodeBase64(event.body)
      : event.body

  return new Request(`${scheme}://${host}${event.rawPath}${query}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body })
  })
}

export async function responseToApiGatewayResult(response: Response): Promise<ApiGatewayHttpApiV2Result> {
  const headers: Record<string, string> = {}
  const cookies: string[] = []
  const getSetCookie = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie

  for (const [name, value] of response.headers.entries()) {
    if (name.toLowerCase() !== "set-cookie") headers[name] = value
  }

  if (typeof getSetCookie === "function") {
    cookies.push(...getSetCookie.call(response.headers))
  } else {
    const setCookie = response.headers.get("set-cookie")
    if (setCookie) cookies.push(setCookie)
  }

  const body = await response.text()
  return {
    statusCode: response.status,
    ...(Object.keys(headers).length ? { headers } : {}),
    ...(cookies.length ? { cookies } : {}),
    ...(body.length ? { body } : {}),
    isBase64Encoded: false
  }
}

export function createAwsLambdaHandler(
  application: AppDefinition,
  options: AwsLambdaOptions = {}
): (event: ApiGatewayHttpApiV2Event, context: LambdaContextLike) => Promise<ApiGatewayHttpApiV2Result> {
  const runtime = createWebRuntime<AwsRuntimeContext>(application, {
    ...(options.onError ? { onError: options.onError } : {})
  })

  return async (event, context) => {
    const scope = normalizeProviderSource(await options.providers?.(event, context))
    const request = apiGatewayEventToRequest(event)
    const principal = await options.authenticate?.(request, event, context)
    const response = await runtime.fetch(request, {
      lambda: context,
      event,
      providers: scope.providers,
      ...(principal ? { principal } : {}),
      ...(scope.dispose ? { dispose: scope.dispose } : {})
    })
    return responseToApiGatewayResult(response)
  }
}
