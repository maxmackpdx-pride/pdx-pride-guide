import type { HubSection } from "@/components/hub/types";
import { hubSectionToAdminTab } from "@/components/hub/types";

export type HubAdminNavItem = {
  section: HubSection;
  label: string;
  teamOnly?: boolean;
  /** Primary owner only (Ad Manager). */
  ownerOnly?: boolean;
};

export const HUB_ADMIN_NAV: HubAdminNavItem[] = [
  { section: "admin", label: "Overview" },
  { section: "tbl-events", label: "All Events" },
  // "All Users" is primary-owner only; folder itself is owner-gated in nav.
  { section: "tbl-users", label: "All Users", teamOnly: true },
  { section: "tbl-werk", label: "Gig Work" },
  { section: "tbl-promoters", label: "Promoters" },
  { section: "tbl-claims", label: "Venue Claims" },
  { section: "tbl-team", label: "My Team", teamOnly: true },
  { section: "tbl-ads", label: "Ads", ownerOnly: true },
];

export function hubAdminNavItems(
  canManageTeam: boolean,
  isPrimaryOwner = false,
): HubAdminNavItem[] {
  return HUB_ADMIN_NAV.filter((item) => {
    if (item.ownerOnly && !isPrimaryOwner) return false;
    if (item.teamOnly && !canManageTeam) return false;
    return true;
  });
}

export function hubAdminHref(section: HubSection): string {
  if (section === "admin") return "/admin?tab=overview";
  const tab = hubSectionToAdminTab(section);
  return tab ? `/admin?tab=${encodeURIComponent(tab)}` : "/admin?tab=overview";
}

export function isHubAdminSection(section: HubSection): boolean {
  return section === "admin" || HUB_ADMIN_NAV.some((item) => item.section === section);
}
