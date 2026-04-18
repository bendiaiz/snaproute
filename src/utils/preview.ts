export interface LinkPreview {
  slug: string;
  url: string;
  shortUrl: string;
  qrUrl: string;
  clicks: number;
  createdAt: string;
}

export function buildShortUrl(baseUrl: string, slug: string): string {
  return `${baseUrl.replace(/\/$/, "")}/${slug}`;
}

export function buildPreview(
  baseUrl: string,
  slug: string,
  url: string,
  clicks: number,
  createdAt: string
): LinkPreview {
  const shortUrl = buildShortUrl(baseUrl, slug);
  const qrUrl = `${baseUrl.replace(/\/$/, "")}/qr/${slug}`;
  return { slug, url, shortUrl, qrUrl, clicks, createdAt };
}

export function previewToHtml(preview: LinkPreview): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>snaproute – ${preview.slug}</title>
  <meta property="og:url" content="${preview.shortUrl}" />
  <meta property="og:title" content="Short link: ${preview.slug}" />
  <meta property="og:description" content="${preview.url}" />
</head>
<body>
  <h1>${preview.slug}</h1>
  <p>Destination: <a href="${preview.url}">${preview.url}</a></p>
  <p>Short URL: <a href="${preview.shortUrl}">${preview.shortUrl}</a></p>
  <p>Clicks: ${preview.clicks}</p>
  <p>Created: ${preview.createdAt}</p>
  <img src="${preview.qrUrl}" alt="QR code" />
</body>
</html>`;
}
