/** YYYY-MM-DD in local timezone */
export function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function streakDaysFromLogs(logDates: string[]): number {
  const days = new Set(
    logDates.map((iso) => toLocalDateKey(new Date(iso))),
  );
  let streak = 0;
  const cur = new Date();
  for (let i = 0; i < 400; i++) {
    const key = toLocalDateKey(cur);
    if (days.has(key)) {
      streak += 1;
      cur.setDate(cur.getDate() - 1);
    } else if (i === 0) {
      // today not logged yet — start from yesterday
      cur.setDate(cur.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export type TopicGap = { topic: string; daysSince: number };

export function topicsNotStudiedInDays(
  logs: { topic_id: string; created_at: string }[],
  minDays = 3,
): TopicGap[] {
  const last = new Map<string, Date>();
  for (const l of logs) {
    const d = new Date(l.created_at);
    const prev = last.get(l.topic_id);
    if (!prev || d > prev) last.set(l.topic_id, d);
  }
  const now = Date.now();
  const out: TopicGap[] = [];
  for (const [topic, d] of last) {
    const days = Math.floor((now - d.getTime()) / 86400000);
    if (days >= minDays) out.push({ topic, daysSince: days });
  }
  return out.sort((a, b) => b.daysSince - a.daysSince);
}

/** Last 7 calendar days, daily sum of net */
export function last7DailyNet(
  logs: { net: number | null; created_at: string }[],
): { label: string; value: number }[] {
  const result: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = toLocalDateKey(d);
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    result.push({ label, value: 0 });
    const idx = result.length - 1;
    for (const l of logs) {
      if (toLocalDateKey(new Date(l.created_at)) === key) {
        result[idx].value += l.net ?? 0;
      }
    }
  }
  return result;
}
