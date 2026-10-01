import { RESOURCE_CATEGORIES, type ResourceOrg, type ResourceCategory } from './resourcesData';
import { FOOD_RESOURCE } from './foodPantries';
import { mapCoordinates } from './mapCoordinates';

export type ResourceMapEntry = {
  org: ResourceOrg;
  categories: ResourceCategory[];
  locations: { name: string; address: string; lat: number; lng: number }[];
};

/** Only provider-supplied coordinates become pins. Address-only resources stay in the drawer. */
export const RESOURCE_MAP_ENTRIES: ResourceMapEntry[] = (() => {
  const byName = new Map<string, { org: ResourceOrg; categories: ResourceCategory[] }>();
  for (const category of RESOURCE_CATEGORIES) {
    for (const org of [...category.orgs, ...(category.id === 'safety' ? [FOOD_RESOURCE] : [])]) {
      const current = byName.get(org.name);
      if (current) current.categories.push(category);
      else byName.set(org.name, { org, categories: [category] });
    }
  }
  return [...byName.values()].map(({ org, categories }) => {
    const allCategories = RESOURCE_CATEGORIES.filter(category => categories.some(item => item.id === category.id) || org.categoryIds?.includes(category.id));
    const source = org.locations?.length ? org.locations : [{ name: org.name, address: org.addr || '', lat: org.lat, lng: org.lng }];
    const locations = source.flatMap(location => {
      const point = mapCoordinates(location.lat, location.lng);
      return point ? [{ name: location.name || org.name, address: location.address || '', ...point }] : [];
    });
    return { org, categories: allCategories, locations };
  });
})();

export function resourceMapHref(name: string): string {
  return `/rezources?resource=${encodeURIComponent(name)}`;
}

export function resourceMapKey(name: string, locationIndex: number): string {
  return `r-${encodeURIComponent(name)}-${locationIndex}`;
}
