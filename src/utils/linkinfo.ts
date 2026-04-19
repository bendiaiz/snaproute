import type { LinkData } from "../store/kv";
import { buildShortUrl } from "./preview";
import { formatTtlHuman, isExpired } from "./expiry";
import { serializeTags } from "./tags";
import { serializeUTM } from "./utm";

export interface LinkInfo {
  slug: string;
  url: string;
  shortUrl: string;
  alias?: string;
  tags: string[];
  clicks: number;
  createdAt: string;
  expiresAt?: string;
  ttlHuman?: string;
  expired: boolean;
  utm?: Record<string, string>;
}

export function buildLinkInfo(slug: string, link: LinkData, baseUrl: string): LinkInfo {
  const expired = link.expiresAt ? isExpired(link.expiresAt) : false;
  const ttlHuman = link.expiresAt ? formatTtlHuman(link.expiresAt) : undefined;

  return {
    slug,
    url: link.url,
    shortUrl: buildShortUrl(baseUrl, slug),
    alias: link.alias,
    tags: link.tags ?? [],
    clicks: link.clicks ?? 0,
    createdAt: link.createdAt,
    expiresAt: link.expiresAt,
    ttlHuman,
    expired,
    utm: link.utm,
  };
}

export function linkInfoToJson(info: LinkInfo): Record<string, unknown> {
  return {
    slug: info.slug,
    url: info.url,
    short_url: info.shortUrl,
    ...(info.alias ? { alias: info.alias } : {}),
    tags: serializeTags(info.tags),
    clicks: info.clicks,
    created_at: info.createdAt,
    ...(info.expiresAt ? { expires_at: info.expiresAt, ttl: info.ttlHuman, expired: info.expired } : {}),
    ...(info.utm ? { utm: serializeUTM(info.utm as any) } : {}),
  };
}
