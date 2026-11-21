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
