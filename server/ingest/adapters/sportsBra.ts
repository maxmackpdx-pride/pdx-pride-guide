/**
 * The Sports Bra - official watch-party schedule.
 *
 * Primary: public Airtable shared view embedded on
 * thesportsbraofficial.com/pages/portland (no PAT, no base collaborator
 * access required). This is the real "What's Playing in Portland" grid.
 *
 * Optional secondary: private Airtable REST API when SPORTS_BRA_AIRTABLE_TOKEN
 * has access to base appMRorYHS2sB2qeZ (many PATs only see the creator's empty
 * workspace - public share still works).
 *
 * Games with no attached flyer get a clean auto-generated Swedish-minimal
 * poster (server/posters/gamePoster.ts) so the listing never looks empty.
 */
import type { IngestEventDraft } from "../types";
import { isPastEventListing } from "../dates";

const SPORTS_BRA_VENUE = "The Sports Bra";
const SPORTS_BRA_ADDRESS = "2512 NE Broadway, Portland, OR";
const SPORTS_BRA_NEIGHBORHOOD = "NE Portland";
const DEFAULT_BASE = "appMRorYHS2sB2qeZ";
const DEFAULT_SHARE_ID = "shrE7hNEKss87unNp";
const DEFAULT_EMBED =
  process.env.SPORTS_BRA_AIRTABLE_EMBED ||
  `https://airtable.com/embed/${DEFAULT_BASE}/${DEFAULT_SHARE_ID}?layout=card`;
const AIRTABLE_API = "https://api.airtable.com/v0";

export function sportsBraToken(): string | null {
  return (
    process.env.SPORTS_BRA_AIRTABLE_TOKEN ||
    process.env.AIRTABLE_TOKEN ||
    null
  );
}

/** Always "configured" - public share needs no secret. Token is optional upgrade. */
export function sportsBraConfigured(): boolean {
  return true;
}

type AirtableRecord = { id: string; fields: Record<string, unknown>; createdTime?: string };

/** Find the field key whose name matches `re` (case-insensitive), skipping excludes. */
function pickKey(fields: Record<string, unknown>, re: RegExp, exclude?: RegExp): string | null {
  for (const k of Object.keys(fields)) {
    if (exclude && exclude.test(k)) continue;
    if (re.test(k)) return k;
  }
  return null;
}
function strVal(v: unknown): string | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v.map(strVal).filter(Boolean).join(" ") || null;
  if (typeof v === "object") {
    // Airtable select / single-collaborator shapes
    const o = v as Record<string, unknown>;
    if (typeof o.name === "string") return o.name.trim() || null;
    if (typeof o.label === "string") return o.label.trim() || null;
    return null;
  }
  const s = String(v).trim();
  return s || null;
}
/** First attachment URL from an Airtable attachment field, if any. */
function attachmentUrl(v: unknown): string | null {
  if (Array.isArray(v)) {
    for (const a of v) {
      if (a && typeof a === "object" && typeof (a as any).url === "string") return (a as any).url;
    }
  }
  return null;
}

/** "2026-08-01" (accepts ISO date or datetime) → "2026-08-01" | null */
function toIsoDate(raw: string | null): string | null {
  if (!raw) return null;
  const m = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // "July 15, 2026" / "Jul 15 2026"
  const mon = raw.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/i,
  );
  if (mon) {
    const months: Record<string, string> = {
      jan: "01",
      january: "01",
      feb: "02",
      february: "02",
      mar: "03",
      march: "03",
      apr: "04",
      april: "04",
      may: "05",
      jun: "06",
      june: "06",
      jul: "07",
      july: "07",
      aug: "08",
      august: "08",
      sep: "09",
      sept: "09",
      september: "09",
      oct: "10",
      october: "10",
      nov: "11",
      november: "11",
      dec: "12",
      december: "12",
    };
    const mm = months[mon[1].toLowerCase()];
    if (mm) return `${mon[3]}-${mm}-${mon[2].padStart(2, "0")}`;
  }
  // "8/1/2026" or "8/1/26"
  const s = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (s) {
    const yr = s[3].length === 2 ? `20${s[3]}` : s[3];
    return `${yr}-${s[1].padStart(2, "0")}-${s[2].padStart(2, "0")}`;
  }
  return null;
}
/** "7:30 PM" | "19:30" | "7pm" → { hhmm:"19:30", label:"7:30 PM" } | null */
function parseTime(raw: string | null): { hhmm: string; label: string } | null {
  if (!raw) return null;
  const m = raw.match(/(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const ap = (m[3] || "").toLowerCase().replace(/\./g, "");
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  const hhmm = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const label = `${h12}:${String(min).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  return { hhmm, label };
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** "2026-08-01" → { label:"Sat · Aug 1", dow:"Saturday" } (UTC-safe, no TZ drift) */
function dateLabelParts(iso: string): { label: string; dow: string } {
  const [y, mo, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  const dow = DOW[dt.getUTCDay()];
  const full = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
    dt.getUTCDay()
  ];
  return { label: `${dow} · ${MONTHS[mo - 1]} ${d}`, dow: full };
}

/**
 * Shared-view formula cells look like:
 *   "July 15, 2026 - 🥎 Blaze vs Bandits"
 *   "July 15, 2026 - ⚽ Orlando Pride vs Boston Legacy FC"
 */
export function parseMatchupCell(raw: string | null | undefined): {
  iso: string | null;
  matchup: string | null;
  away: string | null;
  home: string | null;
} {
  const stripEmoji = (t: string) =>
    t
      .replace(/[\u2600-\u27BF]/g, " ") // misc symbols (⚽ etc.)
      .replace(/[\u{1F000}-\u{1FAFF}]/gu, " ") // emoji blocks
      .replace(/[\uFE0E\uFE0F]/g, "") // emoji variation selectors
      .replace(/\s+/g, " ")
      .trim();
  const s = stripEmoji(String(raw || ""));
  if (!s) return { iso: null, matchup: null, away: null, home: null };
  const iso = toIsoDate(s);
  // After date, optional dash, then matchup
  let rest = s
    .replace(
      /^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\s*[-–—:]?\s*/i,
      "",
    )
    .replace(/^\d{4}-\d{2}-\d{2}\s*[-–—:]?\s*/i, "")
    .trim();
  if (!rest) rest = s;
  rest = stripEmoji(rest);
  const vs = rest.match(/^(.+?)\s+vs\.?\s+(.+)$/i);
  if (vs) {
    const away = stripEmoji(vs[1]);
    const home = stripEmoji(vs[2]);
    // Airtable formula often does "Tournament vs Tournament" for singles - collapse
    if (away.toLowerCase() === home.toLowerCase()) {
      return { iso, matchup: away, away, home: null };
    }
    return {
      iso,
      matchup: `${away} vs ${home}`,
      away,
      home,
    };
  }
  return { iso, matchup: rest || null, away: rest || null, home: null };
}

export type SportsBraParseOpts = {
  /** Base URL for the generated-poster endpoint (default relative). */
  posterBase?: string;
  includePast?: boolean;
};

/** Map a single Airtable game row → draft (null if it isn't a datable game). */
export function recordToDraft(
  fields: Record<string, unknown>,
  opts: SportsBraParseOpts = {},
): IngestEventDraft | null {
  // Prefer explicit date field; else parse from matchup formula ("July 15, 2026 - …")
  const dateKey = pickKey(fields, /date|day/i, /update|created|end|matchup|event/i);
  let iso = toIsoDate(strVal(dateKey ? fields[dateKey] : null));

  // Prefer real matchup/title columns - NOT "Main Event" (flag) which also matches /main|event/
  const matchupKey = pickKey(
    fields,
    /matchup|match\b|game|title|name|\bvs\b/i,
    /main\s*event|time|date|league|note|detail/i,
  );
  let matchupRaw = strVal(matchupKey ? fields[matchupKey] : null);
  let parsed = parseMatchupCell(matchupRaw);
  if (!iso) iso = parsed.iso;
  // Shared view: formula column often named "2025 Matchup" - also scan all string cells
  if (!iso || !parsed.matchup) {
    for (const [k, v] of Object.entries(fields)) {
      if (/time|league|main\s*event/i.test(k)) continue;
      const p = parseMatchupCell(strVal(v));
      if (p.iso || (p.matchup && /vs/i.test(p.matchup))) {
        if (!iso) iso = p.iso;
        if (!parsed.matchup || (p.away && p.home)) {
          parsed = p;
          matchupRaw = strVal(v);
        }
        if (iso && parsed.away) break;
      }
    }
  }
  if (!iso) return null; // no date → not a schedulable game

  // Time: dedicated field, or embedded in the date field if it was a datetime.
  const timeKey = pickKey(fields, /time|kickoff|start|tip|first\s*pitch|puck|pt\)/i, /date|update/i);
  let time =
    parseTime(strVal(timeKey ? fields[timeKey] : null)) ||
    parseTime(strVal(dateKey ? fields[dateKey] : null));

  const league =
    strVal(fields[pickKey(fields, /league|sport|competition|comp/i) || ""]) || "Game Day";

  // Teams: separate home/away/opponent, or matchup formula string.
  const awayKey = pickKey(fields, /away|visitor|team\s*a|opponent/i);
  const homeKey = pickKey(fields, /home|team\s*b/i, /away|main/i);
  let away = strVal(awayKey ? fields[awayKey] : null);
  let home = strVal(homeKey ? fields[homeKey] : null);
  if (!away && !home) {
    away = parsed.away;
    home = parsed.home;
  }
  if (!away && !home && matchupRaw) {
    away = parsed.matchup || matchupRaw;
  }
  if (!away && !home) away = "Women's Sports";

  const noteKey = pickKey(fields, /note|detail|desc|info/i, /main/i);
  const note = strVal(noteKey ? fields[noteKey] : null) || "";
  const mainFlag = strVal(fields[pickKey(fields, /main\s*event|featured|flag/i) || ""]);

  const title = home ? `${away} vs ${home}` : String(away);
  const dl = dateLabelParts(iso);
  const warnings: string[] = [];
  if (!time) {
    time = { hhmm: "12:00", label: "See Bar" };
    warnings.push("Game time missing in Airtable - defaulted; verify before publishing");
  }
  const dateStart = `${iso}T${time.hhmm}`;

  // Poster: a real attachment wins; otherwise generate the Swedish-minimal one.
  const attached = attachmentUrl(
    fields[pickKey(fields, /flyer|poster|image|graphic|attach/i) || ""],
  );
  let posterImageUrl = attached;
  if (!posterImageUrl) {
    const base = opts.posterBase || "";
    const q = new URLSearchParams({
      league,
      tag: "Watch Party",
      away: String(away),
      date: dl.label,
      time: time.label,
    });
    if (home) q.set("home", home);
    posterImageUrl = `${base}/api/game-poster?${q.toString()}`;
  }

  const description =
    note ||
    [
      title,
      mainFlag && /main|star|feature/i.test(mainFlag) ? "(Main Event)" : null,
      `- watch party at The Sports Bra, Portland's women's sports bar.`,
    ]
      .filter(Boolean)
      .join(" ");

  return {
    title,
    description,
    venueName: SPORTS_BRA_VENUE,
    address: SPORTS_BRA_ADDRESS,
    neighborhood: SPORTS_BRA_NEIGHBORHOOD,
    lat: null,
    lng: null,
    dateStart,
    dateEnd: "",
    dayOfWeek: dl.dow,
    ageRequirement: "ALL_AGES",
    eventTypes: "[]",
    admission: "UNKNOWN", // never invent FREE; bar is a restaurant, entry usually open but unconfirmed
    ticketUrl: null,
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    posterImageUrl,
    eventPageUrl: "https://thesportsbraofficial.com/pages/portland",
    sourceUrl: "https://thesportsbraofficial.com/pages/portland",
    parseSource: "airtable",
    warnings,
  };
}

/** Map a batch of Airtable records → drafts (drops past + undatable). */
export function parseSportsBraRecords(
  records: AirtableRecord[],
  opts: SportsBraParseOpts = {},
): IngestEventDraft[] {
  const out: IngestEventDraft[] = [];
  for (const rec of records || []) {
    const draft = recordToDraft(rec.fields || {}, opts);
    if (!draft) continue;
    if (!opts.includePast && isPastEventListing(draft)) continue;
    out.push(draft);
  }
  return out;
}

type SharedCol = {
  id: string;
  name: string;
  typeOptions?: {
    /** Live shared views: choices is a map id → {name,color}. Arrays also accepted. */
    choices?:
      | Array<{ id: string; name: string }>
      | Record<string, { id?: string; name?: string; label?: string; color?: string }>;
    choiceOrder?: string[];
    choicesById?: Record<string, { id?: string; name?: string; label?: string }>;
  };
};

/**
 * Map public shared-view JSON rows (cellValuesByColumnId + columns[]) → drafts.
 * Exported for offline smoke fixtures.
 */
export function parseSportsBraSharedView(
  payload: {
    data?: {
      table?: {
        columns?: SharedCol[];
        rows?: Array<{ id?: string; cellValuesByColumnId?: Record<string, unknown> }>;
      };
    };
  },
  opts: SportsBraParseOpts = {},
): IngestEventDraft[] {
  const table = payload?.data?.table;
  const columns = table?.columns || [];
  const rows = table?.rows || [];
  const nameById = new Map(columns.map(c => [c.id, c.name]));
  const choiceName = (col: SharedCol, id: string): string | null => {
    const ch = col.typeOptions?.choices;
    if (Array.isArray(ch)) {
      const hit = ch.find(c => c.id === id);
      if (hit?.name) return hit.name;
    } else if (ch && typeof ch === "object") {
      const hit = (ch as Record<string, { name?: string; label?: string }>)[id];
      if (hit?.name) return hit.name;
      if (hit?.label) return hit.label;
    }
    const byId = col.typeOptions?.choicesById?.[id];
    if (byId?.name) return byId.name;
    if (byId?.label) return byId.label;
    return null;
  };
  const records: AirtableRecord[] = rows.map((row, i) => {
    const fields: Record<string, unknown> = {};
    for (const [cid, val] of Object.entries(row.cellValuesByColumnId || {})) {
      const name = nameById.get(cid) || cid;
      let resolved: unknown = val;
      if (typeof val === "string" && /^sel/i.test(val)) {
        const col = columns.find(c => c.id === cid);
        const label = col ? choiceName(col, val) : null;
        if (label) resolved = label;
      }
      fields[name] = resolved;
    }
    return { id: row.id || `row-${i}`, fields };
  });
  return parseSportsBraRecords(records, opts);
}

async function airtableGet(url: string, token: string): Promise<any> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    throw new Error(`Airtable ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  return res.json();
}

/** Discover a table name if not configured - prefers one named for the schedule. */
async function discoverTable(base: string, token: string): Promise<string | null> {
  try {
    const meta = await airtableGet(`${AIRTABLE_API}/meta/bases/${base}/tables`, token);
    const tables: Array<{ name: string }> = meta?.tables || [];
    if (!tables.length) return null;
    const pref = tables.find(t => /portland|schedule|game|watch|event/i.test(t.name));
    return (pref || tables[0]).name;
  } catch {
    return null;
  }
}

/**
 * Public shared view - no PAT. Reads the same embed the bar puts on their site.
 */
export async function fetchSportsBraPublicShare(
  opts: SportsBraParseOpts = {},
): Promise<{ drafts: IngestEventDraft[]; warnings: string[] }> {
  const warnings: string[] = [];
  const embedUrl = DEFAULT_EMBED;
  try {
    const embedRes = await fetch(embedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ZaylistBot/1.0; +https://www.zaylist.com; Sports Bra schedule)",
        Accept: "text/html",
      },
    });
    if (!embedRes.ok) {
      return {
        drafts: [],
        warnings: [`Sports Bra public embed HTTP ${embedRes.status}`],
      };
    }
    const html = await embedRes.text();
    const m = html.match(/urlWithParams:\s*"([^"]+)"/);
    if (!m) {
      return {
        drafts: [],
        warnings: ["Sports Bra public embed missing readSharedViewData URL"],
      };
    }
    const path = m[1].replace(/\\u002F/g, "/").replace(/\\u0026/g, "&");
    // path may still have unicode escapes
    const decoded = path.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    );
    const dataUrl = decoded.startsWith("http")
      ? decoded
      : `https://airtable.com${decoded.startsWith("/") ? "" : "/"}${decoded}`;

    const appId = process.env.SPORTS_BRA_AIRTABLE_BASE || DEFAULT_BASE;
    const dataRes = await fetch(dataUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ZaylistBot/1.0; +https://www.zaylist.com; Sports Bra schedule)",
        "x-airtable-application-id": appId,
        "X-Requested-With": "XMLHttpRequest",
        "x-airtable-inter-service-client": "webClient",
        "x-time-zone": "America/Los_Angeles",
        "x-user-locale": "en",
        Accept: "application/json",
      },
    });
    if (!dataRes.ok) {
      return {
        drafts: [],
        warnings: [`Sports Bra shared view HTTP ${dataRes.status}`],
      };
    }
    const payload = await dataRes.json();
    if (payload?.msg && payload.msg !== "SUCCESS") {
      return {
        drafts: [],
        warnings: [`Sports Bra shared view msg=${payload.msg}`],
      };
    }
    const drafts = parseSportsBraSharedView(payload, opts);
    if (!drafts.length) {
      warnings.push("Sports Bra public share returned 0 upcoming games");
    } else {
      warnings.push(`Sports Bra schedule via public shared view (${drafts.length} upcoming)`);
    }
    return { drafts, warnings };
  } catch (err) {
    warnings.push(
      `Sports Bra public share failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    return { drafts: [], warnings };
  }
}

async function fetchSportsBraPrivateApi(
  opts: SportsBraParseOpts = {},
): Promise<{ drafts: IngestEventDraft[]; warnings: string[] }> {
  const token = sportsBraToken();
  if (!token) return { drafts: [], warnings: ["SPORTS_BRA_AIRTABLE_TOKEN not set"] };
  const base = process.env.SPORTS_BRA_AIRTABLE_BASE || DEFAULT_BASE;
  const warnings: string[] = [];
  try {
    const table =
      process.env.SPORTS_BRA_AIRTABLE_TABLE || (await discoverTable(base, token));
    if (!table) {
      return { drafts: [], warnings: ["Could not resolve Sports Bra Airtable table"] };
    }
    const view = process.env.SPORTS_BRA_AIRTABLE_VIEW;
    const records: AirtableRecord[] = [];
    let offset: string | undefined;
    let pages = 0;
    do {
      const params = new URLSearchParams({ pageSize: "100" });
      if (view) params.set("view", view);
      if (offset) params.set("offset", offset);
      const url = `${AIRTABLE_API}/${base}/${encodeURIComponent(table)}?${params.toString()}`;
      const data = await airtableGet(url, token);
      for (const r of data?.records || []) records.push(r);
      offset = data?.offset;
      pages++;
    } while (offset && pages < 10);
    const drafts = parseSportsBraRecords(records, opts);
    warnings.push(`Sports Bra schedule via private Airtable API (${drafts.length} upcoming)`);
    return { drafts, warnings };
  } catch (err) {
    warnings.push(
      `Sports Bra private API failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    return { drafts: [], warnings };
  }
}

/**
 * Live fetch: public shared view first (always works for the bar's embed),
 * then private PAT if configured. Returns [] (never throws) if both fail -
 * trustedSync may fall back to venue-scoped Eventbrite.
 */
export async function fetchSportsBraDrafts(
  opts: SportsBraParseOpts = {},
): Promise<{ drafts: IngestEventDraft[]; warnings: string[] }> {
  const publicHit = await fetchSportsBraPublicShare(opts);
  if (publicHit.drafts.length) return publicHit;

  const privateHit = await fetchSportsBraPrivateApi(opts);
  if (privateHit.drafts.length) {
    return {
      drafts: privateHit.drafts,
      warnings: [...publicHit.warnings, ...privateHit.warnings],
    };
  }

  return {
    drafts: [],
    warnings: [
      ...publicHit.warnings,
      ...privateHit.warnings,
      "Sports Bra: no games from public share or private API",
    ],
  };
}
