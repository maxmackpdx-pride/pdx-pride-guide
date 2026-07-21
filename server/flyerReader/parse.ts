/**
 * Flyer structured parsing — Phase 2 of the Flyer Reader.
 *
 * OCR text → LLM → strict JSON event fields. LLM resolution order:
 *   1. GROQ_API_KEY (brief's preference — OpenAI-compatible, cheap)
 *   2. XAI_API_KEY / OPENAI_API_KEY (already configured for qsearch/vision.ts)
 * With no key configured, a deterministic heuristic parser still returns
 * best-effort fields (low confidence, warning attached) so dev never breaks.
 *
 * Output schema (per project brief): title, start_date, end_date, time,
 * venue, address, description, url, qr_info, confidence, raw_text — plus an
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

export function flyerLlmConfigured(): LlmConfig | null {
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

  // Flyers omit the year — pick this year, roll forward if it already passed
  const explicitYear = t.match(/\b(20\d{2})\b/);
  let year = explicitYear ? Number(explicitYear[1]) : now.getFullYear();
  if (!explicitYear) {
    const candidate = new Date(year, month - 1, day, 23, 59);
    if (candidate.getTime() < now.getTime() - 24 * 3600_000) year += 1;
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
    warnings: ["LLM not configured — heuristic parse only (set GROQ_API_KEY)"],
  };
}

const PARSE_PROMPT = `You extract structured event data from OCR text of nightlife/community event flyers (Portland, Oregon context). OCR text is noisy — infer carefully, never invent.

Return ONLY a JSON object with exactly these keys:
{"title": string|null, "start_date": "YYYY-MM-DD"|null, "end_date": "YYYY-MM-DD"|null, "time": "HH:MM" 24h|null, "venue": string|null, "address": string|null, "description": string|null, "url": string|null, "qr_info": string|null, "confidence": 0-100}

Rules:
- Unknown → null. NEVER guess an address or venue not present in the text.
- Flyers usually omit the year: pick the NEXT occurrence relative to today (given below).
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
      url: str("url"),
      qr_info: str("qr_info"),
      confidence,
      raw_text: rawText,
      model: `${cfg.label}:${cfg.model}`,
      warnings: [],
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const fallback = heuristicFlyerParse(rawText, now);
    fallback.warnings = [`LLM parse failed (${message.slice(0, 120)}) — heuristic fallback`];
    return fallback;
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
