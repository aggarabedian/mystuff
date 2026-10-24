/**
 * Profile display helpers
 */

/**
 * Compute initials from first and last names.
 * Falls back to Auth0 name or email if first/last names are not present.
 */
export function getInitials(
  firstName?: string | null,
  lastName?: string | null,
  fallback?: string | null
): string {
  const f = firstName?.trim();
  const l = lastName?.trim();

  if (f && l) {
    return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
  }
  if (f) {
    return f.slice(0, 2).toUpperCase();
  }
  if (l) {
    return l.slice(0, 2).toUpperCase();
  }
  if (fallback?.trim()) {
    const parts = fallback.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return fallback.trim().charAt(0).toUpperCase();
  }
  return "U";
}

/**
 * Format a full display name.
 * Uses firstName and lastName if set, otherwise falls back to Auth0 profile name/email.
 */
export function getDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  fallback?: string | null
): string {
  const f = firstName?.trim();
  const l = lastName?.trim();

  if (f && l) {
    return `${f} ${l}`;
  }
  if (f) return f;
  if (l) return l;
  if (fallback?.trim()) return fallback.trim();
  return "Signed in user";
}
