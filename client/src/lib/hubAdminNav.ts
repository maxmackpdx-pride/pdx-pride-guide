import type { HubSection } from "@/components/hub/types";
import { hubSectionToAdminTab } from "@/components/hub/types";

export type HubAdminNavItem = {
  section: HubSection;
  label: string;
  teamOnly?: boolean;
};

export const HUB_ADMIN_NAV: HubAdminNavItem[] = [
  { section: "admin", label: "Overview" },
  { section: "tbl-events", label: "All Events" },
  { section: "tbl-users", label: "All Users" },
  { section: "tbl-werk", label: "Pride Werk" },
  { section: "tbl-promoters", label: "Promoters" },
  { section: "tbl-claims", label: "Venue Claims" },
  { section: "tbl-team", label: "My Team", teamOnly: true },
];

export function hubAdminNavItems(canManageTeam: boolean): HubAdminNavItem[] {
  return HUB_ADMIN_NAV.filter((item) => !item.teamOnly || canManageTeam);
}

export function hubAdminHref(section: HubSection): string {
  if (section === "admin") return "/dashboard?section=admin";
  const tab = hubSectionToAdminTab(section);
  return tab ? `/admin?tab=${encodeURIComponent(tab)}` : "/admin";
}

export function isHubAdminSection(section: HubSection): boolean {
  return section === "admin" || HUB_ADMIN_NAV.some((item) => item.section === section);
}