/**
 * Declarative venue policy (TrustedVenueDef.venuePolicy) - the scaling path:
 * new trusted venues get age / sex-positive / admission rules from data, not
 * new code. Runs after any dedicated adapter policy; adapter stamps win only
 * where the declarative policy is silent.
 */
import type { TrustedVenueDef } from "@shared/trustedVenues";
import type { IngestEventDraft } from "./types";
import { inferAdmissionFromText } from "./admissionInfer";

/**
 * Fresh-flyer predicate for health coverage: a draft counts toward flyer
 * coverage only when its art was actually ACQUIRED this sync (feed field or
 * event-page enrich) - NOT backfilled by series reuse. Reused art still
 * displays (good UX), but coverage must expose the real acquisition rate or
 * reuse quietly masks a broken flyer path.
 */
export function isFreshFlyerDraft(draft: Pick<IngestEventDraft, "posterImageUrl" | "warnings">): boolean {
  if (!draft.posterImageUrl || draft.posterImageUrl.startsWith("data:")) return false;
  return !(draft.warnings || []).some(w => /^Series flyer reused/i.test(w));
}

export function countFreshFlyerDrafts(
  drafts: Array<Pick<IngestEventDraft, "posterImageUrl" | "warnings">>,
): number {
  return drafts.filter(isFreshFlyerDraft).length;
}

export function applyDeclaredVenuePolicy(
  draft: IngestEventDraft,
  venue: Pick<TrustedVenueDef, "venuePolicy">,
): IngestEventDraft {
  const policy = venue.venuePolicy;
  if (!policy) return draft;

  const next: IngestEventDraft = { ...draft };
  const warnings = [...(next.warnings || [])];

  if (policy.ageRequirement) {
    if (next.ageRequirement !== policy.ageRequirement && policy.ageNote) {
      warnings.push(policy.ageNote);
    }
    next.ageRequirement = policy.ageRequirement;
  } else if (policy.ageNote) {
    // Note-only policies (e.g. Sports Bra) surface the verify reminder
    warnings.push(policy.ageNote);
  }

  if (policy.sexPositive) {
    let tags: string[] = [];
    try {
      const parsed = JSON.parse(next.eventTypes || "[]");
      tags = Array.isArray(parsed) ? parsed.map(t => String(t)).filter(Boolean) : [];
    } catch {
      tags = [];
    }
    const upper = new Set(tags.map(t => t.trim().toUpperCase().replace(/[\s-]+/g, "_")));
    for (const t of ["SEX_POSITIVE", "NUDITY_OK", "KINK"] as const) {
      if (!upper.has(t)) {
        tags.push(t);
        upper.add(t);
      }
    }
    next.isSexPositive = true;
    next.nudityOk = true;
    next.eventTypes = JSON.stringify(tags);
  }

  if (policy.reinferAdmission !== false) {
    const adm = inferAdmissionFromText(next.title, next.description);
    // Never invent FREE: meaningful upstream values kept (unconfirmed FREE
    // demoted); UNKNOWN defers to text inference.
    next.admission =
      next.admission && next.admission !== "UNKNOWN" && next.admission !== "ALL_AGES"
        ? next.admission === "FREE" && adm.admission !== "FREE"
          ? adm.admission
          : next.admission
        : adm.admission;
    if (adm.reason) warnings.push(adm.reason);
  }

  return { ...next, warnings: Array.from(new Set(warnings)) };
}
