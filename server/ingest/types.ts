import type { SubmissionMatchCandidate } from "@shared/submissionMatch";

export type IngestParseSource =
  | "jsonld"
  | "ics"
  | "mixed"
  | "html"
  | "eventbrite"
  | "squarespace"
  | "tribe"
  | "wix"
  | "badlands"
  | "vision"
  | "caption"
  | "instagram"
  | "flyer-reader"
  | "airtable";

/** Normalized draft event ready for createEvent (Pacific wall-clock strings). */
export type IngestEventDraft = {
  title: string;
  description: string;
  venueName: string;
  address: string | null;
  neighborhood: string | null;
  lat: number | null;
  lng: number | null;
  dateStart: string;
  dateEnd: string;
  dayOfWeek: string | null;
  ageRequirement: string;
  eventTypes: string;
  admission: string;
  ticketUrl: string | null;
  isPublic: boolean;
  isPrivate: boolean;
  isHouseParty: boolean;
  isSexPositive: boolean;
  nudityOk: boolean;
  posterImageUrl: string | null;
  /**
   * Public human-facing event page (venue site event URL, Tixr event, etc.).
   * Prefer this over feed/API URLs for "open listing" links in Review.
   */
  eventPageUrl?: string | null;
  /** Provenance for admin notes / source field (often the feed/list URL). */
  sourceUrl: string | null;
  parseSource: IngestParseSource;
  warnings: string[];
  /** 0–1 when from vision/caption; omit for structured parsers */
  confidence?: number | null;
  /** ── AI scrub (server/qsearch/scrubLlm.ts) — all optional, additive ──
   * Set when QSEARCH_SCRUB_LLM ran over this candidate. Ride on the draft so
   * they round-trip through draft_json → client with no schema change. */
  relevanceScore?: number | null; // 0–1: "is this a real Portland LGBTQ+ event"
  relevanceReason?: string | null; // one-line rationale (also the AI-drop reason)
  category?: string | null; // bar|club|drag|music|market|social|kink|community|other
  aiScrubbed?: boolean; // true once the scrub pass touched this draft
  /** ── AI flyer check (server/qsearch/verifyFlyer.ts, Wave B) ── */
  flyerMatch?: number | null; // 0–1: attached poster matches this event
  flyerMatchReason?: string | null;
};

export type IngestPreviewItem = {
  index: number;
  draft: IngestEventDraft;
  selected: boolean;
  duplicates: SubmissionMatchCandidate[];
  strongDuplicate: SubmissionMatchCandidate | null;
};

export type IngestPreviewResult = {
  ok: true;
  sourceUrl: string | null;
  contentType: string | null;
  parseSources: Array<IngestParseSource | "squarespace" | "tribe" | "wix" | "jsonld" | "ics">;
  events: IngestPreviewItem[];
  warnings: string[];
  impact: string;
};

export type IngestCommitResult = {
  ok: true;
  created: Array<{ id: number; title: string; status: string; candidateId?: string }>;
  skipped: Array<{ index: number; title: string; reason: string; candidateId?: string }>;
  impact: string;
};

export type YieldStatus =
  | "works"
  | "discovery_needed"
  | "zero_yield"
  | "needs_recipe"
  | "meta_only"
  | "dead"
  | "unscanned";
