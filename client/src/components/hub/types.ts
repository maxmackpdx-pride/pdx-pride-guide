export type HubSection =
  | "feed"
  | "post"
  | "profile"
  | "events"
  | "people"
  | "settings"
  | "admin"
  | "tbl-events"
  | "tbl-users"
  | "tbl-werk"
  | "tbl-promoters"
  | "tbl-claims"
  | "tbl-team"
  | "tbl-ads";

export const HUB_SECTIONS: HubSection[] = [
  "feed",
  "post",
  "profile",
  "events",
  "people",
  "settings",
  "admin",
  "tbl-events",
  "tbl-users",
  "tbl-werk",
  "tbl-promoters",
  "tbl-claims",
  "tbl-team",
  "tbl-ads",
];

export const HUB_ADMIN_TABLE_SECTIONS: HubSection[] = [
  "tbl-events",
  "tbl-users",
  "tbl-werk",
  "tbl-promoters",
  "tbl-claims",
  "tbl-team",
  "tbl-ads",
];

export function hubSectionToAdminTab(section: HubSection): string | null {
  const map: Partial<Record<HubSection, string>> = {
    "tbl-events": "events",
    "tbl-users": "users",
    "tbl-werk": "gigs",
    "tbl-promoters": "promoters",
    "tbl-claims": "venue-claims",
    "tbl-team": "team",
    "tbl-ads": "ads",
  };
  return map[section] ?? null;
}

export function parseHubSection(raw: string | null): HubSection {
  if (raw && (HUB_SECTIONS as string[]).includes(raw)) return raw as HubSection;
  return "feed";
}