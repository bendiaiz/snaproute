/**
 * Lightweight nanoid-style slug generator for short URLs.
 * Uses the Web Crypto API so it works on Edge runtimes.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const ALPHABET_LENGTH = ALPHABET.length;

/**
 * Generate a cryptographically random URL-safe slug.
 * @param size Number of characters (default: 7)
 */
export function generateSlug(size = 7): string {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => ALPHABET[byte % ALPHABET_LENGTH])
    .join('');
}

/**
 * Validate that a slug contains only URL-safe alphanumeric characters.
 * @param slug The slug string to validate
 */
export function isValidSlug(slug: string): boolean {
  return /^[A-Za-z0-9]{3,32}$/.test(slug);
}
