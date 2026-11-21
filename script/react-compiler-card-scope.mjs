/**
 * React Compiler experimental production candidate.
 * Shared by Vite's real app build and the isolated browser comparison so the
 * measured allowlist cannot drift from the proposed deployment configuration.
 * Scope tightened after four production-optimized whole-page trials on
 * cde93d3: Eventz/Boardz improved; Resources/Placez did not consistently improve.
 * The new six-ID Placez presentation candidate is measured separately.
 * Do not broaden scope to routes, Mapz, auth, consent, or modal controllers.
 */
export const cardFaceModules = [
  'events/FlyerBoard',
  'events/EventFlyerFront',
  'events/EventRailCard',
  'events/EventFlyerArt',
  'home/TonightEventCard',
  'board/BoardBrowseCard',
  'board/punk/PunkBoardCard',
  'board/punk/ZineCard',
];

// Exact Placez presentation scope only. Legacy PlaceDiscoveryCard and
// TodayLocationCard remain excluded, as do shared API, query adapters and
// PlaceModal mutation controls. Inclusion is a candidate, not proof of speedup.
export const drawerCompilerModules = [
  'places/PlacezDrawer',
  'places/PlacezMapDrawer',
  'places/PlacezEventsRails',
  'places/EventPlanExtension',
<<<<<<< HEAD
  'places/PlacezInViewRail',
=======
>>>>>>> f197d32 (Add Outzide and Afterz map drawers on the shared DrawerTop)
  'drawers/DrawerTop',
  'drawers/DrawerCountdownCard',
  'drawers/DrawerFilterRail',
  'drawers/DrawerMiniCard',
  'drawers/PlacezCalendarFilter',
<<<<<<< HEAD
  'filters/DrawerFilterChips',
=======
  'outz/OutzideDrawer',
  'outz/OutzideInViewRail',
  'afterz/AfterzDrawer',
  'afterz/AfterzNightCard',
  'afterz/AfterzHostForm',
>>>>>>> f197d32 (Add Outzide and Afterz map drawers on the shared DrawerTop)
];

export const placezCompilerModules = [
  'cards/PlaceCard',
  'placez/NativePlacezFace',
  'placez/PlacezQuickCard',
  'placez/NativePlacezExpanded',
  'placez/ExpandedPager',
  'scenez/SceneCardFace',
  'outz/native/NativeOutzideFace',
];

export function cardCompilerFunction(module) {
  if (module === 'scenez/SceneCardFace') return 'Closed';
  if (module === 'outz/native/NativeOutzideFace') return 'OutzClosed';
  return module.split('/').pop();
}

export const cardSourcePatterns = [
  /[\\/]client[\\/]src[\\/]components[\\/]scenez[\\/]SceneCardFace\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]outz[\\/]native[\\/]NativeOutzideFace\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]cards[\\/]PlaceCard\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]placez[\\/](?:NativePlacezFace|PlacezQuickCard|NativePlacezExpanded|ExpandedPager)\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]places[\\/](?:PlacezDrawer|PlacezMapDrawer|PlacezEventsRails|EventPlanExtension|PlacezInViewRail)\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]drawers[\\/](?:DrawerTop|DrawerCountdownCard|DrawerFilterRail|DrawerMiniCard|PlacezCalendarFilter)\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]filters[\\/]DrawerFilterChips\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]cards[\\/](?:EventCard|BoardCard)\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]events[\\/](?:FlyerBoard|EventFlyerFront)\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]events[\\/]EventRailCard\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]events[\\/]EventFlyerArt\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]home[\\/]TonightEventCard\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]board[\\/]BoardBrowseCard\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]board[\\/]punk[\\/]PunkBoardCard\.jsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]board[\\/]punk[\\/]ZineCard\.jsx$/,
];

export const cardCompilerExcludedPatterns = [
  /[\\/]node_modules[\\/]/,
  /\x00rolldown\/runtime\.js/,
  /[\\/]script[\\/]fixtures[\\/]/,
];

