import { createLinkStore } from "../store/kv";
import {
  exportFormatFromParams,
  exportLinks,
  exportContentType,
  exportFilename,
} from "../utils/linkexport";

export interface ExportHandlerEnv {
  LINKS: KVNamespace;
  API_SECRET?: string;
}

export function createExportHandler(env: ExportHandlerEnv) {
  const store = createLinkStore(env.LINKS);

  return async function handleExport(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const format = exportFormatFromParams(url.searchParams);
    const tag = url.searchParams.get("tag") ?? undefined;

    let links = await store.list();

    if (tag) {
      links = links.filter((l) => (l.tags ?? []).includes(tag));
    }

    if (links.length === 0) {
      return new Response(
        format === "csv" ? "slug,url,createdAt,expiresAt,tags,alias\n" : "[]",
        {
          status: 200,
          headers: {
            "Content-Type": exportContentType(format),
            "Content-Disposition": `attachment; filename="${exportFilename(format)}"`,
          },
        }
      );
    }

    const body = exportLinks(links, format);

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": exportContentType(format),
        "Content-Disposition": `attachment; filename="${exportFilename(format)}"`,
        "X-Total-Count": String(links.length),
      },
    });
  };
}
