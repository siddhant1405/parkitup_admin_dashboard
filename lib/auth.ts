// Placeholder auth. Matches the SESSION_COOKIE name in proxy.ts.
export function setSessionCookie() {
  document.cookie = "parkitup_admin_session=1; path=/; max-age=" + 60 * 60 * 24 * 7;
}
