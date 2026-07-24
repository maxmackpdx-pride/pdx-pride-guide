import { assertSafePublicUrl } from "./ssrf";

export type FetchedSource = {
  url: string;
  contentType: string | null;
  body: string;
};

const MAX_BYTES = 2_000_000;
const TIMEOUT_MS = 12_000;

/**
 * Fetch a public URL for ingest (HTML or ICS). SSRF-guarded + size-capped.
 */
export async function fetchIngestSource(rawUrl: string): Promise<FetchedSource> {
  const url = await assertSafePublicUrl(rawUrl);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // Browser-like UA: Badlands worker and some Squarespace/Wix edges 403 bot UAs.
    const res = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Zaylist-Ingest/1.0 (+https://www.zaylist.com)",
        Accept: "text/html, application/xhtml+xml, application/json, text/calendar, */*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) {
      throw new Error(`Fetch failed: HTTP ${res.status}`);
    }
    // Re-check final URL after redirects
    if (res.url && res.url !== url.toString()) {
      await assertSafePublicUrl(res.url);
    }

    const contentType = res.headers.get("content-type");
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) {
      throw new Error(`Response too large (max ${MAX_BYTES} bytes)`);
    }
    return {
      url: res.url || url.toString(),
      contentType,
      body: buf.toString("utf8"),
    };
  } catch (err: any) {
    if (err?.name === "AbortError") throw new Error("Fetch timed out");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
