import type { SubmissionMatchCandidate } from "@shared/submissionMatch";

export type IngestParseSource =
  | "jsonld"
  | "ics"
  | "mixed"
  | "squarespace"
  | "tribe"
  | "wix"
  | "vision"
  | "caption"
  | "instagram";

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
  /** Provenance for admin notes / source field. */
  sourceUrl: string | null;
  parseSource: IngestParseSource;
  warnings: string[];
  /** 0–1 when from vision/caption; omit for structured parsers */
  confidence?: number | null;
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
  created: Array<{ id: number; title: string; status: string }>;
  skipped: Array<{ index: number; title: string; reason: string }>;
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
