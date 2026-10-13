import { DIRECTORY_SUBCATEGORY_DATA } from './directorySubcategoryData';
import { DIRECTORY_TYPE_LABELS } from './directoryTheme';

export const SUBCATEGORY_LABELS: Record<string, string> = {
  tattoo: 'Tattoo', piercing: 'Piercing', hair: 'Hair', barber: 'Barber',
  massage: 'Massage', bodywork: 'Bodywork', 'graphic-design': 'Graphic Design',
  illustration: 'Illustration', 'web-design': 'Web Design', 'web-development': 'Web Development',
  beauty: 'Beauty', esthetics: 'Esthetics', 'custom-products': 'Custom Products',
  'live-music': 'Live Music', theater: 'Theater', 'drag-shows': 'Drag Shows',
  dance: 'Dance', nightlife: 'Nightlife', 'community-events': 'Community Events',
  'event-rental': 'Venue & Studio Rentals', 'adult-social': 'Adult Social',
  comedy: 'Comedy', 'circus-arts': 'Circus & Aerial Arts',
  'adult-retail': 'Adult Retail', 'kink-gear': 'Kink Gear', clothing: 'Clothing',
  'plants-garden': 'Plants & Garden', apothecary: 'Apothecary', books: 'Books', 'yarn-crafts': 'Yarn & Crafts',
  haitian: 'Haitian', 'pacific-northwest': 'Pacific Northwest', 'pub-food': 'Pub Food',
  mexican: 'Mexican', tacos: 'Tacos', vegan: 'Vegan', vietnamese: 'Vietnamese',
  singaporean: 'Singaporean', pizza: 'Pizza', 'filipino-fusion': 'Filipino Fusion', 'global-cuisine': 'Global Cuisine',
};
export type SubcategorySource = { name: string; type: string };
const normalize = (name: string) => name.normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const entries = new Map(DIRECTORY_SUBCATEGORY_DATA.flatMap(record =>
  [record.name, ...(record.aliases || [])].map(name => [`${record.type}:${normalize(name)}`, record] as const)));

/** Only source-checked offerings; unknown listings remain visible in All. */
export function directorySubcategories(source: SubcategorySource) {
  return (entries.get(`${source.type}:${normalize(source.name)}`)?.subcategories || [])
    .filter(id => Boolean(SUBCATEGORY_LABELS[id])).map(id => ({ id, label: SUBCATEGORY_LABELS[id] }));
}
export function directoryCardCategoryLabel(source: SubcategorySource) {
  if (source.type === 'service') {
    return directorySubcategories(source)[0]?.label || 'Services';
  }
  return DIRECTORY_TYPE_LABELS[source.type] || source.type;
}
export function directorySubcategoryOptions(sources: SubcategorySource[], parentTypes: string[]) {
  if (parentTypes.includes('ALL')) return [];
  const counts = new Map<string, number>();
  for (const source of sources) if (parentTypes.includes(source.type)) {
    for (const tag of directorySubcategories(source)) counts.set(tag.id, (counts.get(tag.id) || 0) + 1);
  }
  return Object.entries(SUBCATEGORY_LABELS).filter(([id]) => counts.has(id))
    .map(([id, label]) => ({ id, label, count: counts.get(id)! }));
}
