/**
 * Flyer structured parsing - Phase 2 of the Flyer Reader.
 *
 * OCR text → LLM → strict JSON event fields. LLM resolution order:
 *   1. GROQ_API_KEY (brief's preference - OpenAI-compatible, cheap)
 *   2. XAI_API_KEY / OPENAI_API_KEY (already configured for qsearch/vision.ts)
 * With no key configured, a deterministic heuristic parser still returns
 * best-effort fields (low confidence, warning attached) so dev never breaks.
 *
 * Output schema (per project brief): title, start_date, end_date, time,
 * venue, address, description, url, qr_info, confidence, raw_text - plus an
 * IngestEventDraft for direct QSearch use (Phase 3).
 */
import type { IngestEventDraft } from "../ingest/types";
import { dayOfWeekFromStart, defaultEndFromStart } from "../ingest/dates";
import { inferAdmissionFromText } from "../ingest/admissionInfer";

export type FlyerParse = {
  title: string | null;
  start_date: string | null; // YYYY-MM-DD
  end_date: string | null;
  time: string | null; // "21:00" 24h
  venue: string | null;
  address: string | null;
  description: string | null;
  url: string | null;
  qr_info: string | null;
  /** 0-100 blended parse confidence */
  confidence: number;
  raw_text: string;
  model: string | null;
  warnings: string[];
};

type LlmConfig = { base: string; key: string; model: string; label: string };

/** Hard kill switch: FLYER_LLM_DISABLED=1 stops ALL paid LLM/vision calls. */
function llmKilled(): boolean {
  return process.env.FLYER_LLM_DISABLED === "1";
}

export function flyerLlmConfigured(): LlmConfig | null {
  if (llmKilled()) return null;
  const groq = process.env.GROQ_API_KEY?.trim();
  if (groq) {
    return {
      base: "https://api.groq.com/openai/v1",
      key: groq,
      model: process.env.FLYER_LLM_MODEL?.trim() || "llama-3.3-70b-versatile",
      label: "groq",
    };
  }
  const key = process.env.XAI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || "";
  if (!key) return null;
  const base =
    process.env.XAI_API_BASE?.trim() ||
    (process.env.XAI_API_KEY ? "https://api.x.ai/v1" : "https://api.openai.com/v1");
  const model =
    process.env.FLYER_LLM_MODEL?.trim() ||
    (process.env.XAI_API_KEY ? "grok-3-mini" : "gpt-4o-mini");
  return { base: base.replace(/\/$/, ""), key, model, label: "vision-env" };
}

/**
 * Vision-capable model config - the title-accuracy lever. Stylized flyer
 * lettering OCRs to soup; a vision model reads the art directly. Same
 * provider order as text: Groq → XAI → OpenAI.
 */
export function flyerVisionConfigured(): LlmConfig | null {
  if (llmKilled()) return null;
  // Free first: Gemini multimodal free tier (same as qsearch/vision.ts)
  const gemini = process.env.GEMINI_API_KEY?.trim();
  if (gemini) {
    return {
      base: "https://generativelanguage.googleapis.com/v1beta/openai",
      key: gemini,
      model: process.env.FLYER_VISION_MODEL?.trim() || "gemini-2.0-flash",
      label: "gemini-vision",
    };
  }
  const groq = process.env.GROQ_API_KEY?.trim();
  if (groq) {
    return {
      base: "https://api.groq.com/openai/v1",
      key: groq,
      model:
        process.env.FLYER_VISION_MODEL?.trim() ||
        "meta-llama/llama-4-scout-17b-16e-instruct",
      label: "groq-vision",
    };
  }
  const key = process.env.XAI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || "";
  if (!key) return null;
  const base =
    process.env.XAI_API_BASE?.trim() ||
    (process.env.XAI_API_KEY ? "https://api.x.ai/v1" : "https://api.openai.com/v1");
  // Prefer an env override; otherwise use a placeholder that 400s into
  // discoverVisionModel (grok-2-vision-latest is retired on current xAI).
  const model =
    process.env.FLYER_VISION_MODEL?.trim() ||
    (process.env.XAI_API_KEY ? "grok-2-vision-latest" : "gpt-4o-mini");
  return { base: base.replace(/\/$/, ""), key, model, label: "vision" };
}

/** Pull the first JSON object out of an LLM reply (tolerates fences/prose). */
export function coerceFlyerJson(text: string): Record<string, unknown> | null {
  const raw = String(text || "");
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] || raw;
  const start = fenced.indexOf("{");
  if (start < 0) return null;
  // Walk to the matching close brace
  let depth = 0;
  for (let i = start; i < fenced.length; i++) {
    if (fenced[i] === "{") depth++;
    else if (fenced[i] === "}") {
      depth--;
      if (depth === 0) {
        try {
          const parsed = JSON.parse(fenced.slice(start, i + 1));
          return parsed && typeof parsed === "object" ? parsed : null;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** "SAT AUG 8" / "August 8th" / "8/8" → YYYY-MM-DD (next occurrence). */
export function heuristicDate(text: string, now = new Date()): string | null {
  const t = String(text || "");
  let month = 0;
  let day = 0;

  const named = t.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/i,
  );
  if (named) {
    month = MONTHS[named[1].slice(0, 3).toLowerCase()] || 0;
    day = Number(named[2]);
  } else {
    const numeric = t.match(/\b(\d{1,2})[\/.](\d{1,2})(?:[\/.](\d{2,4}))?\b/);
    if (numeric) {
      month = Number(numeric[1]);
      day = Number(numeric[2]);
      if (numeric[3]) {
        const y = Number(numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3]);
        if (y >= 2000 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        }
      }
    }
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  // Flyers omit the year - pick the CLOSEST occurrence: flyers are usually
  // scanned near their event date, so a date up to ~45 days past stays in
  // the current year (a Pride flyer scanned the week after must not roll a
  // year forward); older than that rolls to next year.
  const explicitYear = t.match(/\b(20\d{2})\b/);
  let year = explicitYear ? Number(explicitYear[1]) : now.getFullYear();
  if (!explicitYear) {
    const candidate = new Date(year, month - 1, day, 23, 59);
    if (candidate.getTime() < now.getTime() - 45 * 24 * 3600_000) year += 1;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** "9PM" / "9:30 pm" / "21:00" → "HH:MM" 24h. */
export function heuristicTime(text: string): string | null {
  const t = String(text || "");
  const ampm = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (ampm) {
    let h = Number(ampm[1]) % 12;
    if (/pm/i.test(ampm[3])) h += 12;
    return `${String(h).padStart(2, "0")}:${ampm[2] || "00"}`;
  }
  const h24 = t.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (h24) return `${String(Number(h24[1])).padStart(2, "0")}:${h24[2]}`;
  return null;
}

/** No-LLM fallback: heuristic field extraction from OCR text. */
export function heuristicFlyerParse(rawText: string, now = new Date()): FlyerParse {
  const lines = String(rawText || "")
    .split(/\n+/)
    .map(l => l.trim())
    .filter(l => l.length >= 3);

  // Title: first prominent top line that isn't a date/time/address line
  const isMetaLine = (l: string) =>
    /\b(am|pm)\b/i.test(l) ||
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(l) ||
    /\b\d{1,2}[\/.]\d{1,2}\b/.test(l) ||
    /\b\d{1,5}\s+(?:N|S|E|W|NE|NW|SE|SW)\b/i.test(l) ||
    /^https?:\/\//i.test(l) ||
    /\bdoors?\b/i.test(l);
  const top = lines.slice(0, 5).filter(l => /[a-z]/i.test(l));
  const title = top.find(l => !isMetaLine(l)) || top.sort((a, b) => b.length - a.length)[0] || lines[0] || null;

  const url = String(rawText || "").match(/https?:\/\/[^\s"'<>\\)\]]+|(?:www\.)[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s]*)?/i)?.[0] || null;

  return {
    title: title ? title.slice(0, 200) : null,
    start_date: heuristicDate(rawText, now),
    end_date: null,
    time: heuristicTime(rawText),
    venue: null,
    address: String(rawText || "").match(/\b\d{1,5}\s+(?:N|S|E|W|NE|NW|SE|SW)\s+[A-Za-z0-9 .]+?(?:St|Ave|Blvd|Rd|Way|Dr|Ln|Ct)\b\.?/i)?.[0] || null,
    description: null,
    url,
    qr_info: null,
    confidence: 25,
    raw_text: rawText,
    model: null,
    warnings: ["LLM not configured - heuristic parse only (set GROQ_API_KEY)"],
  };
}

const PARSE_PROMPT = `You extract structured event data from OCR text of nightlife/community event flyers (Portland, Oregon context). OCR text is noisy - infer carefully, never invent.

Return ONLY a JSON object with exactly these keys:
{"title": string|null, "start_date": "YYYY-MM-DD"|null, "end_date": "YYYY-MM-DD"|null, "time": "HH:MM" 24h|null, "venue": string|null, "address": string|null, "description": string|null, "url": string|null, "qr_info": string|null, "confidence": 0-100}

Rules:
- Unknown → null. NEVER guess an address or venue not present in the text.
- "title" is the EVENT NAME - usually the visually dominant words. It is NOT a DJ/performer/host name, not the venue, not a date, not a sponsor, not ticket text. Prefer a short distinctive name ("Treasure Trail", "Gaylabration: Radiance") over lineup words.
- Flyers usually omit the year: choose the year that puts the date CLOSEST to today (given below). A date within the last ~6 weeks is this year's PAST event - do NOT roll it a year forward. Only pick next year when the date would otherwise be months in the past.
- Overnight events: if the end time is after midnight (e.g. "9PM-3AM"), "end_date" is the NEXT calendar day after start_date.
- "url": include the scheme - if the flyer prints "WWW.EXAMPLE.COM", return "https://www.example.com".
- "description" = one clean sentence summarizing the event from the text, not a transcript.
- "qr_info" = text near any QR mention (e.g. "scan for tickets"), else null.
- "confidence" = your honest overall extraction confidence.`;

export async function structureFlyerText(
  rawText: string,
  opts?: { ocrConfidence?: number; now?: Date; fetchImpl?: typeof fetch },
): Promise<FlyerParse> {
  const cfg = flyerLlmConfigured();
  const now = opts?.now ?? new Date();
  if (!cfg) {
    const fallback = heuristicFlyerParse(rawText, now);
    if (opts?.ocrConfidence != null) {
      fallback.confidence = Math.round(Math.min(fallback.confidence, opts.ocrConfidence));
    }
    return fallback;
  }

  const fetchImpl = opts?.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetchImpl(`${cfg.base}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.key}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0,
        messages: [
          { role: "system", content: PARSE_PROMPT },
          {
            role: "user",
            content: `Today is ${now.toISOString().slice(0, 10)}.\n\nOCR TEXT:\n${String(rawText || "").slice(0, 12_000)}`,
          },
        ],
      }),
    });
    if (!res.ok) {
      throw new Error(`LLM HTTP ${res.status}`);
    }
    const data: any = await res.json();
    const content = String(data?.choices?.[0]?.message?.content || "");
    const json = coerceFlyerJson(content);
    if (!json) throw new Error("LLM returned no parseable JSON");

    const str = (k: string) => {
      const v = json[k];
      return v == null || v === "" ? null : String(v).trim().slice(0, 500) || null;
    };
    // Normalize scheme-less URLs ("WWW.BEARRACUDA.COM" → https://www.bearracuda.com)
    let url = str("url");
    if (url && !/^https?:\/\//i.test(url)) {
      url = /^[a-z0-9.-]+\.[a-z]{2,}([\/?#]|$)/i.test(url) ? `https://${url.toLowerCase()}` : url;
    }

    const llmConf = Math.max(0, Math.min(100, Number(json.confidence) || 0));
    // Blend: LLM confidence dampened by OCR quality (garbage in, garbage out)
    const ocrConf = opts?.ocrConfidence;
    const confidence = Math.round(
      ocrConf != null ? llmConf * (0.5 + 0.5 * Math.min(ocrConf, 100) / 100) : llmConf,
    );

    return {
      title: str("title"),
      start_date: str("start_date"),
      end_date: str("end_date"),
      time: str("time"),
      venue: str("venue"),
      address: str("address"),
      description: json.description == null ? null : String(json.description).trim().slice(0, 4000) || null,
      url,
      qr_info: str("qr_info"),
      confidence,
      raw_text: rawText,
      model: `${cfg.label}:${cfg.model}`,
      warnings: [],
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const fallback = heuristicFlyerParse(rawText, now);
    fallback.warnings = [`LLM parse failed (${message.slice(0, 120)}) - heuristic fallback`];
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

/** Runtime-discovered vision model per provider base (per-process memory). */
const discoveredVisionModels = new Map<string, string>();

/**
 * Secondary vision provider - Groq's current lineup has NO multimodal models
 * (verified via /models 2026-07: text/audio/safety only), so when Groq is the
 * primary key, vision falls through to XAI (grok-2-vision, already used by
 * qsearch/vision.ts) or OpenAI when configured.
 */
export function fallbackVisionConfigured(primary: LlmConfig | null): LlmConfig | null {
  if (llmKilled()) return null;

  // If primary already is Gemini, offer XAI/OpenAI as secondary; otherwise
  // offer Gemini when not already primary (primary prefers Gemini now).
  const gemini = process.env.GEMINI_API_KEY?.trim();
  const geminiBase = "https://generativelanguage.googleapis.com/v1beta/openai";
  if (gemini && (!primary || primary.base !== geminiBase)) {
    return {
      base: geminiBase,
      key: gemini,
      model: process.env.FLYER_VISION_MODEL_FALLBACK?.trim() || "gemini-2.0-flash",
      label: "gemini-vision",
    };
  }

  const key = process.env.XAI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || "";
  if (!key) return null;
  const base = (
    process.env.XAI_API_BASE?.trim() ||
    (process.env.XAI_API_KEY ? "https://api.x.ai/v1" : "https://api.openai.com/v1")
  ).replace(/\/$/, "");
  if (primary && primary.base === base) return null; // same provider - no point
  const model =
    process.env.FLYER_VISION_MODEL_FALLBACK?.trim() ||
    (process.env.XAI_API_KEY ? "grok-2-vision-latest" : "gpt-4o-mini");
  return { base, key, model, label: process.env.XAI_API_KEY ? "xai-vision" : "openai-vision" };
}

/**
 * Ask the provider which vision-capable models exist and pick the best.
 * Self-healing against model deprecations: a 404 becomes a discovery pass +
 * warning, never a silent text-path regression.
 */
export async function discoverVisionModel(
  cfg: { base: string; key: string },
  fetchImpl: typeof fetch = fetch,
): Promise<{ id: string | null; candidates: string[]; debug: string }> {
  try {
    const res = await fetchImpl(`${cfg.base}/models`, {
      headers: { Authorization: `Bearer ${cfg.key}` },
    });
    if (!res.ok) return { id: null, candidates: [], debug: `/models HTTP ${res.status}` };
    const data: any = await res.json();
    const ids: string[] = (Array.isArray(data?.data) ? data.data : [])
      .map((m: any) => String(m?.id || ""))
      .filter(Boolean);
    const clean = (id: string) => id.replace(/^models\//, "");
    // Drop non-vision / non-chat junk (incl. pure image-gen & video)
    const junk =
      /embed|tts|audio|live|veo|whisper|guard|safeguard|orpheus|imagine-video|imagine-image|compound/i;
    const rank = (raw: string) => {
      const id = clean(raw);
      if (junk.test(id)) return 0;
      // Prefer real vision/multimodal chat models
      if (/gemini-2\.5-flash(?!-preview-tts)/i.test(id)) return 8;
      if (/gemini[.-\d]*.*flash/i.test(id) && !/tts|preview-tts/i.test(id)) return 7;
      if (/scout/i.test(id)) return 6;
      if (/maverick/i.test(id)) return 5;
      if (/grok.*vision|vision.*grok|grok-2-vision|grok-4.*vision/i.test(id)) return 5;
      if (/vision|llava|pixtral|\bvl\b|-vl-|4o/i.test(id)) return 4;
      if (/gemini/i.test(id) && !/tts/i.test(id)) return 3;
      if (/llama-4/i.test(id)) return 2;
      // Last resort: current Grok chat models sometimes accept images
      if (/^grok-4/i.test(id) && !/imagine/i.test(id)) return 1;
      return 0;
    };
    const isPreview = (id: string) => (/preview|exp|latest-unstable/i.test(id) ? 1 : 0);
    const candidates = ids
      .filter(id => rank(id) > 0)
      .map(clean)
      // rank desc → stable before preview/exp (previews often have zero free
      // quota) → newest version on remaining ties
      .sort((a, b) => rank(b) - rank(a) || isPreview(a) - isPreview(b) || b.localeCompare(a));
    const debug = `/models ok: ${ids.length} models, sample=[${ids.slice(0, 10).join(", ")}]`;
    return { id: candidates[0] || null, candidates, debug };
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : String(err);
    return { id: null, candidates: [], debug: `/models fetch failed: ${m.slice(0, 80)}` };
  }
}

export type StructureFlyerOpts = {
  /** Original flyer image - enables the vision pass (title authority). */
  imageBuffer?: Buffer | null;
  rawText: string;
  ocrConfidence?: number;
  now?: Date;
  fetchImpl?: typeof fetch;
};

/**
 * Vision-first structuring: when the flyer image is available and a vision
 * model is configured, the model reads the IMAGE directly (stylized display
 * type never survives OCR) with the OCR text attached as a hint. Falls back
 * to the text-only path (then heuristics) on any failure.
 */
export async function structureFlyer(opts: StructureFlyerOpts): Promise<FlyerParse> {
  // Provider chain up front: primary (Groq/XAI/OpenAI) AND/OR the free
  // fallback (Gemini). Vision runs if ANY provider is configured - a
  // Gemini-only setup must not silently skip vision.
  const primary = opts.imageBuffer ? flyerVisionConfigured() : null;
  const fallbackCfg = opts.imageBuffer ? fallbackVisionConfigured(primary) : null;
  const providers = [primary, fallbackCfg].filter((c): c is LlmConfig => Boolean(c));
  if (!opts.imageBuffer || providers.length === 0) {
    return structureFlyerText(opts.rawText, opts);
  }

  const now = opts.now ?? new Date();
  const fetchImpl = opts.fetchImpl ?? fetch;

  // Downscale once for token cost - 1024px wide JPEG is plenty for flyer type
  let dataUrl: string;
  try {
    const sharp = (await import("sharp")).default;
    const jpeg = await sharp(opts.imageBuffer, { failOn: "none" })
      .rotate()
      .resize({ width: 1024, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    dataUrl = `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const fallback = await structureFlyerText(opts.rawText, opts);
    fallback.warnings = Array.from(
      new Set([`Vision skipped (image decode failed: ${message.slice(0, 120)})`, ...fallback.warnings]),
    );
    return fallback;
  }

  // Each provider failure leaves a breadcrumb; only when every provider
  // fails do we drop to text.
  const chainWarnings: string[] = [];

  for (const provider of providers) {
    try {
      return await attemptVisionProvider(provider, dataUrl, opts.rawText, now, fetchImpl, chainWarnings);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      chainWarnings.push(`Vision via ${provider.label} failed (${message.slice(0, 300)})`);
    }
  }

  const fallback = await structureFlyerText(opts.rawText, opts);
  fallback.warnings = Array.from(new Set([...chainWarnings, "All vision providers failed - text fallback", ...fallback.warnings]));
  return fallback;
}

/** One provider attempt: call → self-heal via /models discovery → strict parse. */
async function attemptVisionProvider(
  cfg: LlmConfig,
  dataUrl: string,
  rawText: string,
  now: Date,
  fetchImpl: typeof fetch,
  chainWarnings: string[],
): Promise<FlyerParse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000);
  try {
    const callVision = (model: string) =>
      fetchImpl(`${cfg.base}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.key}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          messages: [
            { role: "system", content: PARSE_PROMPT },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Today is ${now.toISOString().slice(0, 10)}.\n\nRead the flyer IMAGE directly - it is authoritative, especially for the stylized title text. Noisy OCR text as a secondary hint:\n${String(rawText || "").slice(0, 6000)}`,
                },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
        }),
      });

    const visionWarnings: string[] = [];
    let modelUsed = discoveredVisionModels.get(cfg.base) || cfg.model;
    let res = await callVision(modelUsed);

    // Self-healing: unknown/inaccessible model → ask the provider what vision
    // models exist, retry once with the best candidate, remember it
    // per-process. 429 included: on a first call it usually means "model not
    // in your tier / zero quota" (Gemini), not real rate pressure.
    if (
      (res.status === 404 || res.status === 400 || res.status === 429) &&
      !discoveredVisionModels.has(cfg.base)
    ) {
      const found = await discoverVisionModel(cfg, fetchImpl);
      const tried: string[] = [modelUsed];
      for (const cand of found.candidates.slice(0, 4)) {
        if (tried.includes(cand)) continue;
        tried.push(cand);
        res = await callVision(cand);
        if (res.ok) {
          visionWarnings.push(
            `Vision model ${cfg.model} unavailable (HTTP ${tried.length === 2 ? "404/429" : "…"}) - auto-discovered ${cand}`,
          );
          discoveredVisionModels.set(cfg.base, cand);
          modelUsed = cand;
          break;
        }
        if (![400, 404, 429].includes(res.status)) break; // real error - stop burning candidates
      }
      if (!res.ok) {
        // Surface exactly what was tried + offered so the report explains
        // itself (key access tier, renamed models, previews without quota…).
        throw new Error(
          `Vision HTTP ${res.status}; tried [${tried.join(", ")}]. ${found.debug}`,
        );
      }
    }

    if (!res.ok) throw new Error(`Vision LLM HTTP ${res.status} (model ${modelUsed})`);
    const data: any = await res.json();
    const content = String(data?.choices?.[0]?.message?.content || "");
    const json = coerceFlyerJson(content);
    if (!json) throw new Error("Vision LLM returned no parseable JSON");

    const str = (k: string) => {
      const v = json[k];
      return v == null || v === "" ? null : String(v).trim().slice(0, 500) || null;
    };
    let url = str("url");
    if (url && !/^https?:\/\//i.test(url)) {
      url = /^[a-z0-9.-]+\.[a-z]{2,}([\/?#]|$)/i.test(url) ? `https://${url.toLowerCase()}` : url;
    }
    return {
      title: str("title"),
      start_date: str("start_date"),
      end_date: str("end_date"),
      time: str("time"),
      venue: str("venue"),
      address: str("address"),
      description:
        json.description == null ? null : String(json.description).trim().slice(0, 4000) || null,
      url,
      qr_info: str("qr_info"),
      confidence: Math.max(0, Math.min(100, Math.round(Number(json.confidence) || 0))),
      raw_text: rawText,
      model: `${cfg.label}:${modelUsed}`,
      warnings: [...chainWarnings, ...visionWarnings],
    };
  } finally {
    clearTimeout(timer);
  }
}

/** FlyerParse → IngestEventDraft for the QSearch pipeline (Phase 3 bridge). */
export function flyerParseToDraft(
  parse: FlyerParse,
  opts?: { sourcePath?: string | null },
): IngestEventDraft | null {
  if (!parse.title || !parse.start_date) return null;
  const time = parse.time || "20:00";
  const dateStart = `${parse.start_date}T${time}:00`;
  const dateEnd = parse.end_date
    ? `${parse.end_date}T${time}:00`
    : defaultEndFromStart(dateStart);

  const adm = inferAdmissionFromText(parse.title, `${parse.description || ""} ${parse.raw_text}`);

  return {
    title: parse.title.slice(0, 200),
    description: (parse.description || `${parse.title}.`).slice(0, 8000),
    venueName: parse.venue || "TBA",
    address: parse.address,
    neighborhood: null,
    lat: null,
    lng: null,
    dateStart,
    dateEnd,
    dayOfWeek: dayOfWeekFromStart(dateStart),
    ageRequirement: "ALL_AGES",
    eventTypes: "[]",
    admission: adm.admission,
    ticketUrl: parse.url,
    eventPageUrl: parse.url,
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    posterImageUrl: null,
    sourceUrl: opts?.sourcePath ? `github:${opts.sourcePath}` : null,
    parseSource: "flyer-reader",
    warnings: [
      `Flyer Reader parse (confidence ${parse.confidence})`,
      ...(parse.warnings || []),
    ],
  };
}
