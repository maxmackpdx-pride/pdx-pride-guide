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
