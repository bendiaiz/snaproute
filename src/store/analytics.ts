import { ClickEvent, aggregateEvents, AggregatedStats } from '../utils/analytics';

const MAX_EVENTS = 500;

export interface AnalyticsStore {
  record(event: ClickEvent): Promise<void>;
  getStats(slug: string): Promise<AggreggetRawEvents(slug: string): Promise<ClickEvent[]>;
}

export function createAnalyticsStore(kv: KVName{
  function eventsKey(slug: string) {
    return `analytics:${slug}`;
  }

  async function getRawEvents(slug: string): Promise<ClickEvent[]> {
    const raw = await kv.get(eventsKey(slug));
    if (!raw) return [];
    try {
      return JSON.parse(raw) as ClickEvent[];
    } catch {
      return [];
    }
  }

  async function record(event: ClickEvent): Promise<void> {
    const events = await getRawEvents(event.slug);
    events.push(event);
    const trimmed = events.length > MAX_EVENTS ? events.slice(-MAX_EVENTS) : events;
    await kv.put(eventsKey(event.slug), JSON.stringify(trimmed));
  }

  async function getStats(slug: string): Promise<AggregatedStats> {
    const events = await getRawEvents(slug);
    return aggregateEvents(events);
  }

  return { record, getStats, getRawEvents };
}
