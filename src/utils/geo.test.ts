import { describe, it, expect } from 'vitest';
import { extractGeo, geoLabel } from './geo';

function makeRequest(headers: Record<string, string>): Request {
  return new Request('https://example.com', { headers });
}

describe('extractGeo', () => {
  it('extracts cloudflare headers', () => {
    const req = makeRequest({
      'cf-ipcountry': 'US',
      'cf-region-code': 'CA',
      'cf-ipcity': 'San Francisco',
    });
    expect(extractGeo(req)).toEqual({
      country: 'US',
      region: 'CA',
      city: 'San Francisco',
    });
  });

  it('falls back to vercel headers', () => {
    const req = makeRequest({
      'x-vercel-ip-country': 'DE',
      'x-vercel-ip-country-region': 'BE',
    });
    const geo = extractGeo(req);
    expect(geo.country).toBe('DE');
    expect(geo.region).toBe('BE');
    expect(geo.city).toBe('Unknown');
  });

  it('returns Unknown when no headers present', () => {
    const req = makeRequest({});
    expect(extractGeo(req)).toEqual({
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
    });
  });
});

describe('geoLabel', () => {
  it('joins known parts', () => {
    expect(geoLabel({ country: 'US', region: 'CA', city: 'San Francisco' })).toBe(
      'San Francisco, CA, US'
    );
  });

  it('skips Unknown parts', () => {
    expect(geoLabel({ country: 'US', region: 'Unknown', city: 'Unknown' })).toBe('US');
  });

  it('returns Unknown when all parts unknown', () => {
    expect(geoLabel({ country: 'Unknown', region: 'Unknown', city: 'Unknown' })).toBe('Unknown');
  });
});
