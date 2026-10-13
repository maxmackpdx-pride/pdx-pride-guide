export type EmbeddedResourceDetail = {name: string; communitySlug?: string};
type DetailRow = {org: {name: string; aliases?: string[]}; community?: {slug: string}};
/** Embedded map selection is authoritative; route parameters belong to normal NEEDZ browsing. */
export function resourceDetailSelection<T extends DetailRow>(rows: T[], search: string, embedded?: EmbeddedResourceDetail) {
  const params = new URLSearchParams(search);
  const name = embedded ? embedded.name : params.get('resource') || params.get('find');
  const communitySlug = embedded ? embedded.communitySlug : params.get('community');
  const row = rows.find(({org, community}) => communitySlug ? community?.slug === communitySlug : name && (org.name === name || org.aliases?.includes(name)));
  return {row, key: communitySlug || name || '', requested: Boolean(name || communitySlug)};
}
