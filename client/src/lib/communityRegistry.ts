/**
 * Parser for the QSearch community registry (qsearch/community-registry.md).
 *
 * The registry markdown is the single source of record for why every venue,
 * club, organization, service provider and residency-nod host is on Zaylist.
 * The A–Z directory index imports the file at build time and parses it here,
 * so any entry added to the registry appears on the index automatically —
 * the list is generated, never hand-maintained.
 */

export type RegistryEntry = {
  name: string;
  /** Raw registry type: venue / shop / club / organization / service provider / residency nod. */
  type: string;
};

/** Name matching key: case-insensitive, punctuation-insensitive. */
export function registryNameKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function parseCommunityRegistry(markdown: string): RegistryEntry[] {
  const section = markdown.split(/^## Entries\s*$/m)[1] ?? "";
  const entries: RegistryEntry[] = [];
  for (const chunk of section.split(/^###\s+/m).slice(1)) {
    const lines = chunk.split("\n");
    const name = (lines[0] || "").trim();
    if (!name) continue;
    const typeLine = lines.find((line) => line.startsWith("- Type:"));
    const type = typeLine ? typeLine.slice("- Type:".length).trim() : "";
    entries.push({ name, type });
  }
  return entries;
}
