/**
 * The Sports Bra - official watch-party schedule from their Airtable base.
 *
 * The bar publishes the games it's showing in an Airtable (embedded on
 * thesportsbraofficial.com/pages/portland). We read that base via Airtable's
 * official REST API with a Personal Access Token (data.records:read) - this
 * replaces the old Eventbrite keyword search that pulled city-wide "sports"
 * noise (church pickleball, barbell certs, etc.).
 *
 * Config (env - token is a SECRET, set on Railway, never commit):
 *   SPORTS_BRA_AIRTABLE_TOKEN   (falls back to AIRTABLE_TOKEN)
 *   SPORTS_BRA_AIRTABLE_BASE    (default appMRorYHS2sB2qeZ)
 *   SPORTS_BRA_AIRTABLE_TABLE   (optional - auto-discovered from the base if unset)
 *   SPORTS_BRA_AIRTABLE_VIEW    (optional - restrict to one view)
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
const AIRTABLE_API = "https://api.airtable.com/v0";

export function sportsBraToken(): string | null {
  return (
    process.env.SPORTS_BRA_AIRTABLE_TOKEN ||
    process.env.AIRTABLE_TOKEN ||
    null
  );
}
export function sportsBraConfigured(): boolean {
  return Boolean(sportsBraToken());
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
  if (typeof v === "object") return null;
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
  const full = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dt.getUTCDay()];
  return { label: `${dow} · ${MONTHS[mo - 1]} ${d}`, dow: full };
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
  const dateKey = pickKey(fields, /date|day/i, /update|created|end/i);
  const iso = toIsoDate(strVal(dateKey ? fields[dateKey] : null));
  if (!iso) return null; // no date → not a schedulable game

  // Time: dedicated field, or embedded in the date field if it was a datetime.
  const timeKey = pickKey(fields, /time|kickoff|start|tip|first\s*pitch|puck/i, /date/i);
  let time =
    parseTime(strVal(timeKey ? fields[timeKey] : null)) ||
    parseTime(strVal(dateKey ? fields[dateKey] : null));

  const league =
    strVal(fields[pickKey(fields, /league|sport|competition|comp/i) || ""]) || "Game Day";

  // Teams: separate home/away/opponent, or a single matchup/title string.
  const awayKey = pickKey(fields, /away|visitor|team\s*a|opponent/i);
  const homeKey = pickKey(fields, /home|team\s*b/i, /away/i);
  const matchupKey = pickKey(fields, /match|matchup|game|event|title|name|vs/i);
  let away = strVal(awayKey ? fields[awayKey] : null);
  let home = strVal(homeKey ? fields[homeKey] : null);
  if (!away && !home) {
    away = strVal(matchupKey ? fields[matchupKey] : null);
  }
  if (!away && !home) away = "Women's Sports";

  const noteKey = pickKey(fields, /note|detail|desc|info/i);
  const note = strVal(noteKey ? fields[noteKey] : null) || "";

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
    `${title} - watch party at The Sports Bra, Portland's women's sports bar.`;

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
    const pref = tables.find((t) => /portland|schedule|game|watch|event/i.test(t.name));
    return (pref || tables[0]).name;
  } catch {
    return null;
  }
}

/**
 * Live fetch: read the Sports Bra Airtable and return game drafts. Returns []
 * (never throws) if unconfigured or the API is unreachable - the caller then
 * falls back to the (now venue-scoped) Eventbrite feed so the venue isn't empty.
 */
export async function fetchSportsBraDrafts(
  opts: SportsBraParseOpts = {},
): Promise<{ drafts: IngestEventDraft[]; warnings: string[] }> {
  const token = sportsBraToken();
  if (!token) return { drafts: [], warnings: ["SPORTS_BRA_AIRTABLE_TOKEN not set - using fallback feed"] };
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
    return { drafts: parseSportsBraRecords(records, opts), warnings };
  } catch (err) {
    warnings.push(`Sports Bra Airtable fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    return { drafts: [], warnings };
  }
}
