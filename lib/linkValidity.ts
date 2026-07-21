// Expiry is derived from Project.eventDate + a grace window, not a stored TTL,
// so it can't go stale if the event date changes (see docs/תכנון-ארכיטקטורה-טכנית.md §4).
const GRACE_PERIOD_DAYS = 30;

export function isPastGracePeriod(eventDate: Date | null): boolean {
  if (!eventDate) return false;
  const graceEnd = new Date(eventDate);
  graceEnd.setDate(graceEnd.getDate() + GRACE_PERIOD_DAYS);
  return new Date() > graceEnd;
}
