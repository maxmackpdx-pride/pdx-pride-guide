/**
 * Infer admission from listing text — never invent FREE when unsure.
 */
import {
  ADMISSION_UNKNOWN,
  type AdmissionType,
  isAdmissionType,
} from "@shared/admission";

/** Normalize raw offer strings / parser leftovers into a canonical type. */
export function normalizeAdmission(raw: string | null | undefined): AdmissionType {
  const s = String(raw || "").trim();
  if (!s) return ADMISSION_UNKNOWN;
  if (isAdmissionType(s)) return s;
  // Legacy free-text prices from JSON-LD ($15, USD 10) → ticketed/door unknown
  if (/^\$?\s*0(\.0+)?$|^free$/i.test(s)) return "FREE";
  if (/^\$|usd|\beur\b|\bcad\b/i.test(s) || /^\d+(\.\d+)?$/.test(s)) return "TICKETED";
  return ADMISSION_UNKNOWN;
}

/**
 * Infer from free text (title + description). Returns UNKNOWN when no clear signal.
 */
export function inferAdmissionFromText(
  ...parts: Array<string | null | undefined>
): { admission: AdmissionType; reason?: string } {
  const text = parts.filter(Boolean).join(" \n ").toLowerCase();
  if (!text.trim()) return { admission: ADMISSION_UNKNOWN, reason: "No text to infer admission" };

  // Explicit free
  if (
    /\b(free\s*entry|free\s*admission|no\s*cover|cover\s*free|free\s*show|comp(?:limentary)?\s*entry)\b/i.test(
      text,
    ) ||
    /\b(admission|cover|entry)\s*[:\-]?\s*free\b/i.test(text)
  ) {
    return { admission: "FREE", reason: "Text says free / no cover" };
  }

  // Ticketed / advance
  if (
    /\b(ticket(s|ed)?|advance\s*tix|get\s*tickets|buy\s*tickets|ticketmaster|eventbrite\.com\/e\/)\b/i.test(
      text,
    ) ||
    /\bpre[- ]?sale\b/i.test(text)
  ) {
    return { admission: "TICKETED", reason: "Text mentions tickets" };
  }

  // Door / cover fee with a price
  if (
    /\b(cover|door\s*fee|at\s*the\s*door|entry\s*fee|\$\s*\d+)\b/i.test(text) ||
    /\b\d+\s*(\$|bucks|dollars)\s*(cover|door|entry)?\b/i.test(text)
  ) {
    return { admission: "DOOR_FEE", reason: "Text mentions cover / door fee" };
  }

  // Donation
  if (/\b(suggested\s*donation|pay\s*what\s*you\s*can|pwyc|donation\s*welcome)\b/i.test(text)) {
    return { admission: "SUGGESTED_DONATION", reason: "Text mentions donation" };
  }

  return {
    admission: ADMISSION_UNKNOWN,
    reason: "Cover unknown — not assumed free",
  };
}
