import type { IngestEventDraft } from "../ingest/types";
import { dayOfWeekFromStart, defaultEndFromStart, toPacificWallClock } from "../ingest/dates";

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
  let dateStart = toPacificWallClock(p.dateStart || p.start || p.date || p.when);
  if (!dateStart && p.date && p.time) {
    dateStart = toPacificWallClock(`${p.date}T${String(p.time).padStart(5, "0")}`);
  }
  if (!dateStart) {
    // low confidence stub with far future placeholder rejected
    return null;
  }
  let dateEnd = toPacificWallClock(p.dateEnd || p.end);
  if (!dateEnd) dateEnd = defaultEndFromStart(dateStart);
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
    admission: String(p.admission || "FREE"),
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
 * Flyer image URL → event draft(s) via vision API when configured.
 * Without API keys, returns error (UI can still queue paste path after human entry).
 */
export async function visionFlyerToDrafts(opts: {
  imageUrl: string;
  sourceUrl?: string | null;
  venueHint?: string | null;
}): Promise<VisionResult> {
  const cfg = visionConfigured();
  if (!cfg) {
    return {
      drafts: [],
      model: null,
      error:
        "Vision not configured. Set XAI_API_KEY or OPENAI_API_KEY (optional QSEARCH_VISION_MODEL).",
    };
  }

  const prompt = `You extract Portland LGBTQ+ / nightlife event details from a flyer image.
Return ONLY valid JSON: {"confidence":0-1,"events":[{"title","dateStart","dateEnd","venueName","address","admission","ticketUrl","description","ageRequirement"}]}
Rules:
- dateStart/dateEnd as ISO-like local Pacific wall times YYYY-MM-DDTHH:mm:ss when possible
- If year missing assume 2026
- venueHint: ${opts.venueHint || "unknown"}
- If multiple nights, multiple events
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
              { type: "image_url", image_url: { url: opts.imageUrl } },
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
      const d = draftFromPartial(e, opts.sourceUrl || opts.imageUrl, opts.imageUrl, confidence);
      if (d) drafts.push(d);
    }
    return { drafts, model: cfg.model };
  } catch (err: any) {
    return { drafts: [], model: cfg.model, error: err?.message || "Vision failed" };
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
