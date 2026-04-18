/**
 * Lightweight QR code URL generator using a public API.
 * Returns a URL pointing to a QR code image for a given short link.
 */

export interface QRCodeOptions {
  size?: number; // pixel size, default 200
  format?: "png" | "svg";
  margin?: number;
}

export function buildQRCodeUrl(
  targetUrl: string,
  options: QRCodeOptions = {}
): string {
  const { size = 200, format = "png", margin = 1 } = options;
  const encoded = encodeURIComponent(targetUrl);
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encoded}&size=${size}x${size}&format=${format}&margin=${margin}`;
}

export function qrOptionsFromParams(params: URLSearchParams): QRCodeOptions {
  const opts: QRCodeOptions = {};
  const size = params.get("size");
  if (size) {
    const n = parseInt(size, 10);
    if (!isNaN(n) && n >= 50 && n <= 1000) opts.size = n;
  }
  const format = params.get("format");
  if (format === "svg" || format === "png") opts.format = format;
  const margin = params.get("margin");
  if (margin) {
    const m = parseInt(margin, 10);
    if (!isNaN(m) && m >= 0 && m <= 10) opts.margin = m;
  }
  return opts;
}
