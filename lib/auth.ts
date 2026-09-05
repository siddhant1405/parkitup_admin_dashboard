// Placeholder auth. Matches the SESSION_COOKIE name in proxy.ts. The 7-day max-age is
// fixed regardless of the login form's "Remember me" checkbox — that checkbox is
// purely decorative for now (see app/login/page.tsx), since there's no real session
// concept yet to give it a shorter vs. longer lifetime.
export function setSessionCookie() {
  document.cookie = "parkitup_admin_session=1; path=/; max-age=" + 60 * 60 * 24 * 7;
}
