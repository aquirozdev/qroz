import type { MaybePromise, Principal } from "@qroz/core"

export interface Authenticator {
  authenticate(request: Request): MaybePromise<Principal | undefined>
}

export type PrincipalVerifier = (
  credential: string,
  request: Request
) => MaybePromise<Principal | undefined>

export interface BearerAuthenticatorOptions {
  readonly verify: PrincipalVerifier
}

export function bearerAuthenticator(options: BearerAuthenticatorOptions): Authenticator {
  return {
    async authenticate(request) {
      const authorization = request.headers.get("authorization")
      if (!authorization) return undefined
      const match = /^Bearer\s+(.+)$/i.exec(authorization)
      if (!match?.[1]) return undefined
      return options.verify(match[1], request)
    }
  }
}

function cookieValue(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie")
  if (!header) return undefined

  for (const item of header.split(";")) {
    const separator = item.indexOf("=")
    if (separator === -1) continue
    const key = item.slice(0, separator).trim()
    if (key !== name) continue
    const raw = item.slice(separator + 1).trim()
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }

  return undefined
}

export interface CookieSessionAuthenticatorOptions {
  readonly cookie: string
  readonly resolve: PrincipalVerifier
}

export function cookieSessionAuthenticator(options: CookieSessionAuthenticatorOptions): Authenticator {
  return {
    async authenticate(request) {
      const session = cookieValue(request, options.cookie)
      if (!session) return undefined
      return options.resolve(session, request)
    }
  }
}

export function composeAuthenticators(...authenticators: readonly Authenticator[]): Authenticator {
  return {
    async authenticate(request) {
      for (const authenticator of authenticators) {
        const principal = await authenticator.authenticate(request)
        if (principal) return principal
      }
      return undefined
    }
  }
}

export function authenticateWith(authenticator: Authenticator) {
  return (request: Request) => authenticator.authenticate(request)
}
