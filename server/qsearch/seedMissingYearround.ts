/**
 * Seed verified year-round Eventbrite listings into QSearch Review (pending candidates).
 * Source of truth: exports/zaylist-missing-yearround.json (verified open pages only).
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { dayOfWeekFromStart } from "../ingest/dates";
import type { IngestEventDraft } from "../ingest/types";
import { insertScanJob, saveCandidates, listCandidates } from "./store";
import { storage } from "../storage";
import { matchClosedVenue } from "@shared/closedVenues";

type MissingEvent = {
  title: string;
  start?: string;
  end?: string | null;
  venue_name?: string;
  address?: string | null;
  neighborhood?: string | null;
  ticket_url?: string | null;
  event_page_url?: string | null;
  poster_image_url?: string | null;
  admission?: string | null;
  age?: string | null;
  description?: string | null;
  provenance?: { source_url?: string; how_found?: string };
};

function toIsoLocal(s: string | null | undefined): string | null {
  if (!s) return null;
  const t = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(t)) return t.slice(0, 19);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  return t;
}

function findMissingJsonPath(): string | null {
  const candidates = [
    path.join(process.cwd(), "exports", "zaylist-missing-yearround.json"),
    path.join(process.cwd(), "pdx-pride-guide", "exports", "zaylist-missing-yearround.json"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function alreadyOnBoard(draft: IngestEventDraft): boolean {
  const all = storage.getEvents({});
  const day = draft.dateStart.slice(0, 10);
  const titleKey = draft.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return all.some(e => {
    if (e.dateStart?.slice(0, 10) !== day) return false;
    const et = (e.title || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (et === titleKey) return true;
    if (titleKey.length >= 12 && (et.includes(titleKey) || titleKey.includes(et))) return true;
    const ticket = (e.ticketUrl || "").split("?")[0];
    const dTicket = (draft.ticketUrl || "").split("?")[0];
    if (ticket && dTicket && ticket === dTicket) return true;
    return false;
  });
}

function alreadyPending(ticketUrl: string | null): boolean {
  if (!ticketUrl) return false;
  const pending = listCandidates({ status: "pending", limit: 500 });
  const want = ticketUrl.split("?")[0];
  return pending.some(row => {
    try {
      const d = typeof row.draft === "string" ? JSON.parse(row.draft as string) : row.draft;
      const t = String((d as any)?.ticketUrl || "").split("?")[0];
      return t && t === want;
    } catch {
      return false;
    }
  });
}

/**
 * Insert missing-yearround events as pending Review candidates (one-shot boot/import).
 * Returns counts for logs.
 */
export function seedMissingYearroundToReview(): {
  seeded: number;
  skippedBoard: number;
  skippedPending: number;
  skippedClosed: number;
  path: string | null;
} {
  const filePath = findMissingJsonPath();
  if (!filePath) {
    return { seeded: 0, skippedBoard: 0, skippedPending: 0, skippedClosed: 0, path: null };
  }

  let events: MissingEvent[] = [];
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    events = Array.isArray(raw?.events) ? raw.events : [];
  } catch (e) {
    console.warn("[seedMissingYearround] parse failed", e);
    return { seeded: 0, skippedBoard: 0, skippedPending: 0, skippedClosed: 0, path: filePath };
  }

  const jobId = `import-missing-yearround-v1`;
  // Ensure job row exists (idempotent job id)
  try {
    insertScanJob({
      id: jobId,
      status: "done",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      total: events.length,
      completed: events.length,
      currentSourceId: null,
      currentLabel: "Missing year-round seed",
      etaSeconds: 0,
      error: null,
      avgMs: 0,
      filterJson: JSON.stringify({ kind: "import_missing_yearround", source: filePath }),
      perSourceJson: "[]",
      kind: "import",
    });
  } catch {
    // Primary key exists — still seed candidates under that job id
  }

  let seeded = 0;
  let skippedBoard = 0;
  let skippedPending = 0;
  let skippedClosed = 0;
  const batch: Parameters<typeof saveCandidates>[1] = [];

  for (const ev of events) {
    const dateStart = toIsoLocal(ev.start);
    if (!dateStart || !ev.title) continue;
    const dateEnd = toIsoLocal(ev.end || null) || dateStart;
    const ticketUrl = ev.ticket_url || ev.event_page_url || null;
    const venueName = ev.venue_name || "Portland";
    if (matchClosedVenue({ venueName, address: ev.address, title: ev.title })) {
      skippedClosed++;
      continue;
    }

    const draft: IngestEventDraft = {
      title: String(ev.title).slice(0, 200),
      description: String(ev.description || ev.title).slice(0, 8000),
      venueName,
      address: ev.address || null,
      neighborhood: ev.neighborhood || null,
      lat: null,
      lng: null,
      dateStart,
      dateEnd,
      dayOfWeek: dayOfWeekFromStart(dateStart),
      ageRequirement: (ev.age as any) || "ALL_AGES",
      eventTypes: JSON.stringify(["year-round"]),
      admission: (ev.admission as any) || "TICKETED",
      ticketUrl,
      eventPageUrl: ev.event_page_url || ticketUrl,
      isPublic: true,
      isPrivate: false,
      isHouseParty: false,
      isSexPositive: false,
      nudityOk: false,
      posterImageUrl: ev.poster_image_url || null,
      sourceUrl: ev.provenance?.source_url || ticketUrl,
      parseSource: "eventbrite",
      warnings: [
        "Seeded from zaylist-missing-yearround.json (verified Eventbrite page)",
        ev.provenance?.how_found || "verified 2026-07-26",
      ].filter(Boolean) as string[],
    };

    if (alreadyOnBoard(draft)) {
      skippedBoard++;
      continue;
    }
    if (alreadyPending(ticketUrl)) {
      skippedPending++;
      continue;
    }

    const id = `missing-yr-${randomUUID().slice(0, 8)}-${dateStart.slice(0, 10)}`;
    batch.push({
      id,
      sourceId: "import-missing-yearround",
      sourceLabel: "Missing year-round (verified EB)",
      sourceUrl: ticketUrl || "https://www.eventbrite.com/",
      draft,
      selected: true,
      recurring: null,
      recurringCount: 1,
      condensed: false,
      conflicts: [],
      duplicates: [],
      strongDuplicate: null,
      directoryBrands: [],
      memberDrafts: [],
    });
    seeded++;
  }

  if (batch.length) {
    saveCandidates(jobId, batch);
  }

  return { seeded, skippedBoard, skippedPending, skippedClosed, path: filePath };
}
