// Vision flyer QA for QSearch candidates — the counterpart to the text scrub.
//
// Two jobs, both using the existing cloud vision config (visionConfigured():
// Gemini → xAI → OpenAI, honoring FLYER_LLM_DISABLED):
//   VERIFY  — does the attached poster actually match this event? Sets
//             draft.flyerMatch + reason and flags mismatch / logo / wrong-date.
//             Flag-only: a precious-but-wrong flyer is left for the human, never
//             auto-stripped.
//   REPAIR  — when there's no poster or the attached one looks wrong, pick the
//             CORRECT image from the alternatives already in hand (cross-source
//             bundle posters, series-mate posters) — cheapest-first, capped,
//             first confident match wins. Never attaches a guessed-wrong image.
//
// Gated by QSEARCH_SCRUB_FLYER_VISION=1. Off ⇒ pure passthrough. Never throws.

import type { ScanCandidate } from "./analyze";
import { visionConfigured, localUploadToDataUrl } from "./vision";

/** Poster clearly matches ⇒ no flag. */
const MATCH_OK = 0.6;
/** Below this the attached poster is treated as suspect → try to repair. */
const MATCH_SUSPECT = 0.4;
/** A replacement must clear this to be attached. */
const ATTACH_MIN = 0.6;

export function flyerVisionEnabled(): boolean {
  return process.env.QSEARCH_SCRUB_FLYER_VISION === "1" && visionConfigured() != null;
}

function envInt(name: string, dflt: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : dflt;
}

type FlyerCheck = {
  isEventFlyer: boolean;
  isLogo: boolean;
  match: number; // 0..1
  readsTitle: string | null;
  readsDate: string | null; // YYYY-MM-DD when legible
  readsVenue: string | null;
  reason: string;
};

const PROMPT = `You are checking whether an image is the correct promotional FLYER for a specific event.
You are given the event's title, venue and date, and one image. Return ONLY strict JSON:
{"isEventFlyer":bool,"isLogo":bool,"match":0.0-1.0,"readsTitle":string|null,"readsDate":"YYYY-MM-DD"|null,"readsVenue":string|null,"reason":string}
- isEventFlyer: true if this is an event promo poster/flyer (not a bare venue logo, headshot, menu, or website chrome).
- isLogo: true if it's just a brand/venue logo or icon.
- match: how well the flyer's own title/date/venue match the given event (1 = clearly the same event, 0 = clearly different).
- readsTitle/readsDate/readsVenue: what YOU read off the image (null if illegible). Never copy from the given event; report what the image shows.
- Be strict about the date: if the flyer shows a different day than the event, match must be low.`;

/** Convert a local /uploads path to a data URL; pass through remote https URLs. */
function toApiImage(url: string): string | null {
  const u = String(url || "").trim();
  if (!u) return null;
  if (u.startsWith("data:")) return u;
  if (u.startsWith("/uploads/") || (!u.startsWith("http") && !u.startsWith("//"))) {
    return localUploadToDataUrl(u);
  }
  if (/^https?:\/\//i.test(u)) return u;
  return null;
}

async function checkImage(
  imageUrl: string,
  event: { title: string; venue: string; date: string },
  cfg: NonNullable<ReturnType<typeof visionConfigured>>,
  fetchImpl: typeof fetch,
): Promise<FlyerCheck | null> {
  const apiImage = toApiImage(imageUrl);
  if (!apiImage) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetchImpl(cfg.url, {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${cfg.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `${PROMPT}\n\nEVENT:\n${JSON.stringify(event)}`,
              },
              { type: "image_url", image_url: { url: apiImage } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    const text = String(data?.choices?.[0]?.message?.content || "");
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const j = JSON.parse(m[0]);
    const num = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0.5;
    };
    const str = (v: unknown) => {
      const s = v == null ? "" : String(v).trim();
      return s ? s.slice(0, 200) : null;
    };
    return {
      isEventFlyer: j.isEventFlyer !== false,
      isLogo: j.isLogo === true,
      match: num(j.match),
      readsTitle: str(j.readsTitle),
      readsDate: str(j.readsDate),
      readsVenue: str(j.readsVenue),
      reason: str(j.reason) || "",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** In-memory alternative poster URLs for a candidate (no network needed). */
function alternativeImages(c: ScanCandidate): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (u?: string | null) => {
    const s = String(u || "").trim();
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  };
  if (c.draft.posterImageUrl) seen.add(c.draft.posterImageUrl); // exclude the current one
  for (const b of c.sourceBundle || []) add(b.posterImageUrl);
  for (const md of c.memberDrafts || []) add(md.posterImageUrl);
  return out;
}

function dayOf(iso?: string | null): string | null {
  const m = String(iso || "").match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

export type FlyerQaSummary = { checked: number; flagged: number; repaired: number };

/**
 * Verify + repair flyers on the kept candidates in place. Returns a small
 * summary for logging. Pure passthrough when disabled; never throws.
 */
export async function verifyAndRepairFlyers(
  candidates: ScanCandidate[],
  opts?: { fetchImpl?: typeof fetch },
): Promise<FlyerQaSummary> {
  const cfg = visionConfigured();
  if (!flyerVisionEnabled() || !cfg || candidates.length === 0) {
    return { checked: 0, flagged: 0, repaired: 0 };
  }
  const fetchImpl = opts?.fetchImpl ?? fetch;
  const max = envInt("QSEARCH_SCRUB_FLYER_MAX", 40);
  const perCandidateAlts = 3;
  let checked = 0;
  let flagged = 0;
  let repaired = 0;

  for (const c of candidates.slice(0, max)) {
    const d = c.draft;
    const event = { title: d.title, venue: d.venueName, date: dayOf(d.dateStart) || "" };
    const warn = (w: string) => {
      d.warnings = [...(d.warnings || []), w];
    };

    let suspect = !d.posterImageUrl; // no flyer at all counts as "needs repair"
    if (d.posterImageUrl) {
      const chk = await checkImage(d.posterImageUrl, event, cfg, fetchImpl);
      if (chk) {
        checked++;
        d.flyerMatch = chk.match;
        d.flyerMatchReason = chk.reason || null;
        const dateReads = chk.readsDate;
        const wrongDate = dateReads && event.date && dateReads !== event.date;
        if (chk.isLogo) {
          warn("AI flyer: looks like a logo, not an event flyer");
          suspect = true;
          flagged++;
        } else if (chk.match < MATCH_SUSPECT || wrongDate) {
          warn(`AI flyer: possible mismatch (${chk.reason || "low match"})`);
          suspect = true;
          flagged++;
        } else if (chk.match < MATCH_OK) {
          warn("AI flyer: weak match — double-check");
          flagged++;
        }
      }
    }

    if (!suspect) continue;

    // Repair: try the in-memory alternatives, cheapest-first, first match wins.
    const alts = alternativeImages(c).slice(0, perCandidateAlts);
    for (const alt of alts) {
      const chk = await checkImage(alt, event, cfg, fetchImpl);
      checked++;
      if (chk && !chk.isLogo && chk.isEventFlyer && chk.match >= ATTACH_MIN) {
        d.posterImageUrl = alt;
        d.flyerMatch = chk.match;
        d.flyerMatchReason = `AI-selected flyer (${chk.reason || "match"})`;
        warn("AI flyer: replaced with a better-matching image");
        repaired++;
        break;
      }
    }
  }

  return { checked, flagged, repaired };
}
