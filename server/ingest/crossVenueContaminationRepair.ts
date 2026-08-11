/**
 * One-time / boot repair for cross-venue contamination already on the board.
 *
 * Classes:
 * 1. Camp Bar Karaoke (etc.) carrying Eagle Wix posters and/or Eagle ticket URLs
 * 2. Sanctuary nights carrying Game Bang flyer art when the title is not Game Bang
 *
 * Pure plan helpers + async re-enrich for Sanctuary pages after posters are cleared.
 */

import type { Event } from "@shared/schema";
import { normalizeVenueKey } from "@shared/venueLinks";
import type { IngestEventDraft } from "./types";
import { enrichDraftFromEventPage } from "./enrichEventPage";

const CAMP_HOME = "https://campbarpdx.com";
const NOTE_CAMP =
  "Repair cross-venue contamination: cleared foreign (Eagle) poster/ticket on Camp Bar listing.";
const NOTE_SANCTUARY =
  "Repair cross-venue contamination: cleared Game Bang flyer on non-Game Bang Sanctuary night.";
const NOTE_REENRICH = "Repair: re-enriched flyer from Sanctuary event page.";

export function isGameBangPosterUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /gamebang/i.test(url);
}

export function titleIsGameBang(title: string | null | undefined): boolean {
  const t = String(title || "").toLowerCase();
  return /\bgame\s*bang\b/.test(t);
}

export function isWixStaticPosterUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /wixstatic\.com|wix:image:\/\//i.test(url);
}

export function isEagleHostedUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /eagleportland\.com|wixstatic\.com|wix:image:\/\//i.test(url);
}

export function isCampBarVenue(venueName: string | null | undefined): boolean {
  const k = normalizeVenueKey(venueName || "");
  // "Camp Bar PDX" → camp bar; avoid matching Triangle Recreation Camp / Camp TRC
  if (!k) return false;
  if (k.includes("triangle") || k.includes("trc") || k.includes("recreation")) return false;
  return k === "camp bar" || k.startsWith("camp bar ") || k === "camp";
}

export function isSanctuaryVenue(venueName: string | null | undefined): boolean {
  const k = normalizeVenueKey(venueName || "");
  return k.includes("sanctuary");
}

export type ContaminationRepairInput = {
  id: number;
  title: string;
  venueName: string;
  posterImageUrl: string | null;
  ticketUrl: string | null;
  adminNotes?: string | null;
  status?: string | null;
};

export type ContaminationRepairPatch = {
  id: number;
  reason: "camp_foreign_eagle" | "sanctuary_gamebang_wrong_series";
  posterImageUrl: string | null;
  /** Only set when ticket must change */
  ticketUrl?: string | null;
  adminNote: string;
};

function appendNote(existing: string | null | undefined, note: string): string {
  const cur = String(existing || "").trim();
  if (cur.includes(note)) return cur.slice(0, 1000);
  return [cur, note].filter(Boolean).join(" | ").slice(0, 1000);
}

/**
 * Plan DB patches for contaminated rows. Safe to run repeatedly: already-clean
 * rows produce no patch.
 */
export function planCrossVenueContaminationRepairs(
  rows: ContaminationRepairInput[],
): ContaminationRepairPatch[] {
  const out: ContaminationRepairPatch[] = [];

  for (const row of rows) {
    if (row.status && row.status === "REMOVED") continue;

    // ── Camp + Eagle identity bleed ──────────────────────────────────────
    if (isCampBarVenue(row.venueName)) {
      const foreignPoster = isWixStaticPosterUrl(row.posterImageUrl);
      const foreignTicket = isEagleHostedUrl(row.ticketUrl);
      if (foreignPoster || foreignTicket) {
        out.push({
          id: row.id,
          reason: "camp_foreign_eagle",
          posterImageUrl: foreignPoster ? null : row.posterImageUrl,
          ticketUrl: foreignTicket ? CAMP_HOME : undefined,
          adminNote: NOTE_CAMP,
        });
        continue;
      }
    }

    // ── Sanctuary Game Bang art on wrong series ──────────────────────────
    if (
      isSanctuaryVenue(row.venueName) &&
      isGameBangPosterUrl(row.posterImageUrl) &&
      !titleIsGameBang(row.title)
    ) {
      out.push({
        id: row.id,
        reason: "sanctuary_gamebang_wrong_series",
        posterImageUrl: null,
        adminNote: NOTE_SANCTUARY,
      });
    }
  }

  return out;
}

export function applyAdminNote(
  existing: string | null | undefined,
  note: string,
): string {
  return appendNote(existing, note);
}

/** Rows that still need flyer re-fetch after Game Bang clear. */
export function needsSanctuaryFlyerReenrich(row: {
  title: string;
  venueName: string;
  posterImageUrl: string | null;
  ticketUrl: string | null;
  adminNotes?: string | null;
}): boolean {
  if (!isSanctuaryVenue(row.venueName)) return false;
  if (titleIsGameBang(row.title)) return false;
  // Cleared or still contaminated
  const poster = row.posterImageUrl;
  if (poster && !isGameBangPosterUrl(poster)) return false;
  const ticket = String(row.ticketUrl || "");
  if (!/pdxsanctuary\.com/i.test(ticket)) return false;
  return true;
}

/**
 * Re-fetch flyer from Sanctuary event page (ticketUrl) using title-aware extract.
 * Returns new poster URL or null if none found / not applicable.
 */
export async function reenrichSanctuaryFlyerFromTicket(row: {
  title: string;
  description?: string | null;
  venueName: string;
  posterImageUrl: string | null;
  ticketUrl: string | null;
}): Promise<{ posterImageUrl: string | null; note: string | null }> {
  if (!needsSanctuaryFlyerReenrich(row)) {
    return { posterImageUrl: row.posterImageUrl, note: null };
  }

  const draft: IngestEventDraft = {
    title: row.title,
    description: row.description || "",
    venueName: row.venueName,
    address: null,
    neighborhood: null,
    lat: null,
    lng: null,
    dateStart: "2099-01-01T12:00", // enrich only needs page; past-filter not used here
    dateEnd: "",
    dayOfWeek: null,
    ageRequirement: "21_PLUS",
    eventTypes: "[]",
    admission: "UNKNOWN",
    ticketUrl: row.ticketUrl,
    eventPageUrl: row.ticketUrl,
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: true,
    nudityOk: true,
    // Force enrich to treat poster as missing
    posterImageUrl: null,
    sourceUrl: row.ticketUrl,
    parseSource: "mixed",
    warnings: [],
  };

  const enriched = await enrichDraftFromEventPage(draft);
  const next = enriched.posterImageUrl;
  if (!next || isGameBangPosterUrl(next)) {
    return { posterImageUrl: null, note: null };
  }
  return { posterImageUrl: next, note: NOTE_REENRICH };
}

export type StorageLike = {
  getEvents: (opts?: { status?: string }) => Event[];
  updateEvent: (
    id: number,
    data: Partial<Event>,
    opts?: { source?: "sync" | "human" },
  ) => Event | undefined;
};

/**
 * Apply planned clears (sync). Returns counts for logs.
 */
export function applyContaminationClearPatches(
  storage: StorageLike,
  patches: ContaminationRepairPatch[],
  existingById: Map<number, ContaminationRepairInput>,
): { cleared: number; camp: number; sanctuary: number } {
  let cleared = 0;
  let camp = 0;
  let sanctuary = 0;
  for (const p of patches) {
    const prev = existingById.get(p.id);
    const data: Partial<Event> = {
      posterImageUrl: p.posterImageUrl,
      adminNotes: applyAdminNote(prev?.adminNotes, p.adminNote),
    };
    if (p.ticketUrl !== undefined) {
      data.ticketUrl = p.ticketUrl;
    }
    storage.updateEvent(p.id, data, { source: "sync" });
    cleared += 1;
    if (p.reason === "camp_foreign_eagle") camp += 1;
    if (p.reason === "sanctuary_gamebang_wrong_series") sanctuary += 1;
  }
  return { cleared, camp, sanctuary };
}

/**
 * Re-enrich Sanctuary rows that still lack a real flyer after clear.
 * Network-bound; call once after boot migration (fire-and-forget ok).
 */
export async function reenrichSanctuaryContaminatedFlyers(
  storage: StorageLike,
  opts?: { concurrency?: number; limit?: number },
): Promise<{ attempted: number; fixed: number; failed: number }> {
  const concurrency = opts?.concurrency ?? 3;
  const limit = opts?.limit ?? 80;
  const catalog = storage.getEvents({});
  const targets = catalog
    .filter(e => e.status !== "REMOVED")
    .filter(e =>
      needsSanctuaryFlyerReenrich({
        title: e.title,
        venueName: e.venueName,
        posterImageUrl: e.posterImageUrl,
        ticketUrl: e.ticketUrl,
        adminNotes: e.adminNotes,
      }),
    )
    .slice(0, limit);

  let fixed = 0;
  let failed = 0;
  let i = 0;
  async function worker() {
    while (i < targets.length) {
      const idx = i++;
      const row = targets[idx];
      try {
        const { posterImageUrl, note } = await reenrichSanctuaryFlyerFromTicket({
          title: row.title,
          description: row.description,
          venueName: row.venueName,
          posterImageUrl: row.posterImageUrl,
          ticketUrl: row.ticketUrl,
        });
        if (posterImageUrl) {
          storage.updateEvent(row.id, {
            posterImageUrl,
            adminNotes: applyAdminNote(row.adminNotes, note || NOTE_REENRICH),
          }, { source: "sync" });
          fixed += 1;
        } else {
          failed += 1;
        }
      } catch {
        failed += 1;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, targets.length) }, () => worker()));
  return { attempted: targets.length, fixed, failed };
}
