/**
 * Returns a stable string identifier for a user.
 * Uses `id` first (numeric primary key) and falls back to `username`.
 *
 * Callers are expected to guard against unauthenticated state before calling
 * this function (e.g. `if (!user?.id && !user?.username) return`), so an
 * empty string return value should never reach Firestore.
 */
export function getUserId(user: { id?: number | string; username?: string } | null | undefined): string {
  return String(user?.id || user?.username || '');
}
