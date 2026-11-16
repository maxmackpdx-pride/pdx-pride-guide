/** Human-readable labels for the map catalog's canonical categories.
 * Keep the legacy conditions kind intact; it is not a display subtype.
 */
const LABELS: Readonly<Record<string, string>> = {
  trail: 'Trails', dayuse: 'Day use', winter: 'Winter',
  beach: 'Beach', spring: 'Hot springs', fishing: 'Fishing', boating: 'Boating',
  camp: 'Camping', coastcamp: 'Coastal camping', watercamp: 'Waterfront camping',
  stay: 'Outdoor stay', atv: 'ATV / OHV',
};
export function outzCategoryLabel(catalogKind: string | null | undefined, fallback: string): string {
  return catalogKind && Object.hasOwn(LABELS, catalogKind) ? LABELS[catalogKind] : fallback;
}
