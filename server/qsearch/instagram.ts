import type { IngestEventDraft } from "../ingest/types";
import {
  dayOfWeekFromStart,
  defaultEndFromStart,
  pacificCalendarYear,
  toPacificWallClock,
  yearFromDateString,
} from "../ingest/dates";
import { visionFlyerToDrafts } from "./vision";

export type IgAssistResult = {
  ok: boolean;
  handle: string | null;
  drafts: IngestEventDraft[];
  mode: "graph" | "paste" | "none";
  error?: string;
  note?: string;
};

function metaConfigured(): { token: string; businessId: string } | null {
  const token =
    process.env.META_PAGE_ACCESS_TOKEN?.trim() ||
    process.env.INSTAGRAM_ACCESS_TOKEN?.trim() ||
    "";
  const businessId =
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim() ||
    process.env.META_IG_BUSINESS_ID?.trim() ||
    "";
  if (!token || !businessId) return null;
  return { token, businessId };
}

export function parseInstagramHandle(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  // @handle
  const at = s.match(/^@([a-zA-Z0-9._]+)$/);
  if (at) return at[1].toLowerCase();
  // instagram.com/handle
  const url = s.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
  if (url && !["p", "reel", "stories", "explore"].includes(url[1].toLowerCase())) {
    return url[1].toLowerCase();
  }
  // weak website host is IG
  if (/instagram\.com/i.test(s)) return null;
  if (/^[a-zA-Z0-9._]{2,30}$/.test(s)) return s.toLowerCase();
  return null;
}

function captionToDraft(
  caption: string,
  mediaUrl: string | null,
  sourceUrl: string | null,
): IngestEventDraft | null {
  const lines = caption.split(/\n+/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  const title = lines[0].replace(/[^\w\s\-:'&]/g, "").slice(0, 120) || "Instagram event";
  // naive date: Month Day or YYYY-MM-DD
  const dateHit =
    caption.match(
      /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:,?\s+\d{4})?)\b/i,
    ) || caption.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  const timeHit = caption.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
  let dateStart: string | null = null;
  if (dateHit) {
    const raw = dateHit[1];
    if (/^\d{4}-/.test(raw) || yearFromDateString(raw) != null) {
      dateStart = toPacificWallClock(`${raw.includes("T") ? raw : `${raw}T20:00:00`}`);
    } else {
      // Month + day only — use Pacific calendar year (and +1 if that date already passed)
      const y = pacificCalendarYear();
      let d = new Date(`${raw} ${y} 20:00:00 GMT-0700`);
      if (Number.isFinite(d.getTime()) && d.getTime() < Date.now() - 12 * 3600_000) {
        d = new Date(`${raw} ${y + 1} 20:00:00 GMT-0700`);
      }
      if (Number.isFinite(d.getTime())) dateStart = toPacificWallClock(d);
    }
  }
  if (!dateStart || yearFromDateString(dateStart) == null) {
    return {
      title,
      description: caption.slice(0, 8000),
      venueName: "TBA",
      address: null,
      neighborhood: null,
      lat: null,
      lng: null,
      // Far placeholder still includes an explicit year so nothing is year-less
      dateStart: `${pacificCalendarYear() + 1}-12-31T20:00:00`,
      dateEnd: `${pacificCalendarYear() + 1}-12-31T23:00:00`,
      dayOfWeek: null,
      ageRequirement: "ALL_AGES",
      eventTypes: "[]",
      admission: "FREE",
      ticketUrl: sourceUrl,
      isPublic: true,
      isPrivate: false,
      isHouseParty: false,
      isSexPositive: false,
      nudityOk: false,
      posterImageUrl: mediaUrl,
      sourceUrl,
      parseSource: "instagram",
      warnings: ["IG caption missing clear date/year — placeholder; unselected"],
      confidence: 0.25,
    };
  }
  const dateEnd = defaultEndFromStart(dateStart);
  return {
    title,
    description: caption.slice(0, 8000),
    venueName: "TBA",
    address: null,
    neighborhood: null,
    lat: null,
    lng: null,
    dateStart,
    dateEnd,
    dayOfWeek: dayOfWeekFromStart(dateStart),
    ageRequirement: "ALL_AGES",
    eventTypes: "[]",
    admission: "FREE",
    ticketUrl: sourceUrl,
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    posterImageUrl: mediaUrl,
    sourceUrl,
    parseSource: "instagram",
    warnings: ["Parsed from IG caption — verify venue/time"],
    confidence: 0.45,
  };
}

function looksLikeImageUrl(url: string): boolean {
  const u = url.toLowerCase();
  if (u.startsWith("data:image/")) return true;
  if (/\.(jpe?g|png|webp|gif)(\?|$)/i.test(u)) return true;
  if (/cdninstagram|fbcdn\.net|scontent\.|ig_cache|evbuc\.com|static\.tixr/i.test(u)) return true;
  return false;
}

function isInstagramPostUrl(url: string): boolean {
  return /instagram\.com\/(p|reel|tv)\//i.test(url);
}

/**
 * Best-effort OG tags from a public page (often blocked for instagram.com).
 * Never claims full IG scrape.
 */
async function tryFetchOpenGraph(pageUrl: string): Promise<{ image: string | null; description: string | null }> {
  try {
    const { assertSafePublicUrl } = await import("../ingest/ssrf");
    await assertSafePublicUrl(pageUrl);
    const res = await fetch(pageUrl, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return { image: null, description: null };
    const html = (await res.text()).slice(0, 400_000);
    const image =
      html.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1] ||
      null;
    const description =
      html.match(/property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/content=["']([^"']+)["'][^>]+property=["']og:description["']/i)?.[1] ||
      html.match(/name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      null;
    return {
      image: image ? image.replace(/&amp;/g, "&") : null,
      description: description ? description.replace(/&amp;/g, "&") : null,
    };
  } catch {
    return { image: null, description: null };
  }
}

/**
 * Single-URL Instagram assist: post URL or direct image CDN URL.
 * - Image URL → vision OCR (needs API key)
 * - Post URL → try OG image (often blocked) then vision; no full unauth scrape
 */
export async function igFromUrl(opts: {
  url: string;
  venueHint?: string | null;
}): Promise<IgAssistResult> {
  const raw = String(opts.url || "").trim();
  if (!raw) {
    return { ok: false, handle: null, drafts: [], mode: "none", error: "URL required" };
  }

  let imageUrl: string | null = null;
  let caption: string | null = null;
  let postUrl: string | null = null;
  const handle = parseInstagramHandle(raw);

  if (looksLikeImageUrl(raw) && !isInstagramPostUrl(raw)) {
    imageUrl = raw;
    postUrl = raw;
  } else if (isInstagramPostUrl(raw) || /instagram\.com\//i.test(raw)) {
    postUrl = raw;
    const og = await tryFetchOpenGraph(raw);
    imageUrl = og.image;
    caption = og.description;
    if (!imageUrl) {
      return {
        ok: false,
        handle,
        drafts: [],
        mode: "paste",
        error:
          "Could not load this Instagram post (login wall / blocked). Paste the direct image address (right‑click flyer → Copy image address) or upload the flyer under Read a flyer.",
        note: "We do not scrape Instagram logged-out. Meta Graph works only with Business tokens.",
      };
    }
  } else {
    // Unknown URL — try as image for vision
    imageUrl = raw;
    postUrl = raw;
  }

  const drafts: IngestEventDraft[] = [];
  let lastError: string | undefined;

  if (imageUrl) {
    const vis = await visionFlyerToDrafts({
      imageUrl,
      sourceUrl: postUrl || imageUrl,
      venueHint: opts.venueHint || handle,
      posterStoreUrl: imageUrl.startsWith("data:") ? null : imageUrl,
    });
    drafts.push(...vis.drafts);
    if (vis.error) lastError = vis.error;
  }

  if (caption?.trim() && !drafts.length) {
    const d = captionToDraft(caption.trim(), imageUrl, postUrl);
    if (d) drafts.push(d);
  }

  if (!drafts.length) {
    return {
      ok: false,
      handle,
      drafts: [],
      mode: "paste",
      error: lastError || "Could not extract an event from that URL.",
      note: "Need a public image URL or XAI_API_KEY / OPENAI_API_KEY for flyer vision.",
    };
  }

  return {
    ok: true,
    handle,
    drafts,
    mode: "paste",
    note: caption && !lastError ? "Used post preview text + image when available" : undefined,
  };
}

/**
 * Manual IG assist: caption and/or image URL, or prefer igFromUrl for a single link.
 * Never scrapes instagram.com unauthenticated beyond public OG (often empty).
 */
export async function igPasteAssist(opts: {
  handle?: string | null;
  caption?: string | null;
  imageUrl?: string | null;
  postUrl?: string | null;
  venueHint?: string | null;
}): Promise<IgAssistResult> {
  // Single URL path preferred
  const single = String(opts.postUrl || opts.imageUrl || "").trim();
  if (single && !opts.caption?.trim()) {
    return igFromUrl({ url: single, venueHint: opts.venueHint || opts.handle });
  }

  const handle = parseInstagramHandle(opts.handle || null);
  const drafts: IngestEventDraft[] = [];

  if (opts.imageUrl) {
    const vis = await visionFlyerToDrafts({
      imageUrl: opts.imageUrl,
      sourceUrl: opts.postUrl || opts.imageUrl,
      venueHint: opts.venueHint || handle,
    });
    drafts.push(...vis.drafts);
    if (vis.error && !opts.caption) {
      return {
        ok: false,
        handle,
        drafts: [],
        mode: "paste",
        error: vis.error,
      };
    }
  }

  if (opts.caption?.trim()) {
    const d = captionToDraft(
      opts.caption.trim(),
      opts.imageUrl || null,
      opts.postUrl || null,
    );
    if (d) drafts.push(d);
  }

  if (!drafts.length) {
    return {
      ok: false,
      handle,
      drafts: [],
      mode: "paste",
      error: "Paste an Instagram post URL or image URL (caption optional).",
      note: metaConfigured()
        ? "Meta credentials present — advanced Graph pull still available."
        : "Meta Business Discovery not configured.",
    };
  }

  return { ok: true, handle, drafts, mode: "paste" };
}

/**
 * Optional Meta Business Discovery recent media (requires env credentials).
 * Does not scrape instagram.com.
 */
export async function igGraphPull(opts: {
  handle: string;
  limit?: number;
}): Promise<IgAssistResult> {
  const handle = parseInstagramHandle(opts.handle);
  if (!handle) {
    return { ok: false, handle: null, drafts: [], mode: "none", error: "Invalid handle" };
  }
  const meta = metaConfigured();
  if (!meta) {
    return {
      ok: false,
      handle,
      drafts: [],
      mode: "none",
      error:
        "Instagram Business Discovery not configured (META_PAGE_ACCESS_TOKEN + INSTAGRAM_BUSINESS_ACCOUNT_ID).",
      note: "Use paste caption/image path instead.",
    };
  }

  try {
    const fields = encodeURIComponent(
      "business_discovery.username(" +
        handle +
        "){media.limit(" +
        String(opts.limit || 5) +
        "){caption,media_url,permalink,timestamp,media_type}}",
    );
    // Prefer Authorization header so access tokens are not query-string logged by proxies
    const url = `https://graph.facebook.com/v19.0/${meta.businessId}?fields=${fields}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${meta.token}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      const t = await res.text();
      return {
        ok: false,
        handle,
        drafts: [],
        mode: "graph",
        error: `Graph API ${res.status}: ${t.slice(0, 240)}`,
      };
    }
    const data = await res.json();
    const media = data?.business_discovery?.media?.data || [];
    const drafts: IngestEventDraft[] = [];
    for (const item of media) {
      const caption = String(item.caption || "");
      const mediaUrl = item.media_url || null;
      const permalink = item.permalink || null;
      if (mediaUrl && (item.media_type === "IMAGE" || item.media_type === "CAROUSEL_ALBUM")) {
        const vis = await visionFlyerToDrafts({
          imageUrl: mediaUrl,
          sourceUrl: permalink,
          venueHint: handle,
        });
        if (vis.drafts.length) {
          drafts.push(...vis.drafts);
          continue;
        }
      }
      const d = captionToDraft(caption, mediaUrl, permalink);
      if (d) drafts.push(d);
    }
    return {
      ok: true,
      handle,
      drafts,
      mode: "graph",
      note: `Pulled ${media.length} media via Business Discovery`,
    };
  } catch (err: any) {
    return {
      ok: false,
      handle,
      drafts: [],
      mode: "graph",
      error: err?.message || "Graph pull failed",
    };
  }
}
