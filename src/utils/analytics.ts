export interface ClickEvent {
  slug: string;
  timestamp: number;
  ip: string | null;
  userAgent: string | null;
  referer: string | null;
  country: string | null;
}

export interface AggregatedStats {
  totalClicks: number;
  lastClickAt: number | null;
  topReferers: Record<string, number>;
  topCountries: Record<string, number>;
}

export function extractClickEvent(request: Request, slug: string): ClickEvent {
  const cf = (request as any).cf;
  return {
    slug,
    timestamp: Date.now(),
    ip: request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? null,
    userAgent: request.headers.get('user-agent') ?? null,
    referer: request.headers.get('referer') ?? null,
    country: cf?.country ?? null,
  };
}

export function aggregateEvents(events: ClickEvent[]): AggregatedStats {
  const topReferers: Record<string, number> = {};
  const topCountries: Record<string, number> = {};
  let lastClickAt: number | null = null;

  for (const event of events) {
    if (event.referer) {
      topReferers[event.referer] = (topReferers[event.referer] ?? 0) + 1;
    }
    if (event.country) {
      topCountries[event.country] = (topCountries[event.country] ?? 0) + 1;
    }
    if (lastClickAt === null || event.timestamp > lastClickAt) {
      lastClickAt = event.timestamp;
    }
  }

  return {
    totalClicks: events.length,
    lastClickAt,
    topReferers,
    topCountries,
  };
}
