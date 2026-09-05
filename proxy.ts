// Next.js 16 route-guard convention (replaces middleware.ts). Placeholder
// auth gate: no real credential check yet, just a session cookie set by the
// login page's "Continue" action.
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
