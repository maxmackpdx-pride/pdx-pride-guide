import { RESOURCE_CATEGORIES } from "./resourcesData";

const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");
const resourceNames = new Map<string, string>();

for (const category of RESOURCE_CATEGORIES) {
  for (const org of category.orgs) {
    for (const name of [org.name, ...(org.aliases ?? [])]) {
      resourceNames.set(normalizeName(name), org.name);
    }
  }
}

/** Keep one discovery home without deleting the business record or event links. */
export function directoryResourceName(listing: { name: string; type: string }): string | undefined {
  if (!["nonprofit", "healthcare", "service"].includes(listing.type)) return undefined;
  return resourceNames.get(normalizeName(listing.name));
}

export function directoryResourcePath(listing: { name: string; type: string }): string | undefined {
  const name = directoryResourceName(listing);
  return name ? `/needz?resource=${encodeURIComponent(name)}` : undefined;
}
