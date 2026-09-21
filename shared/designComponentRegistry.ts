export const DESIGN_COMPONENT_REGISTRY_SCHEMA = 1 as const;
export const DESIGN_COMPONENT_SOURCE_REPOSITORY = "maxmackpdx-pride/pdx-pride-guide" as const;
export const DESIGN_COMPONENT_SPECIMEN_PATH = "/design-system/specimen" as const;

export type DesignComponentStatus = "connected" | "adapter";

export type DesignComponentRegistryEntry = {
  id: string;
  name: string;
  category: "brand" | "data-display" | "forms" | "layout" | "map";
  exportName: string;
  sourcePath: string;
  status: DesignComponentStatus;
  specimenUrl: string;
};

const entry = (
  id: string,
  name: string,
  category: DesignComponentRegistryEntry["category"],
  exportName: string,
  sourcePath: string,
  status: DesignComponentStatus = "connected",
): DesignComponentRegistryEntry => ({
  id,
  name,
  category,
  exportName,
  sourcePath,
  status,
  specimenUrl: `${DESIGN_COMPONENT_SPECIMEN_PATH}?id=${encodeURIComponent(id)}`,
});

/**
 * Machine-readable identity map for the React objects displayed by the Design
 * Guide. The product source path is canonical. A guide catalog record may add
 * prose and governance, but it must keep this id and source path intact.
 */
export const DESIGN_COMPONENT_REGISTRY = Object.freeze([
  entry("component:brand/Logo", "Logo", "brand", "Logo", "client/src/components/ds/Logo.tsx"),
  entry("component:brand/UserAvatar", "UserAvatar", "brand", "default", "client/src/components/UserAvatar.tsx"),
  entry("component:data-display/Badge", "Badge", "data-display", "Badge", "client/src/components/ds/Badge.tsx"),
  entry("component:data-display/ChangeBadge", "ChangeBadge", "data-display", "ChangeBadge", "client/src/components/ds/ChangeBadge.tsx"),
  entry("component:data-display/Countdown", "Countdown", "data-display", "Countdown", "client/src/components/ds/Countdown.tsx"),
  entry("component:data-display/EventCard", "EventCard", "data-display", "EventCard", "client/src/components/ds/EventCard.tsx", "adapter"),
  entry("component:data-display/HouseholdStack", "HouseholdStack", "data-display", "HouseholdStack", "client/src/components/ds/HouseholdStack.tsx"),
  entry("component:data-display/PlaceCard", "PlaceCard", "data-display", "PlaceCard", "client/src/components/ds/PlaceCard.tsx", "adapter"),
  entry("component:data-display/PosterCard", "PosterCard", "data-display", "PosterCard", "client/src/components/ds/PosterCard.tsx", "adapter"),
  entry("component:data-display/StatCard", "StatCard", "data-display", "StatCard", "client/src/components/ds/StatCard.tsx"),
  entry("component:data-display/StatPill", "StatPill", "data-display", "StatPill", "client/src/components/ds/StatPill.tsx"),
  entry("component:data-display/StickerBadge", "StickerBadge", "data-display", "StickerBadge", "client/src/components/ds/StickerBadge.tsx"),
  entry("component:forms/ActionRow", "ActionRow", "forms", "default", "client/src/components/promoter/ActionRow.tsx", "adapter"),
  entry("component:forms/Button", "Button", "forms", "Button", "client/src/components/ds/Button.tsx"),
  entry("component:forms/FilterChip", "FilterChip", "forms", "FilterChip", "client/src/components/ds/FilterChip.tsx"),
  entry("component:forms/IconButton", "IconButton", "forms", "IconButton", "client/src/components/ds/IconButton.tsx"),
  entry("component:forms/SearchInput", "SearchInput", "forms", "SearchInput", "client/src/components/ds/SearchInput.tsx"),
  entry("component:layout/Divider", "Divider", "layout", "Divider", "client/src/components/ds/Divider.tsx"),
  entry("component:layout/HeroBanner", "HeroBanner", "layout", "HeroBanner", "client/src/components/ds/HeroBanner.tsx"),
  entry("component:layout/Marquee", "Marquee", "layout", "Marquee", "client/src/components/ds/Marquee.tsx"),
  entry("component:layout/SectionHeader", "SectionHeader", "layout", "SectionHeader", "client/src/components/ds/SectionHeader.tsx"),
  entry("component:map/MapLegend", "MapLegend", "map", "MapLegend", "client/src/components/ds/MapLegend.tsx"),
  entry("component:map/MapPanel", "MapPanel", "map", "MapPanel", "client/src/components/ds/MapPanel.tsx"),
] satisfies DesignComponentRegistryEntry[]);

export function findDesignComponent(id: string | null | undefined) {
  return DESIGN_COMPONENT_REGISTRY.find(component => component.id === id) || null;
}
