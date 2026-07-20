import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { IngestEventDraft } from "../ingest/types";
import {
  dayOfWeekFromStart,
  defaultEndFromStart,
  pacificCalendarYear,
  toPacificWallClock,
  yearFromDateString,
} from "../ingest/dates";

export type VisionResult = {
  drafts: IngestEventDraft[];
  model: string | null;
  error?: string;
};

function visionConfigured(): { url: string; key: string; model: string } | null {
  const key =
    process.env.XAI_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.GROK_API_KEY?.trim() ||
    "";
  if (!key) return null;
  const base =
    process.env.XAI_API_BASE?.trim() ||
    (process.env.XAI_API_KEY ? "https://api.x.ai/v1" : "https://api.openai.com/v1");
  const model =
    process.env.QSEARCH_VISION_MODEL?.trim() ||
    (process.env.XAI_API_KEY ? "grok-2-vision-latest" : "gpt-4o-mini");
  return { url: `${base.replace(/\/$/, "")}/chat/completions`, key, model };
}

function draftFromPartial(
  p: any,
  sourceUrl: string | null,
  posterUrl: string | null,
  confidence: number,
): IngestEventDraft | null {
  const title = String(p.title || p.name || "").trim();
  if (!title) return null;
  // Year is mandatory — reject or repair partial dates that drop the year
  let dateStart = toPacificWallClock(p.dateStart || p.start || p.date || p.when);
  if (!dateStart && p.date && p.time) {
    const datePart = String(p.date);
    const withYear =
      yearFromDateString(datePart) != null
        ? datePart
        : `${pacificCalendarYear()}-${datePart.replace(/^(\d{1,2})[\/\-](\d{1,2})/, (_, a, b) => `${String(a).padStart(2, "0")}-${String(b).padStart(2, "0")}`)}`;
    dateStart = toPacificWallClock(`${withYear}T${String(p.time).padStart(5, "0")}`);
  }
  if (!dateStart || yearFromDateString(dateStart) == null) {
    // Do not invent a year-less or hard-coded placeholder listing
    return null;
  }
  let dateEnd = toPacificWallClock(p.dateEnd || p.end);
  if (dateEnd && yearFromDateString(dateEnd) == null) dateEnd = null;
  // If end year missing but start has year, don't invent wrong year end
  if (dateEnd && yearFromDateString(dateStart) != null && yearFromDateString(dateEnd) != null) {
    // ok
  }
  if (!dateEnd) dateEnd = defaultEndFromStart(dateStart);
  // Guard: end must not jump to a different year unless multi-day NYE-style (start Dec 31)
  const ys = yearFromDateString(dateStart)!;
  const ye = yearFromDateString(dateEnd);
  if (ye != null && ye !== ys && !dateStart.includes("-12-31")) {
    dateEnd = defaultEndFromStart(dateStart);
  }
  const venueName = String(p.venueName || p.venue || p.location || "TBA").slice(0, 200);
  const description = String(p.description || p.details || `${title} at ${venueName}.`).slice(0, 8000);
  const warnings = [`Vision extract confidence ${confidence.toFixed(2)}`];
  if (confidence < 0.55) warnings.push("Low confidence — review carefully");

  return {
    title: title.slice(0, 200),
    description,
    venueName: venueName || "TBA",
    address: p.address ? String(p.address).slice(0, 300) : null,
    neighborhood: null,
    lat: null,
    lng: null,
    dateStart,
    dateEnd,
    dayOfWeek: dayOfWeekFromStart(dateStart),
    ageRequirement: String(p.ageRequirement || "ALL_AGES"),
    eventTypes: "[]",
    admission: String(p.admission || "UNKNOWN"),
    ticketUrl: p.ticketUrl ? String(p.ticketUrl).slice(0, 500) : sourceUrl,
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    posterImageUrl: posterUrl,
    sourceUrl,
    parseSource: "vision",
    warnings,
    confidence,
  };
}

/**
 * Flyer image → event draft(s) via cloud vision API (xAI Grok Vision or OpenAI).
 * There is no on-device / custom mini-model — without XAI_API_KEY or OPENAI_API_KEY this cannot OCR flyers.
 *
 * `imageUrl` may be https://… or data:image/…;base64,… (uploads use data URLs so the
 * remote vision API can read local files). `posterStoreUrl` is what we save on the draft
 * (e.g. /uploads/…) so the Review queue shows a local flyer, not a huge data URL.
 */
export async function visionFlyerToDrafts(opts: {
  imageUrl: string;
  sourceUrl?: string | null;
  venueHint?: string | null;
  /** Permanent poster path for the site (defaults to imageUrl when not a data: URL) */
  posterStoreUrl?: string | null;
}): Promise<VisionResult> {
  const cfg = visionConfigured();
  if (!cfg) {
    return {
      drafts: [],
      model: null,
      error:
        "Vision not configured. Set XAI_API_KEY or OPENAI_API_KEY (optional QSEARCH_VISION_MODEL). Flyer reading uses a cloud vision model — not a custom local model.",
    };
  }

  const apiImage = String(opts.imageUrl || "").trim();
  if (!apiImage) {
    return { drafts: [], model: cfg.model, error: "imageUrl required" };
  }

  const posterForDraft =
    opts.posterStoreUrl ||
    (apiImage.startsWith("data:") ? null : apiImage) ||
    opts.sourceUrl ||
    null;

  const yearNow = pacificCalendarYear();
  const prompt = `You extract Portland LGBTQ+ / nightlife event details from a flyer image.
Return ONLY valid JSON: {"confidence":0-1,"events":[{"title","dateStart","dateEnd","venueName","address","admission","ticketUrl","description","ageRequirement"}]}
Rules:
- dateStart/dateEnd MUST include the full year as Pacific wall times: YYYY-MM-DDTHH:mm:ss
- YEAR IS CRITICAL: use the year printed on the flyer. Never drop or invent a wrong year.
- If the flyer shows only month/day with no year: use ${yearNow} if that date is still upcoming in ${yearNow}, otherwise ${yearNow + 1}
- Do not map a 2025 event to 2026 or vice versa when the flyer shows the year
- venueHint: ${opts.venueHint || "unknown"}
- If multiple nights, multiple events (each with its own full date including year)
- No markdown`;

  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.1,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: apiImage } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { drafts: [], model: cfg.model, error: `Vision API ${res.status}: ${t.slice(0, 200)}` };
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || "";
    const jsonMatch = String(text).match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { drafts: [], model: cfg.model, error: "No JSON in vision response" };
    const parsed = JSON.parse(jsonMatch[0]);
    const conf = Number(parsed.confidence);
    const confidence = Number.isFinite(conf) ? Math.min(1, Math.max(0, conf)) : 0.5;
    const events = Array.isArray(parsed.events) ? parsed.events : [];
    const drafts: IngestEventDraft[] = [];
    for (const e of events) {
      const d = draftFromPartial(
        e,
        opts.sourceUrl || posterForDraft || apiImage.slice(0, 80),
        posterForDraft,
        confidence,
      );
      if (d) drafts.push(d);
    }
    if (!drafts.length) {
      return {
        drafts: [],
        model: cfg.model,
        error: "Vision returned no usable events (missing title/date on flyer?)",
      };
    }
    return { drafts, model: cfg.model };
  } catch (err: any) {
    return { drafts: [], model: cfg.model, error: err?.message || "Vision failed" };
  }
}

/** Read a local /uploads file into a data URL for the vision API. */
export function localUploadToDataUrl(filenameOrPath: string): string | null {
  try {
    const UPLOADS =
      process.env.UPLOADS_DIR?.trim() || path.join(process.cwd(), "uploads");
    let name = filenameOrPath;
    if (name.startsWith("/uploads/")) name = name.slice("/uploads/".length);
    name = path.basename(name);
    const full = path.join(UPLOADS, name);
    if (!existsSync(full)) return null;
    const buf = readFileSync(full);
    const ext = path.extname(name).toLowerCase();
    const mime =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".gif"
            ? "image/gif"
            : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Heuristic: image URLs that look like flyers on a page. */
export function extractFlyerImageUrls(html: string, pageUrl: string, limit = 4): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const re = /(?:src|data-src|content)\s*=\s*["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) != null && out.length < limit * 3) {
    let u = m[1];
    if (/logo|icon|sprite|avatar|emoji|pixel|1x1|spacer/i.test(u)) continue;
    try {
      u = new URL(u, pageUrl).toString();
    } catch {
      continue;
    }
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  // Prefer larger-looking paths
  out.sort((a, b) => {
    const score = (s: string) =>
      (/flyer|poster|event|promo|bill/i.test(s) ? 10 : 0) + (s.length > 80 ? 1 : 0);
    return score(b) - score(a);
  });
  return out.slice(0, limit);
}
