/**
 * Utilities for tracking and summarizing click counts.
 */

export interface ClickSummary {
  total: number;
  last24h: number;
  last7d: number;
  last30d: number;
}

export interface ClickEvent {
  ts: number; // unix ms
  country?: string;
  referer?: string;
}

const MS = {
  day: 86_400_000,
  week: 7 * 86_400_000,
  month: 30 * 86_400_000,
};

export function summarizeClicks(
  events: ClickEvent[],
  now: number = Date.now()
): ClickSummary {
  let last24h = 0;
  let last7d = 0;
  let last30d = 0;

  for (const e of events) {
    const age = now - e.ts;
    if (age <= MS.day) last24h++;
    if (age <= MS.week) last7d++;
    if (age <= MS.month) last30d++;
  }

  return { total: events.length, last24h, last7d, last30d };
}

export function topCountries(
  events: ClickEvent[],
  limit = 5
): Array<{ country: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const e of events) {
    const c = e.country ?? "Unknown";
    counts[c] = (counts[c] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function topReferers(
  events: ClickEvent[],
  limit = 5
): Array<{ referer: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const e of events) {
    const r = e.referer ?? "(direct)";
    counts[r] = (counts[r] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([referer, count]) => ({ referer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
