/** Server-only: comma-separated emails in POWER_USER_EMAILS (case-insensitive). */
export function isPowerUser(email: string | null | undefined): boolean {
  if (!email) return false;

  const allowlist = process.env.POWER_USER_EMAILS;
  if (!allowlist?.trim()) return false;

  const normalized = email.trim().toLowerCase();
  return allowlist
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
}