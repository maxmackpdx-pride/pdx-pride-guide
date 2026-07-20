import type { IngestEventDraft } from "../ingest/types";
import { dayOfWeekFromStart, defaultEndFromStart, toPacificWallClock } from "../ingest/dates";
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
    if (/^\d{4}-/.test(raw)) {
      dateStart = toPacificWallClock(`${raw}T${timeHit ? "20:00:00" : "20:00:00"}`);
    } else {
      const year = raw.match(/\d{4}/)?.[0] || "2026";
      const d = new Date(`${raw} ${year} 20:00:00 GMT-0700`);
      if (Number.isFinite(d.getTime())) dateStart = toPacificWallClock(d);
    }
  }
  if (!dateStart) {
    return {
      title,
      description: caption.slice(0, 8000),
      venueName: "TBA",
      address: null,
      neighborhood: null,
      lat: null,
      lng: null,
      dateStart: "2026-12-31T20:00:00",
      dateEnd: "2026-12-31T23:00:00",
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
      warnings: ["IG caption missing clear date — placeholder date; unselected"],
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

/**
 * Manual IG assist: paste caption and/or image URL (or post URL as image if vision can load).
 * Never scrapes instagram.com unauthenticated.
 */
export async function igPasteAssist(opts: {
  handle?: string | null;
  caption?: string | null;
  imageUrl?: string | null;
  postUrl?: string | null;
  venueHint?: string | null;
}): Promise<IgAssistResult> {
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
      error: "Provide caption text and/or flyer image URL (no unauth IG scrape).",
      note: metaConfigured()
        ? "Meta credentials present — use graphPull for Business Discovery."
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
    const url = `https://graph.facebook.com/v19.0/${meta.businessId}?fields=${fields}&access_token=${encodeURIComponent(meta.token)}`;
    const res = await fetch(url);
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
