/**
 * Eagle Portland - Wix Events on /what-s-happening (appsWarmupData).
 * 21+ leather/cruise bar - never ALL_AGES; never invent FREE cover.
 */
import type { IngestEventDraft } from "../types";
import { fetchIngestSource } from "../fetchSource";
import { parseWarmupDataFromHtml } from "../parseWarmupData";
import { isPastEventListing } from "../dates";
import { inferAdmissionFromText } from "../admissionInfer";
import { getTrustedVenue } from "@shared/trustedVenues";

const EAGLE_VENUE = "Eagle Portland";
const EAGLE_ADDRESS = "835 N Lombard St, Portland, OR 97217";
const EAGLE_NEIGHBORHOOD = "North Portland";
const EAGLE_AGE = "21_PLUS" as const;

const DEFAULT_FEED =
  getTrustedVenue("eagle-events")?.feedUrl ||
  "https://www.eagleportland.com/what-s-happening";

export function applyEaglePolicy(draft: IngestEventDraft): IngestEventDraft {
  const adm = inferAdmissionFromText(draft.title, draft.description);
  const admission =
    draft.admission === "FREE" && adm.admission === "FREE"
      ? "FREE"
      : draft.admission && draft.admission !== "FREE" && draft.admission !== "ALL_AGES"
        ? draft.admission
        : adm.admission;

  const weakVenue =
    !draft.venueName ||
    draft.venueName === "TBA" ||
    /eagle/i.test(draft.venueName);

  return {
    ...draft,
    venueName: weakVenue ? EAGLE_VENUE : draft.venueName,
    address: draft.address?.trim() ? draft.address : EAGLE_ADDRESS,
    neighborhood: draft.neighborhood?.trim() ? draft.neighborhood : EAGLE_NEIGHBORHOOD,
    ageRequirement: EAGLE_AGE,
    admission,
    warnings: Array.from(
      new Set([
        ...(draft.warnings || []),
        "Age set to 21_PLUS (Eagle is a bar)",
        ...(adm.reason ? [adm.reason] : []),
      ]),
    ),
  };
}

export type FetchEagleDraftsOpts = {
  feedUrl?: string;
  includePast?: boolean;
};

/**
 * Fetch Eagle what's-happening page → Wix Events drafts + bar policy.
 */
export async function fetchEagleDrafts(
  opts?: FetchEagleDraftsOpts,
): Promise<IngestEventDraft[]> {
  const feedUrl = (opts?.feedUrl || DEFAULT_FEED).trim();
  const fetched = await fetchIngestSource(feedUrl);
  if (!fetched.body || fetched.body.length < 500) return [];

  let drafts = parseWarmupDataFromHtml(fetched.body, fetched.url || feedUrl);
  // Prefer Eagle page only (some Wix chrome can leak other titles)
  drafts = drafts.filter(d => {
    const v = `${d.venueName} ${d.address || ""} ${d.sourceUrl || ""}`.toLowerCase();
    return /eagle|lombard|eagleportland/.test(v) || /eagleportland\.com/i.test(feedUrl);
  });
  // If filter emptied because venue said TBA but URLs are eagle - keep all from page
  if (!drafts.length) {
    drafts = parseWarmupDataFromHtml(fetched.body, fetched.url || feedUrl);
  }

  if (!opts?.includePast) {
    drafts = drafts.filter(d => !isPastEventListing(d));
  }

  drafts = drafts.map(applyEaglePolicy);

  // De-dupe
  const seen = new Set<string>();
  return drafts.filter(d => {
    const key = `${d.title}|${(d.dateStart || "").slice(0, 10)}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
