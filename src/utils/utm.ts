export interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export function parseUTMParams(params: URLSearchParams): UTMParams {
  return {
    source: params.get('utm_source') ?? undefined,
    medium: params.get('utm_medium') ?? undefined,
    campaign: params.get('utm_campaign') ?? undefined,
    term: params.get('utm_term') ?? undefined,
    content: params.get('utm_content') ?? undefined,
  };
}

export function appendUTMParams(url: string, utm: UTMParams): string {
  const parsed = new URL(url);
  if (utm.source) parsed.searchParams.set('utm_source', utm.source);
  if (utm.medium) parsed.searchParams.set('utm_medium', utm.medium);
  if (utm.campaign) parsed.searchParams.set('utm_campaign', utm.campaign);
  if (utm.term) parsed.searchParams.set('utm_term', utm.term);
  if (utm.content) parsed.searchParams.set('utm_content', utm.content);
  return parsed.toString();
}

export function hasUTMParams(utm: UTMParams): boolean {
  return Object.values(utm).some((v) => v !== undefined);
}

export function serializeUTM(utm: UTMParams): Record<string, string> {
  const out: Record<string, string> = {};
  if (utm.source) out['utm_source'] = utm.source;
  if (utm.medium) out['utm_medium'] = utm.medium;
  if (utm.campaign) out['utm_campaign'] = utm.campaign;
  if (utm.term) out['utm_term'] = utm.term;
  if (utm.content) out['utm_content'] = utm.content;
  return out;
}
