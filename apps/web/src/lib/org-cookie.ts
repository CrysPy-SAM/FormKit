export const ACTIVE_ORG_COOKIE = "active_org_id";

export function getActiveOrgIdClient(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${ACTIVE_ORG_COOKIE}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]!) : null;
}

export function setActiveOrgIdClient(orgId: string) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${ACTIVE_ORG_COOKIE}=${encodeURIComponent(orgId)}; path=/; max-age=${maxAge}; samesite=lax`;
}
