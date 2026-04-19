/**
 * Alias management utilities for custom short slugs
 */

import { sanitizeAlias, isReservedSlug } from './slugify';
import { isValidSlug } from './nanoid';

export interface AliasValidationResult {
  valid: boolean;
  error?: string;
  alias?: string;
}

export function validateAlias(raw: string): AliasValidationResult {
  const alias = sanitizeAlias(raw);

  if (!alias) {
    return { valid: false, error: 'Alias is empty or contains only invalid characters' };
  }

  if (alias.length < 2) {
    return { valid: false, error: 'Alias must be at least 2 characters' };
  }

  if (alias.length > 64) {
    return { valid: false, error: 'Alias must be 64 characters or fewer' };
  }

  if (!isValidSlug(alias)) {
    return { valid: false, error: 'Alias contains invalid characters' };
  }

  if (isReservedSlug(alias)) {
    return { valid: false, error: `Alias "${alias}" is reserved` };
  }

  return { valid: true, alias };
}

export function aliasFromParams(params: URLSearchParams): string | null {
  const raw = params.get('alias') ?? params.get('custom') ?? null;
  if (!raw) return null;
  const result = validateAlias(raw);
  return result.valid ? result.alias! : null;
}
