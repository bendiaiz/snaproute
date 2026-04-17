export interface GeoInfo {
  country: string;
  region: string;
  city: string;
}

export function extractGeo(request: Request): GeoInfo {
  const country =
    request.headers.get('cf-ipcountry') ??
    request.headers.get('x-vercel-ip-country') ??
    'Unknown';

  const region =
    request.headers.get('cf-region-code') ??
    request.headers.get('x-vercel-ip-country-region') ??
    'Unknown';

  const city =
    request.headers.get('cf-ipcity') ??
    request.headers.get('x-vercel-ip-city') ??
    'Unknown';

  return { country, region, city };
}

export function geoLabel(geo: GeoInfo): string {
  const parts = [geo.city, geo.region, geo.country].filter(
    (p) => p && p !== 'Unknown'
  );
  return parts.length > 0 ? parts.join(', ') : 'Unknown';
}
