/**
 * Permanently closed / relocated venues — hard blacklist for QSearch + directory auto-ingest.
 *
 * Eventbrite caches and keyword dumps re-list dead bars years after close.
 * Directory Places status CLOSED hides discovery; this module blocks *drafts*
 * by normalized venueName (+ optional address rules).
 *
 * Matching is strict (normalized keys / word boundaries) — never bare
 * String.includes("crush") which would kill "Woman Crush Wednesdays".
 */
import { normalizeVenueKey } from "./venueLinks";

export type ClosedVenueBlockMode = "name" | "name_old_address";

export type ClosedVenueEntry = {
  id: string;
  /** Display name for logs / directory seed */
  label: string;
  /** Normalized name keys (via normalizeVenueKey). Prefer multi-word aliases. */
  names: string[];
  /** Host fragments to block as scrape URLs */
  hosts?: string[];
  /** YYYY-MM-DD when known; YYYY-MM or YYYY when only partial */
  closedAt: string;
  /** Live successor place (directory / remap hints) */
  successor?: string;
  note: string;
  /**
   * name — reject any draft whose venueName matches aliases
   * name_old_address — only reject when name matches AND address looks like old site
   *   (e.g. Scandals downtown Harvey Milk — NE Alberta is still live)
   */
  blockMode?: ClosedVenueBlockMode;
  /** Address needles (lowercase) for name_old_address mode */
  oldAddressNeedles?: string[];
  /** Seed / ensure a CLOSED directory row */
  seedDirectory?: boolean;
  address?: string;
  neighborhood?: string;
};

/**
 * Recent + historic permanent closures. Curated from Meta AI audit + PDX knowledge.
 * Scandals is NOT fully closed — only old downtown address is blocked.
 */
export const CLOSED_PERMANENT_VENUES: ClosedVenueEntry[] = [
  // ── Last ~2 years (high resurrection risk) ─────────────────────────────
  {
    id: "crush-bar",
    label: "Crush Bar",
    names: ["crush bar", "crush bar pdx", "crushbar"],
    hosts: ["crushbarpdx.com", "instagram.com/crushbarpdx"],
    closedAt: "2025-01-01",
    successor: "Peacock PDX",
    address: "1400 SE Morrison St",
    neighborhood: "SE Portland",
    note: "CLOSED_PERMANENT_2025-01-01 — Buckman bar; space is Peacock PDX. Never scrape @crushbarpdx.",
    seedDirectory: true,
  },
  {
    id: "sissy-bar",
    label: "Sissy Bar",
    names: ["sissy bar", "sissybar"],
    closedAt: "2024-10-26",
    note: "Operated 2022–2024; closed after Halloween 2024.",
    seedDirectory: true,
  },
  {
    id: "doc-maries",
    label: "Doc Marie's",
    names: ["doc maries", "doc marie s", "doc maries bar", "doc marie"],
    closedAt: "2025-10-01",
    note: "Lesbian bar SE Buckman; closed permanently Oct 2025.",
    seedDirectory: true,
    neighborhood: "SE Portland",
  },
  {
    id: "misfits-bar",
    label: "Misfits Bar and Lounge",
    names: ["misfits bar and lounge", "misfits bar", "misfits lounge", "misfits bar lounge"],
    closedAt: "2025-01-01",
    note: "Queer hangout closed 2025.",
    seedDirectory: true,
  },
  {
    id: "embers-avenue",
    label: "Embers Avenue",
    names: ["embers avenue", "embers ave", "embers pdx", "club embers"],
    closedAt: "2024-11-01",
    note: "Opened 1969 Old Town; closed late 2024.",
    seedDirectory: true,
    neighborhood: "Old Town Chinatown",
  },
  {
    id: "the-uncanny",
    label: "The Uncanny",
    names: ["the uncanny", "uncanny bar", "uncanny pdx"],
    closedAt: "2026-05-01",
    note: "Est. 2023; closed permanently May 2026.",
    seedDirectory: true,
  },
  // ── Older (keep blacklisted) ───────────────────────────────────────────
  {
    id: "local-lounge",
    label: "Local Lounge",
    names: ["local lounge", "the local lounge"],
    hosts: [],
    closedAt: "2021-01-01",
    address: "3536 NE MLK Jr Blvd",
    note: "Closed 2021.",
    seedDirectory: false,
  },
  {
    id: "hobos",
    label: "Hobo's",
    names: ["hobos", "hobo s", "hobos restaurant", "hobos bar"],
    closedAt: "2020-01-01",
    note: "Closed during COVID 2020.",
    seedDirectory: false,
  },
  {
    id: "queens-head",
    label: "The Queen's Head",
    names: ["the queens head", "queens head", "queen s head pdx"],
    closedAt: "2022-01-01",
    note: "Closed 2022.",
    seedDirectory: false,
  },
  {
    id: "the-roxy",
    label: "The Roxy",
    names: ["the roxy", "roxy diner", "the roxy diner", "roxy portland"],
    closedAt: "2022-03-01",
    address: "SW Harvey Milk St",
    note: "LGBTQ-friendly diner; closed March 2022. Not generic band 'Roxy'.",
    seedDirectory: false,
  },
  {
    id: "shine-distillery",
    label: "Shine Distillery and Grill",
    names: ["shine distillery and grill", "shine distillery", "shine grill"],
    closedAt: "2023-01-01",
    note: "Closed 2023.",
    seedDirectory: false,
  },
  // ── Relocated (address-aware only) ─────────────────────────────────────
  {
    id: "scandals-downtown",
    label: "Scandals (downtown / former)",
    names: ["scandals", "scandals pdx", "scandals bar", "scandals east"],
    closedAt: "2025-01-01",
    successor: "Scandals East",
    blockMode: "name_old_address",
    oldAddressNeedles: [
      "harvey milk",
      "sw stark",
      "southwest stark",
      "1125 sw",
      "downtown",
      "gayborhood",
    ],
    note: "Scandals moved to NE Alberta 2025 — only old downtown/Harvey Milk addresses are blocked. Scandals East stays live.",
    seedDirectory: false,
  },
];

export type ClosedVenueMatch = {
  entry: ClosedVenueEntry;
  reason: string;
};

function nameKeysMatch(venueKey: string, alias: string): boolean {
  if (!venueKey || !alias) return false;
  if (venueKey === alias) return true;
  const aliasParts = alias.split(" ").filter(Boolean);
  const venueParts = venueKey.split(" ").filter(Boolean);

  // Multi-word alias: every alias token present as a whole word in venue
  // (e.g. "doc marie s" matches "doc maries lounge"; not bare "marie")
  if (aliasParts.length >= 2) {
    const vset = new Set(venueParts);
    if (aliasParts.every(p => vset.has(p))) return true;
    // Venue is longer form containing full alias string
    if (alias.length >= 6 && venueKey.includes(alias)) return true;
  }

  // Single-token alias only if long enough and exact token in venue (never "crush" alone)
  if (aliasParts.length === 1 && alias.length >= 7) {
    return venueParts.includes(alias);
  }

  return false;
}

function addressLooksOld(address: string | null | undefined, needles: string[]): boolean {
  const a = String(address || "").toLowerCase();
  if (!a.trim()) return false;
  return needles.some(n => a.includes(n.toLowerCase()));
}

/**
 * Match a draft/listing against the permanent closed list.
 * Uses venueName primarily; address only for name_old_address mode.
 */
export function matchClosedVenue(input: {
  venueName?: string | null;
  address?: string | null;
  title?: string | null;
}): ClosedVenueMatch | null {
  const venueKey = normalizeVenueKey(input.venueName || "");
  if (!venueKey) return null;

  for (const entry of CLOSED_PERMANENT_VENUES) {
    const nameHit = entry.names.some(n => nameKeysMatch(venueKey, normalizeVenueKey(n)));
    if (!nameHit) continue;

    const mode = entry.blockMode || "name";
    if (mode === "name_old_address") {
      // Scandals East at NE Alberta: name matches "scandals" but address is new → allow
      const needles = entry.oldAddressNeedles || [];
      if (!addressLooksOld(input.address, needles)) {
        // Also block if venueName is clearly "Scandals" downtown without NE Alberta markers
        // and address is empty? Don't — empty address on Scandals East listings would false-positive.
        continue;
      }
      return {
        entry,
        reason: `closed_permanent:${entry.id}:old_address`,
      };
    }

    return {
      entry,
      reason: `closed_permanent:${entry.id}`,
    };
  }
  return null;
}

export function isClosedPermanentVenueName(name: string | null | undefined): boolean {
  return matchClosedVenue({ venueName: name }) != null;
}

export function isClosedPermanentScrapeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return CLOSED_PERMANENT_VENUES.some(v =>
    (v.hosts || []).some(h => lower.includes(h.toLowerCase())),
  );
}

/** Canonical closed_at for SQL (prefer full YYYY-MM-DD). */
export function closedAtIso(entry: ClosedVenueEntry): string {
  const c = entry.closedAt;
  if (/^\d{4}-\d{2}-\d{2}$/.test(c)) return c;
  if (/^\d{4}-\d{2}$/.test(c)) return `${c}-01`;
  if (/^\d{4}$/.test(c)) return `${c}-01-01`;
  return c.slice(0, 10);
}

/** Whether event start is on/after permanent close (post-close resurrection). */
export function isEventAfterVenueClose(
  dateStart: string | null | undefined,
  closedAt: string,
): boolean {
  if (!dateStart) return true; // unknown start → treat as post-close for safety on blacklist
  const day = String(dateStart).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return true;
  const close = closedAtIso({ closedAt } as ClosedVenueEntry);
  return day >= close.slice(0, 10);
}
