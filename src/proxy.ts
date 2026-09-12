import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

const authMiddleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token as { role?: string } | null;
    const { pathname } = req.nextUrl;

    // /admin/login is public
    if (pathname === "/admin/login") return;

    // Buyer dashboard: USER only. Admin gets bounced to /admin.
    if (pathname.startsWith("/dashboard")) {
      if (!token) return NextResponse.redirect(new URL("/login", req.url));
      if (token.role !== "USER") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return;
    }

    // Admin panel: everything under /admin requires SUPER_ADMIN
    if (pathname.startsWith("/admin")) {
      if (!token || token.role !== "SUPER_ADMIN") {
        if (token && token.role === "USER") {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
      return;
    }
  },
  {
    callbacks: { authorized: () => true },
  }
);

function contentSecurityPolicy(nonce: string): string {
  const isDev = process.env.NODE_ENV !== "production";
  const directives = [
    "default-src 'self'",
    // strict-dynamic lets the nonced Next.js bootstrap create its own chunks
    // (and the analytics script injected at runtime); unsafe-eval is dev-only.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://utfs.io https://*.utfs.io https://uploadthing.com https://*.uploadthing.com https://ufs.sh https://*.ufs.sh",
    "font-src 'self'",
    "connect-src 'self' https://sentry.io https://*.sentry.io https://*.uploadthing.com https://uploadthing.com https://ufs.sh https://*.ufs.sh https://utfs.io https://*.utfs.io",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ];
  if (!isDev) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

export default async function proxy(req: NextRequest, event: NextFetchEvent) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = contentSecurityPolicy(nonce);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next.js extracts the nonce from the request CSP header and applies it to
  // the framework/bootstrap scripts it renders (requires dynamic rendering).
  requestHeaders.set("content-security-policy", csp);

  // withAuth mutates the request to attach `nextauth.token`; it returns a
  // redirect for gated routes, otherwise undefined (pass-through).
  const authResponse = (await authMiddleware(
    req as Parameters<typeof authMiddleware>[0],
    event
  )) as NextResponse | undefined;

  // Auth redirect (not signed in / wrong role): keep it, just tag the header.
  if (
    authResponse &&
    authResponse.status >= 300 &&
    authResponse.status < 400
  ) {
    authResponse.headers.set("content-security-policy", csp);
    return authResponse;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // next-auth may refresh the session cookie while resolving the token.
  const authHeaders = authResponse?.headers as
    | (Headers & { getSetCookie?: () => string[] })
    | undefined;
  for (const cookie of authHeaders?.getSetCookie?.() ?? []) {
    response.headers.append("set-cookie", cookie);
  }

  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|ingest|.*\\.(?:png|jpe?g|gif|svg|webp|ico|woff2?|ttf|otf|txt|xml|json|webmanifest)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
