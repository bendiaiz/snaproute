import { describe, it, expect } from 'vitest';
import { extractClickEvent, aggregateEvents, ClickEvent } from './analytics';

function makeEvent(overrides: Partial<ClickEvent> = {}): ClickEvent {
  return {
    slug: 'abc123',
    timestamp: 1000,
    ip: '1.2.3.4',
    userAgent: 'Mozilla/5.0',
    referer: 'https://example.com',
    country: 'US',
    ...overrides,
  };
}

describe('extractClickEvent', () => {
  it('extracts headers from request', () => {
    const req = new Request('https://snap.route/abc123', {
      headers: {
        'cf-connecting-ip': '9.9.9.9',
        'user-agent': 'TestAgent',
        'referer': 'https://referrer.io',
      },
    });
    const event = extractClickEvent(req, 'abc123');
    expect(event.slug).toBe('abc123');
    expect(event.ip).toBe('9.9.9.9');
    expect(event.userAgent).toBe('TestAgent');
    expect(event.referer).toBe('https://referrer.io');
    expect(event.country).toBeNull();
    expect(event.timestamp).toBeGreaterThan(0);
  });

  it('returns nulls when headers absent', () => {
    const req = new Request('https://snap.route/abc123');
    const event = extractClickEvent(req, 'abc123');
    expect(event.ip).toBeNull();
    expect(event.userAgent).toBeNull();
    expect(event.referer).toBeNull();
  });
});

describe('aggregateEvents', () => {
  it('returns zeros for empty events', () => {
    const stats = aggregateEvents([]);
    expect(stats.totalClicks).toBe(0);
    expect(stats.lastClickAt).toBeNull();
  });

  it('counts clicks and groups by referer and country', () => {
    const events = [
      makeEvent({ referer: 'https://a.com', country: 'US', timestamp: 1000 }),
      makeEvent({ referer: 'https://a.com', country: 'DE', timestamp: 2000 }),
      makeEvent({ referer: 'https://b.com', country: 'US', timestamp: 1500 }),
    ];
    const stats = aggregateEvents(events);
    expect(stats.totalClicks).toBe(3);
    expect(stats.topReferers['https://a.com']).toBe(2);
    expect(stats.topReferers['https://b.com']).toBe(1);
    expect(stats.topCountries['US']).toBe(2);
    expect(stats.topCountries['DE']).toBe(1);
    expect(stats.lastClickAt).toBe(2000);
  });

  it('skips null referers and countries', () => {
    const events = [makeEvent({ referer: null, country: null })];
    const stats = aggregateEvents(events);
    expect(Object.keys(stats.topReferers)).toHaveLength(0);
    expect(Object.keys(stats.topCountries)).toHaveLength(0);
  });
});
