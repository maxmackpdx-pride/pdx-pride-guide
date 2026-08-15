import type { Event } from "@shared/schema";
import { captureFullQualityPoster } from "./posterQuality";

type PendingCandidate = {
  id?: unknown;
  sourceUrl?: unknown;
  draft?: unknown;
};

type MirrorDeps = {
  events: Event[];
  pendingCandidates: PendingCandidate[];
  updateEventPoster: (id: number, url: string) => void;
  updateCandidatePoster: (id: string, url: string) => boolean;
  capture?: typeof captureFullQualityPoster;
  now?: number;
};

export type PosterMirrorSummary = {
  checked: number;
  captured: number;
  retainedRemote: number;
};

const isRemote = (value: unknown): value is string =>
  typeof value === "string" && /^https?:\/\//i.test(value.trim());

const isCurrentOrFuture = (start: unknown, end: unknown, now: number) => {
  const endMs = Date.parse(String(end || "")) || Date.parse(String(start || "")) || 0;
  return endMs >= now;
};

/**
 * Mirror remote flyers onto the persistent uploads volume.
 *
 * This is deliberately idempotent. Local poster paths are skipped, successful
 * captures replace only the poster URL, and a failed download leaves the
 * existing remote URL untouched.
 */
export async function mirrorEventPosters({
  events,
  pendingCandidates,
  updateEventPoster,
  updateCandidatePoster,
  capture = captureFullQualityPoster,
  now = Date.now(),
}: MirrorDeps): Promise<PosterMirrorSummary> {
  const summary: PosterMirrorSummary = { checked: 0, captured: 0, retainedRemote: 0 };

  for (const event of events) {
    if (!isRemote(event.posterImageUrl) || !isCurrentOrFuture(event.dateStart, event.dateEnd, now)) continue;
    summary.checked += 1;
    const result = await capture(event.posterImageUrl, { referer: event.ticketUrl });
    if (result.captured && result.url?.startsWith("/uploads/")) {
      updateEventPoster(event.id, result.url);
      summary.captured += 1;
    } else {
      summary.retainedRemote += 1;
    }
  }

  for (const candidate of pendingCandidates) {
    const draft = candidate.draft && typeof candidate.draft === "object"
      ? candidate.draft as Record<string, unknown>
      : null;
    const id = typeof candidate.id === "string" ? candidate.id : null;
    if (!id || !draft || !isRemote(draft.posterImageUrl)) continue;
    if (!isCurrentOrFuture(draft.dateStart, draft.dateEnd, now)) continue;
    summary.checked += 1;
    const referer = typeof candidate.sourceUrl === "string" ? candidate.sourceUrl : null;
    const result = await capture(draft.posterImageUrl, { referer });
    if (result.captured && result.url?.startsWith("/uploads/") && updateCandidatePoster(id, result.url)) {
      summary.captured += 1;
    } else {
      summary.retainedRemote += 1;
    }
  }

  return summary;
}
