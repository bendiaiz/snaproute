import { describe, it, expect } from 'vitest';
import { validateAlias, aliasFromParams } from './alias';

describe('validateAlias', () => {
  it('returns valid for a normal alias', () => {
    const r = validateAlias('my-link');
    expect(r.valid).toBe(true);
    expect(r.alias).toBe('my-link');
  });

  it('rejects empty string', () => {
    const r = validateAlias('');
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/empty/);
  });

  it('rejects single character', () => {
    const r = validateAlias('a');
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/at least 2/);
  });

  it('rejects alias over 64 chars', () => {
    const r = validateAlias('a'.repeat(65));
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/64/);
  });

  it('rejects reserved slugs', () => {
    const r = validateAlias('api');
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/reserved/);
  });

  it('sanitizes and validates', () => {
    const r = validateAlias('  Hello World  ');
    expect(r.valid).toBe(true);
    expect(r.alias).toBe('hello-world');
  });
});

describe('aliasFromParams', () => {
  it('reads alias param', () => {
    const p = new URLSearchParams({ alias: 'cool-link' });
    expect(aliasFromParams(p)).toBe('cool-link');
  });

  it('falls back to custom param', () => {
    const p = new URLSearchParams({ custom: 'my-slug' });
    expect(aliasFromParams(p)).toBe('my-slug');
  });

  it('returns null when missing', () => {
    expect(aliasFromParams(new URLSearchParams())).toBeNull();
  });

  it('returns null for invalid alias', () => {
    const p = new URLSearchParams({ alias: 'a' });
    expect(aliasFromParams(p)).toBeNull();
  });
});
