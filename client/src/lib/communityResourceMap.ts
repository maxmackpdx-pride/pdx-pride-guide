import type { CommunitySummary } from '@shared/community';
import { RESOURCE_CATEGORIES } from './resourcesData';
import { RESOURCE_MAP_ENTRIES, type ResourceMapEntry } from './resourceMap';
import { mergeCommunityResources } from './communityResources';
import { mapCoordinates } from './mapCoordinates';

type SourcePlace = { id: number; name: string; address?: string | null; lat?: number | string | null; lng?: number | string | null; active?: boolean };
/** Public community discovery shares NEEDZ entries; only verified source-place coordinates produce pins. */
export function communityResourceMapEntries(communities: CommunitySummary[], places: SourcePlace[], base = RESOURCE_MAP_ENTRIES): ResourceMapEntry[] {
  const category = RESOURCE_CATEGORIES.find(item => item.id === 'community')!;
  const rows = mergeCommunityResources(base.map(entry => ({org: entry.org, category: entry.categories[0]})), communities, category);
  return rows.map(row => {
    const original = base.find(entry => entry.org.name === row.org.name);
    const categories = [...(original?.categories || [row.category])];
    if (row.community && !categories.some(item => item.id === category.id)) categories.push(category);
    let locations = original?.locations || [];
    if (!locations.length && row.community?.sourcePlaceId != null) {
      const source = places.find(place => place.id === row.community!.sourcePlaceId && place.active !== false);
      const point = source && mapCoordinates(source.lat, source.lng);
      if (source && point) locations = [{name: source.name, address: source.address || '', ...point}];
    }
    return {org: row.org, categories, locations};
  });
}
