/** Split a hours line on commas so "8am–8pm" stays on one line. */
export function placeHoursClauses(hours: string): string[] {
  return hours.split(",").map(clause => clause.trim()).filter(Boolean);
}
