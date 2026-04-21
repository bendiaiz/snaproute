import { describe, it, expect } from "vitest";
import {
  summarizeClicks,
  topCountries,
  topReferers,
  type ClickEvent,
} from "./clicks";

const NOW = 1_700_000_000_000;
const H = 3_600_000;

function makeEvent(overrides: Partial<ClickEvent> = {}): ClickEvent {
  return { ts: NOW - H, country: "US", referer: "https://example.com", ...overrides };
}

describe("summarizeClicks", () => {
  it("returns zeros for empty events", () => {
    expect(summarizeClicks([], NOW)).toEqual({ total: 0, last24h: 0, last7d: 0, last30d: 0 });
  });

  it("counts total correctly", () => {
    const events = [makeEvent(), makeEvent(), makeEvent()];
    expect(summarizeClicks(events, NOW).total).toBe(3);
  });

  it("buckets events by time window", () => {
    const events: ClickEvent[] = [
      makeEvent({ ts: NOW - H }),           // last 24h
      makeEvent({ ts: NOW - 2 * 24 * H }), // last 7d
      makeEvent({ ts: NOW - 10 * 24 * H }),// last 30d
      makeEvent({ ts: NOW - 40 * 24 * H }),// outside all
    ];
    const s = summarizeClicks(events, NOW);
    expect(s.last24h).toBe(1);
    expect(s.last7d).toBe(2);
    expect(s.last30d).toBe(3);
    expect(s.total).toBe(4);
  });

  it("counts an event exactly on the 24h boundary as within last24h", () => {
    const events = [makeEvent({ ts: NOW - 24 * H })];
    const s = summarizeClicks(events, NOW);
    expect(s.last24h).toBe(1);
  });
});

describe("topCountries", () => {
  it("returns sorted country counts", () => {
    const events = [
      makeEvent({ country: "US" }),
      makeEvent({ country: "US" }),
      makeEvent({ country: "DE" }),
    ];
    const result = topCountries(events, 5);
    expect(result[0]).toEqual({ country: "US", count: 2 });
    expect(result[1]).toEqual({ country: "DE", count: 1 });
  });

  it("uses Unknown for missing country", () => {
    const events = [makeEvent({ country: undefined })];
    expect(topCountries(events)[0].country).toBe("Unknown");
  });

  it("respects limit", () => {
    const events = ["A", "B", "C", "D"].map((c) => makeEvent({ country: c }));
    expect(topCountries(events, 2)).toHaveLength(2);
  });
});

describe("topReferers", () => {
  it("returns sorted referer counts", () => {
    const events = [
      makeEvent({ referer: "https://twitter.com" }),
      makeEvent({ referer: "https://twitter.com" }),
      makeEvent({ referer: "https://google.com" }),
    ];
    const result = topReferers(events, 5);
    expect(result[0].referer).toBe("https://twitter.com");
    expect(result[0].count).toBe(2);
  });

  it("uses (direct) for missing referer", () => {
    const events = [makeEvent({ referer: undefined })];
    expect(topReferers(events)[0].referer).toBe("(direct)");
  });

  it("respects limit", () => {
    const events = [
      "https://a.com",
      "https://b.com",
      "https://c.com",
      "https://d.com",
    ].map((r) => makeEvent({ referer: r }));
    expect(topReferers(events, 2)).toHaveLength(2);
  });
});
