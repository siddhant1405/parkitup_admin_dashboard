// Next.js 16 route-guard convention (replaces middleware.ts). Placeholder auth gate:
// this only checks that SESSION_COOKIE is *present*, not that it holds any particular
// value or that the login form's input was ever checked against a real account — see
// setSessionCookie in lib/auth.ts, which sets it unconditionally on any validly
// formatted submission. Swap this file's presence check for real session verification
// (e.g. a signed JWT, or a call to the real backend) once one exists; the redirect
// logic and PUBLIC_PATHS handling below stay the same either way.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "parkitup_admin_session";
const PUBLIC_PATHS = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path)) || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has(SESSION_COOKIE);
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Excludes API routes, Next internals, and static assets (icon.svg is Next's
  // auto-detected favicon route, logo.svg is the header logo in /public) so assets
  // referenced from the login page — itself a public route — aren't redirected to
  // /login before they can load.
  matcher: ["/((?!api|_next/static|_next/image|icon.svg|logo.svg).*)"],
};
