/** QSearch may publish the known event without inventing optional facts. */
export const QSEARCH_UNVERIFIED = "Unverified";

export const QSEARCH_REQUIRED_FACTS = ["title", "venueName", "dateStart"] as const;

export function qsearchFieldNeedsEvidence(field: string, value: unknown): boolean {
  if (value == null || value === "") return false;
  if (field === "description" && value === QSEARCH_UNVERIFIED) return false;
  if (field === "ageRequirement" && value === "UNVERIFIED") return false;
  if (field === "admission" && value === "UNKNOWN") return false;
  if (field === "status" && value === "LIVE") return false;
  if (field === "eventTypes" && Array.isArray(value) && value.length === 0) return false;
  return true;
}

export function qsearchCreateDefaults(values: Record<string, unknown>): Record<string, unknown> {
  return {
    description: QSEARCH_UNVERIFIED,
    dateEnd: "",
    ageRequirement: "UNVERIFIED",
    admission: "UNKNOWN",
    status: "LIVE",
    ...values,
  };
}
