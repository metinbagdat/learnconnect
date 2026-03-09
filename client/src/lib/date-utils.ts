/**
 * Returns a date as a "YYYY-MM-DD" string in the user's **local** timezone.
 *
 * @param date - The date to format. Defaults to today (`new Date()`).
 *
 * Using `date.toISOString()` would return the UTC date, which can differ
 * from the local date near midnight – so we build the string manually instead.
 */
export function getLocalDateString(date?: Date): string {
  const now = date ?? new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
