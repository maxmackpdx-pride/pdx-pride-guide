// AI "scrub" for QSearch candidates — a semantic pass over the survivors of the
// cheap deterministic filters. Reuses the flyer-reader text-LLM provider chain
// (Groq → xAI → OpenAI, honoring FLYER_LLM_DISABLED), so no new keys/SDKs.
//
// One classifier call per candidate returns relevance/noise, safety flags,
// category, cleaned fields, and a dedup verdict. We: score + reason every
// candidate, auto-deselect the weak ones, AUTO-DROP clear non-events (logged +
// restorable, never a silent delete), stamp safety flags on catch-all drafts
// that have none, clean weak titles/venues/descriptions, and firm up the
// uncertain-band duplicate decision. Any failure leaves the candidate untouched.
//
// Gated by QSEARCH_SCRUB_LLM=1. Off ⇒ pure passthrough (byte-identical output).

import { flyerLlmConfigured, coerceFlyerJson } from "../flyerReader/parse";
import type { ScanCandidate } from "./analyze";

/** Below this relevance a candidate is unchecked (kept, but not pre-selected). */
const DESELECT_BELOW = 0.5;
/** Below this relevance AND not-an-event ⇒ auto-dropped (to the restorable list). */
const DROP_BELOW = 0.2;
/** submissionMatch score band we treat as "uncertain" and worth an LLM opinion. */
const DUP_BAND_LO = 48;
const DUP_BAND_HI = 72;

/**
 * Product pause: the generic cloud classifier is not the intended custom
 * fine-tuned QSearch model. Keep deterministic ingest + human Review running,
 * but do not send candidates through this scrub until the custom model returns.
 */
export const QSEARCH_AI_SCRUB_PAUSED = true;

export type ScrubDrop = { candidate: ScanCandidate; reason: string };
export type ScrubOutcome = { kept: ScanCandidate[]; dropped: ScrubDrop[] };

type ScrubVerdict = {
  relevance: number; // 0..1
  isEvent: boolean;
  noiseReason: string | null;
  category: string | null;
  ageFlag: "ALL_AGES" | "18_PLUS" | "21_PLUS" | null;
  sexPositive: boolean;
  kink: boolean;
  cleanTitle: string | null;
  cleanVenue: string | null;
  cleanDescription: string | null;
  dupVerdict: "same" | "series" | "different" | null;
};

export function scrubLlmEnabled(): boolean {
  return !QSEARCH_AI_SCRUB_PAUSED && process.env.QSEARCH_SCRUB_LLM === "1" && flyerLlmConfigured() != null;
}

function envInt(name: string, dflt: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : dflt;
}

const SYSTEM_PROMPT = `You are the review gate for Zaylist, a year-round guide to PORTLAND, OREGON's LGBTQ+ nightlife, events, and community (bars, clubs, drag, dance/music nights, queer markets, kink/sex-positive parties, community meetups).

You judge one scraped candidate event. Return ONLY strict JSON, no prose:
{
  "relevance": 0.0-1.0,        // how confidently this is a real, upcoming, Portland-area LGBTQ+/queer-scene event
  "isEvent": true|false,       // false for venue promos, merch drops, "open hours" listings, classes/schools, non-events
  "noiseReason": string|null,  // short reason when relevance is low or isEvent false (else null)
  "category": "bar|club|drag|music|market|social|kink|community|other",
  "ageFlag": "ALL_AGES|18_PLUS|21_PLUS"|null,   // only if clearly stated/implied; else null
  "sexPositive": true|false,   // sex-positive / play party
  "kink": true|false,          // kink/fetish/leather themed
  "cleanTitle": string|null,       // corrected title ONLY if the given one is broken/garbled; else null
  "cleanVenue": string|null,       // real venue name ONLY if given venue is "TBA"/missing/wrong; else null
  "cleanDescription": string|null, // 1-2 sentence human description ONLY if given one is boilerplate/stub; else null
  "dupVerdict": "same|series|different"|null   // only answer if a possibleDuplicate is provided
}

Rules:
- Be generous about queer relevance: a night at a known queer venue, drag, ballroom, t4t, leather, Pride, etc. all count. When unsure but plausibly scene-related, score ~0.5, not low.
- Only score LOW (<0.2) and isEvent=false for things clearly NOT this: church/school sports, corporate trainings, generic fitness certs, straight sports leagues, real-estate/MLM, out-of-town events, or venue pages that aren't an actual event.
- Never invent facts. Leave clean* fields null unless the given value is genuinely broken.`;

function candidateSnapshot(c: ScanCandidate): Record<string, unknown> {
  const d = c.draft;
  const dup = c.strongDuplicate || c.duplicates?.[0] || null;
  const inBand = dup && dup.score >= DUP_BAND_LO && dup.score <= DUP_BAND_HI;
  return {
    title: d.title,
    venue: d.venueName,
    address: d.address || null,
    date: (d.dateStart || "").slice(0, 16),
    dayOfWeek: d.dayOfWeek || null,
    source: c.sourceLabel,
    url: d.eventPageUrl || d.ticketUrl || c.sourceUrl || null,
    description: (d.description || "").replace(/\s+/g, " ").slice(0, 600),
    possibleDuplicate: inBand
      ? { title: dup!.title, score: dup!.score, note: dup!.note }
      : null,
  };
}

async function classifyOne(
  c: ScanCandidate,
  cfg: NonNullable<ReturnType<typeof flyerLlmConfigured>>,
  fetchImpl: typeof fetch,
): Promise<ScrubVerdict | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetchImpl(`${cfg.base}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.key}` },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(candidateSnapshot(c)) },
        ],
      }),
    });
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
    const data: any = await res.json();
    const json = coerceFlyerJson(String(data?.choices?.[0]?.message?.content || ""));
    if (!json) return null;
    const num = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0.5;
    };
    const str = (v: unknown) => {
      const s = v == null ? "" : String(v).trim();
      return s ? s.slice(0, 500) : null;
    };
    const age = str(json.ageFlag);
    return {
      relevance: num(json.relevance),
      isEvent: json.isEvent !== false,
      noiseReason: str(json.noiseReason),
      category: str(json.category),
      ageFlag: age === "18_PLUS" || age === "21_PLUS" || age === "ALL_AGES" ? age : null,
      sexPositive: json.sexPositive === true,
      kink: json.kink === true,
      cleanTitle: str(json.cleanTitle),
      cleanVenue: str(json.cleanVenue),
      cleanDescription: json.cleanDescription == null ? null : String(json.cleanDescription).trim().slice(0, 2000) || null,
      dupVerdict:
        json.dupVerdict === "same" || json.dupVerdict === "series" || json.dupVerdict === "different"
          ? json.dupVerdict
          : null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Weak venue value that generic parsers leave behind. */
function isWeakVenue(v: string | null | undefined): boolean {
  const s = String(v || "").trim();
  return !s || /^(tba|tbd|n\/?a|unknown|venue)$/i.test(s);
}

/** Boilerplate/stub description worth replacing. */
function isWeakDescription(d: string | null | undefined, title: string): boolean {
  const s = String(d || "").trim();
  if (s.length < 24) return true;
  if (new RegExp(`^${title}\\s+at\\b`, "i").test(s)) return true; // "{title} at {venue}." stub
  return false;
}

function applyVerdict(c: ScanCandidate, v: ScrubVerdict): void {
  const d = c.draft;
  d.aiScrubbed = true;
  d.relevanceScore = v.relevance;
  d.relevanceReason = v.noiseReason || null;
  if (v.category) d.category = v.category;

  // #1 relevance → pre-selection (don't touch cards the human already can't pick)
  if (v.relevance < DESELECT_BELOW) c.selected = false;
  if (v.noiseReason) d.warnings = [...(d.warnings || []), `AI: ${v.noiseReason}`];

  // #2 safety flags — only fill catch-all defaults, never override a real stamp
  const untouchedSafety = d.ageRequirement === "ALL_AGES" && !d.isSexPositive && !d.nudityOk;
  if (untouchedSafety) {
    if (v.ageFlag && v.ageFlag !== "ALL_AGES") d.ageRequirement = v.ageFlag;
    if (v.sexPositive) d.isSexPositive = true;
    if (v.kink) {
      let types: string[] = [];
      try {
        const parsed = JSON.parse(d.eventTypes || "[]");
        if (Array.isArray(parsed)) types = parsed.map(String).filter(Boolean);
      } catch {
        // Legacy malformed values are normalized back to valid JSON here.
        types = String(d.eventTypes || "")
          .split(",")
          .map(s => s.trim())
          .filter(s => s && s !== "[]");
      }
      if (!types.includes("KINK")) types.push("KINK");
      d.eventTypes = JSON.stringify(types);
    }
  }

  // #3 field cleanup — only when the model is confident and the value is weak
  if (v.relevance >= DESELECT_BELOW) {
    if (v.cleanVenue && isWeakVenue(d.venueName)) {
      d.warnings = [...(d.warnings || []), `AI venue: "${d.venueName}" → "${v.cleanVenue}"`];
      d.venueName = v.cleanVenue;
    }
    if (v.cleanTitle && v.cleanTitle.toLowerCase() !== String(d.title || "").toLowerCase() && d.title.length < 4) {
      d.warnings = [...(d.warnings || []), `AI title: "${d.title}" → "${v.cleanTitle}"`];
      d.title = v.cleanTitle;
    }
    if (v.cleanDescription && isWeakDescription(d.description, d.title)) {
      d.description = v.cleanDescription;
    }
  }

  // #4 dedup band — only firm up the uncertain middle; only "different" is a safe auto-correction
  const dup = c.strongDuplicate;
  if (dup && dup.score >= DUP_BAND_LO && dup.score <= DUP_BAND_HI) {
    if (v.dupVerdict === "different") {
      c.strongDuplicate = null;
      d.warnings = [...(d.warnings || []), `AI: not a duplicate of #${dup.eventId}`];
    } else if (v.dupVerdict === "series") {
      d.warnings = [...(d.warnings || []), `AI: same recurring series as #${dup.eventId}`];
    }
  }
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/**
 * Classify + clean the candidates. Returns the kept set (in original order) and
 * the auto-dropped set (clear non-events). Pure passthrough when disabled or on
 * total failure — never throws.
 */
export async function scrubCandidates(
  candidates: ScanCandidate[],
  opts?: { fetchImpl?: typeof fetch; allowPausedForTest?: boolean },
): Promise<ScrubOutcome> {
  const cfg = flyerLlmConfigured();
  if ((!opts?.allowPausedForTest && !scrubLlmEnabled()) || !cfg || candidates.length === 0) {
    return { kept: candidates, dropped: [] };
  }
  const fetchImpl = opts?.fetchImpl ?? fetch;
  const max = envInt("QSEARCH_SCRUB_MAX", 60);
  const toScrub = candidates.slice(0, max);
  const overflow = candidates.slice(max);
  for (const c of overflow) c.draft.aiScrubbed = false;

  const verdicts = await mapLimit(toScrub, 4, c => classifyOne(c, cfg, fetchImpl));

  const kept: ScanCandidate[] = [];
  const dropped: ScrubDrop[] = [];
  toScrub.forEach((c, i) => {
    const v = verdicts[i];
    if (!v) {
      c.draft.aiScrubbed = false; // classify failed → leave the candidate as-is
      kept.push(c);
      return;
    }
    applyVerdict(c, v);
    if (!v.isEvent && v.relevance < DROP_BELOW) {
      dropped.push({ candidate: c, reason: v.noiseReason || "AI: not a relevant event" });
    } else {
      kept.push(c);
    }
  });
  // overflow keeps original order after the scrubbed ones (they were the tail)
  kept.push(...overflow);
  return { kept, dropped };
}
