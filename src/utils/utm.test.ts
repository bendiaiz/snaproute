import { describe, it, expect } from 'vitest';
import { parseUTMParams, appendUTMParams, hasUTMParams, serializeUTM } from './utm';

describe('parseUTMParams', () => {
  it('parses all utm params', () => {
    const p = new URLSearchParams('utm_source=google&utm_medium=cpc&utm_campaign=launch');
    const utm = parseUTMParams(p);
    expect(utm.source).toBe('google');
    expect(utm.medium).toBe('cpc');
    expect(utm.campaign).toBe('launch');
  });

  it('returns undefined for missing params', () => {
    const utm = parseUTMParams(new URLSearchParams());
    expect(utm.source).toBeUndefined();
  });
});

describe('appendUTMParams', () => {
  it('appends utm params to url', () => {
    const result = appendUTMParams('https://example.com', { source: 'email', medium: 'newsletter' });
    const url = new URL(result);
    expect(url.searchParams.get('utm_source')).toBe('email');
    expect(url.searchParams.get('utm_medium')).toBe('newsletter');
  });

  it('preserves existing query params', () => {
    const result = appendUTMParams('https://example.com?foo=bar', { source: 'x' });
    const url = new URL(result);
    expect(url.searchParams.get('foo')).toBe('bar');
    expect(url.searchParams.get('utm_source')).toBe('x');
  });
});

describe('hasUTMParams', () => {
  it('returns true when any param is set', () => {
    expect(hasUTMParams({ source: 'google' })).toBe(true);
  });

  it('returns false when all undefined', () => {
    expect(hasUTMParams({})).toBe(false);
  });
});

describe('serializeUTM', () => {
  it('only includes defined keys', () => {
    const out = serializeUTM({ source: 'fb', campaign: 'sale' });
    expect(Object.keys(out)).toEqual(['utm_source', 'utm_campaign']);
  });
});
