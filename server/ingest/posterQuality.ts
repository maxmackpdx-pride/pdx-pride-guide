import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { assertSafePublicUrl } from "./ssrf";

const UPLOADS =
  process.env.UPLOADS_DIR?.trim() || path.join(process.cwd(), "uploads");
const MAX_BYTES = 12_000_000; // full flyers can be large
const TIMEOUT_MS = 20_000;

mkdirSync(UPLOADS, { recursive: true });

/**
 * Prefer the highest-quality URL from a set of candidates.
 * Strips common resize/query shrinks when a larger original is available.
 */
export function preferFullQualityImageUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let url = String(raw).trim();
  if (!url || url.startsWith("data:")) return url || null;

  // Protocol-relative
  if (url.startsWith("//")) url = `https:${url}`;

  try {
    const u = new URL(url);

    // Squarespace CDN: drop format/size shrink params when possible; keep original path
    if (/squarespace-cdn\.com|sqsp\.net|static1\.squarespace/i.test(u.hostname)) {
      // common: ?format=100w or format=1500w — prefer original by removing format/size
      u.searchParams.delete("format");
      u.searchParams.delete("width");
      u.searchParams.delete("height");
      // path sometimes has /1000w/ — leave path alone (site-specific)
      return u.toString();
    }

    // WordPress sized: image-300x200.jpg → image.jpg
    u.pathname = u.pathname.replace(/-\d{2,4}x\d{2,4}(\.[a-z]+)$/i, "$1");

    // Cloudinary / imgix style w_ / h_ transforms — hard to reverse; keep as-is
    // Tribe / Eventbrite often put size in query
    for (const k of ["w", "h", "width", "height", "resize", "fit", "quality"]) {
      // Don't strip quality if it's already high; strip tiny sizes
      const v = u.searchParams.get(k);
      if (v && /^\d+$/.test(v) && Number(v) > 0 && Number(v) < 400) {
        u.searchParams.delete(k);
      }
    }

    return u.toString();
  } catch {
    return url;
  }
}

/** Pick best image URL from JSON-LD / CMS style image fields. */
export function pickBestImageFromUnknown(img: unknown): string | null {
  if (!img) return null;
  if (typeof img === "string") return preferFullQualityImageUrl(img);

  type Cand = { url: string; score: number };
  const cands: Cand[] = [];

  const scoreUrl = (url: string, w?: number, h?: number, hint?: string) => {
    const full = preferFullQualityImageUrl(url);
    if (!full) return;
    let score = 0;
    if (w && h) score += w * h;
    else if (w) score += w * 1000;
    if (hint) {
      if (/full|original|large|max|hero|poster|flyer/i.test(hint)) score += 5_000_000;
      if (/thumb|small|icon|tiny|150w|100w|300x/i.test(hint)) score -= 2_000_000;
    }
    if (/thumb|small|icon/i.test(full)) score -= 1_000_000;
    cands.push({ url: full, score });
  };

  const walk = (node: unknown, hint = "") => {
    if (!node) return;
    if (typeof node === "string") {
      scoreUrl(node, undefined, undefined, hint);
      return;
    }
    if (Array.isArray(node)) {
      for (const n of node) walk(n, hint);
      return;
    }
    if (typeof node !== "object") return;
    const o = node as Record<string, unknown>;
    const url =
      (typeof o.url === "string" && o.url) ||
      (typeof o.contentUrl === "string" && o.contentUrl) ||
      (typeof o.contentURL === "string" && o.contentURL) ||
      (typeof o["@id"] === "string" && /^https?:/i.test(o["@id"]) ? o["@id"] : null) ||
      (typeof o.assetUrl === "string" && o.assetUrl) ||
      (typeof o.originalUrl === "string" && o.originalUrl) ||
      (typeof o.src === "string" && o.src) ||
      null;
    const w = Number(o.width || o.w || 0) || undefined;
    const h = Number(o.height || o.h || 0) || undefined;
    if (url) scoreUrl(String(url), w, h, hint + " " + String(o.name || o.caption || ""));
    // nested sizes maps (Tribe, WP)
    if (o.sizes && typeof o.sizes === "object") {
      for (const [k, v] of Object.entries(o.sizes as Record<string, unknown>)) {
        if (v && typeof v === "object" && typeof (v as any).url === "string") {
          scoreUrl((v as any).url, Number((v as any).width) || undefined, Number((v as any).height) || undefined, k);
        } else if (typeof v === "string") {
          scoreUrl(v, undefined, undefined, k);
        }
      }
    }
    if (o.image) walk(o.image, "image");
    if (o.thumbnail) walk(o.thumbnail, "thumb");
    if (o.thumbnailUrl) walk(o.thumbnailUrl, "thumb");
  };

  walk(img);
  if (!cands.length) return null;
  cands.sort((a, b) => b.score - a.score);
  return cands[0].url;
}

/**
 * Download remote flyer and store under /uploads for permanent full-quality use.
 * Returns local path `/uploads/...` or the upgraded remote URL if download fails.
 */
export async function captureFullQualityPoster(
  remoteUrl: string | null | undefined,
  opts?: { referer?: string | null },
): Promise<{ url: string | null; captured: boolean; warning?: string }> {
  const upgraded = preferFullQualityImageUrl(remoteUrl);
  if (!upgraded) return { url: null, captured: false };
  if (upgraded.startsWith("/uploads/") || upgraded.startsWith("/posters/")) {
    return { url: upgraded, captured: false };
  }
  if (!/^https?:\/\//i.test(upgraded)) {
    return { url: upgraded, captured: false };
  }

  try {
    await assertSafePublicUrl(upgraded);
  } catch (err: any) {
    return { url: upgraded, captured: false, warning: err?.message || "Unsafe poster URL" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(upgraded, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 PDXPrideGuide-Flyer/1.0",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        ...(opts?.referer ? { Referer: opts.referer } : {}),
      },
    });
    if (!res.ok) {
      return { url: upgraded, captured: false, warning: `Poster fetch HTTP ${res.status}` };
    }
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (ct && !ct.startsWith("image/") && !ct.includes("octet-stream")) {
      return { url: upgraded, captured: false, warning: `Not an image (${ct})` };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 800) {
      return { url: upgraded, captured: false, warning: "Poster too small — kept remote URL" };
    }
    if (buf.byteLength > MAX_BYTES) {
      return { url: upgraded, captured: false, warning: "Poster over size cap — kept remote URL" };
    }

    let ext = ".jpg";
    if (ct.includes("png") || upgraded.toLowerCase().includes(".png")) ext = ".png";
    else if (ct.includes("webp") || upgraded.toLowerCase().includes(".webp")) ext = ".webp";
    else if (ct.includes("gif")) ext = ".gif";
    else if (ct.includes("jpeg") || ct.includes("jpg")) ext = ".jpg";

    const hash = createHash("sha256").update(buf).digest("hex").slice(0, 20);
    const filename = `qsearch-flyer-${hash}${ext}`;
    const dest = path.join(UPLOADS, filename);
    if (!existsSync(dest)) {
      writeFileSync(dest, buf);
    }
    return { url: `/uploads/${filename}`, captured: true };
  } catch (err: any) {
    return {
      url: upgraded,
      captured: false,
      warning: err?.name === "AbortError" ? "Poster download timed out" : err?.message || "Poster download failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Pull candidate flyer URLs from page HTML — og:image, twitter:image, large <img>, srcset.
 * Prefers wider images and skips logos/icons.
 */
export function extractFlyerCandidatesFromHtml(html: string, pageUrl: string): string[] {
  type Ranked = { url: string; score: number };
  const ranked: Ranked[] = [];
  const seen = new Set<string>();
  const push = (raw: string | null | undefined, boost = 0) => {
    if (!raw) return;
    let u = raw.trim().replace(/&amp;/g, "&");
    if (!u || u.startsWith("data:")) return;
    if (
      /logo|icon|sprite|avatar|emoji|pixel|1x1|spacer|badge|button|wp-includes|gravatar|favicon|apple-touch/i.test(
        u,
      )
    ) {
      return;
    }
    try {
      u = new URL(u.startsWith("//") ? `https:${u}` : u, pageUrl).toString();
    } catch {
      return;
    }
    const full = preferFullQualityImageUrl(u);
    if (!full || seen.has(full)) return;
    seen.add(full);
    let score = boost;
    if (/flyer|poster|event|featured|hero|promo|bill|attachment/i.test(full)) score += 20;
    if (/uploads|media|cdn|wp-content|squarespace|tribe|events/i.test(full)) score += 8;
    if (/\.(jpe?g|png|webp)(\?|$)/i.test(full)) score += 3;
    // Squarespace size hints in path
    const wHint = full.match(/\/(\d{3,4})w\//);
    if (wHint) score += Math.min(Number(wHint[1]) / 50, 30);
    score += Math.min(full.length, 200) / 50;
    ranked.push({ url: full, score });
  };

  // Meta tags first (usually full hero/flyer)
  const metaRe =
    /<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["'][^>]+content=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = metaRe.exec(html)) != null) push(m[1], 40);

  const metaRe2 =
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["']/gi;
  while ((m = metaRe2.exec(html)) != null) push(m[1], 40);

  // link rel=image_src
  const linkImg =
    /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/gi;
  while ((m = linkImg.exec(html)) != null) push(m[1], 35);

  // Squarespace / CMS data-image / data-src
  const dataImgRe =
    /(?:data-image|data-src|data-bg|data-original|data-lazy-src|data-full-url)\s*=\s*["']([^"']+)["']/gi;
  while ((m = dataImgRe.exec(html)) != null) {
    if (/\.(jpe?g|png|webp|gif)/i.test(m[1]) || /images\.squarespace|wp-content|cdn/i.test(m[1])) {
      push(m[1], 18);
    }
  }

  // CSS background-image: url(...)
  const bgRe = /background(?:-image)?\s*:\s*url\(\s*['"]?([^'")\s]+)['"]?\s*\)/gi;
  while ((m = bgRe.exec(html)) != null) {
    if (/\.(jpe?g|png|webp)/i.test(m[1])) push(m[1], 10);
  }

  // srcset: pick largest width
  const srcsetRe = /srcset=["']([^"']+)["']/gi;
  while ((m = srcsetRe.exec(html)) != null) {
    const parts = m[1].split(",").map(s => s.trim());
    let best: { u: string; w: number } | null = null;
    for (const p of parts) {
      const [u, w] = p.split(/\s+/);
      const width = w && w.endsWith("w") ? parseInt(w, 10) : 0;
      if (!u) continue;
      if (!best || width > best.w) best = { u, w: width || 0 };
    }
    if (best) push(best.u, 12 + Math.min(best.w / 80, 25));
  }

  // Large img tags (src + data-src)
  const imgRe = /<img\b[^>]*>/gi;
  while ((m = imgRe.exec(html)) != null) {
    const tag = m[0];
    const src =
      tag.match(/\ssrc=["']([^"']+)["']/i)?.[1] ||
      tag.match(/\sdata-src=["']([^"']+)["']/i)?.[1] ||
      null;
    if (!src) continue;
    if (/flyer|poster|event|featured|hero|attachment|wp-content\/uploads|tribe/i.test(src + tag)) {
      push(src, 22);
    } else if (!/logo|icon|avatar/i.test(src + tag)) {
      const w = Number(tag.match(/\swidth=["']?(\d+)/i)?.[1] || 0);
      const h = Number(tag.match(/\sheight=["']?(\d+)/i)?.[1] || 0);
      if (w >= 400 || h >= 400 || w * h >= 120_000) push(src, 15);
      else push(src, 4);
    }
  }

  // JSON blobs often embed image URLs (Squarespace collection, Tribe)
  const jsonUrlRe =
    /https?:\/\/[^"'\\\s]+(?:uploads|media|images)[^"'\\\s]+\.(?:jpe?g|png|webp)(?:\?[^"'\\\s]*)?/gi;
  let jm: RegExpExecArray | null;
  const jsonSlice = html.length > 400_000 ? html.slice(0, 400_000) : html;
  while ((jm = jsonUrlRe.exec(jsonSlice)) != null) {
    push(jm[0], 14);
  }

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, 12).map(r => r.url);
}

/** Enrich a draft's poster to full quality + local capture when possible. */
export async function enrichDraftPoster<T extends { posterImageUrl: string | null; warnings: string[]; sourceUrl: string | null }>(
  draft: T,
  extraCandidates: string[] = [],
): Promise<T> {
  const candidates = [
    draft.posterImageUrl,
    ...extraCandidates,
  ].filter(Boolean) as string[];

  if (!candidates.length) return draft;

  const warnings = [...draft.warnings];
  let bestUrl: string | null = preferFullQualityImageUrl(candidates[0]) || candidates[0];
  let captured = false;

  // Try candidates until one downloads as a real image
  for (const cand of candidates.slice(0, 5)) {
    const result = await captureFullQualityPoster(cand, {
      referer: draft.sourceUrl,
    });
    if (result.url) bestUrl = result.url;
    if (result.warning) warnings.push(result.warning);
    if (result.captured) {
      captured = true;
      bestUrl = result.url;
      warnings.push("Flyer captured full-quality to /uploads");
      break;
    }
  }

  if (!captured && bestUrl && bestUrl !== draft.posterImageUrl) {
    warnings.push("Flyer URL upgraded toward full quality");
  }

  return {
    ...draft,
    posterImageUrl: bestUrl,
    warnings: Array.from(new Set(warnings)),
  };
}
