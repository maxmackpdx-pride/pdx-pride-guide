const ADMISSION_FULL: Record<string, string> = {
  FREE: "Free",
  TICKETED: "Ticketed",
  DOOR_FEE: "Cover at door",
  SUGGESTED_DONATION: "Suggested donation",
  UNKNOWN: "Not confirmed",
};
const AGE_FULL: Record<string, string> = {
  "21_PLUS": "21+",
  "18_PLUS": "18+",
  ALL_AGES: "All ages",
  UNVERIFIED: "Not stated",
};
export function eventPrice(value: string | null | undefined) {
  return value && Object.prototype.hasOwnProperty.call(ADMISSION_FULL,value) ? ADMISSION_FULL[value] : "Not confirmed";
}
export function eventAge(value: string | null | undefined) {
  return value && Object.prototype.hasOwnProperty.call(AGE_FULL,value) ? AGE_FULL[value] : "Not stated";
}

/** A complete ticket line can be moved intact out of the description. Leave
 * descriptions with conditional pricing or additional qualifications as written. */
export function eventTicketFacts(description: string | null | undefined) {
  const text = description ?? "";
  const pair = /(?<!\S)(\$\d+(?:\.\d{2})?)\s+presale\s*\/\s*(\$\d+(?:\.\d{2})?)\s+door(?:\.(?=\s|$)|$)/i.exec(text);
  if (!pair || (pair.index > 0 && !/[.!?\n]\s*$/.test(text.slice(0,pair.index)))) {
    return { description: text, prices: null };
  }
  return {
    description: [text.slice(0,pair.index).trimEnd(), text.slice(pair.index + pair[0].length).trimStart()].filter(Boolean).join(" "),
    prices: { presale: pair[1], door: pair[2] },
  };
}

/** Only surface a performer explicitly credited in listing copy. A genre or
 * unfilled DJ call is not a performance credit. Structured lineup wins. */
export function listingDjCredit(description: string | null | undefined): string | null {
  if (!description) return null;
  const credit = /(?:^|[.!?]\s+|\n)(DJ\s+[\p{Lu}\d][\p{L}\d’'&.-]*(?:[ \t]+[\p{Lu}\d][\p{L}\d’'&.-]*){0,4})\s+(?:plays|spins|takes the decks|calls the plays|will spin)\b/u.exec(description);
  return credit?.[1] ?? null;
}


/** A scheduled duration is a fixed fact, so omit empty units. */
export function eventRuntime(startsAt: number | null, endsAt: number | null): string | null {
  if (startsAt == null || endsAt == null || endsAt <= startsAt) return null;
  const minutes = Math.round((endsAt - startsAt) / 60_000);
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return remainder + " min";
  if (!remainder) return hours + (hours === 1 ? " hour" : " hours");
  return hours + "h " + remainder + "m";
}
