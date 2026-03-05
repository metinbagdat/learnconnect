/**
 * Returns today's date as a "YYYY-MM-DD" string in the user's **local** timezone.
 *
 * Using `new Date().toISOString()` would return the UTC date, which can differ
 * from the local date near midnight – so we build the string manually instead.
 */
export function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
