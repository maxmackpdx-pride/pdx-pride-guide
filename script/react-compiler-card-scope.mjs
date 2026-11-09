/**
 * React Compiler experimental production candidate.
 * Shared by Vite's real app build and the isolated browser comparison so the
 * measured allowlist cannot drift from the proposed deployment configuration.
 * Do not broaden scope to routes, Mapz, auth, consent, or modal controllers.
 */
export const cardFaceModules = [
  'events/EventRailCard',
  'events/EventFlyerArt',
  'home/TonightEventCard',
  'board/BoardBrowseCard',
  'board/punk/PunkBoardCard',
  'board/punk/ZineCard',
  'home/TodayLocationCard',
];

// Identical to the allowlist measured in PR #69's four-trial Chromium fixture.
// Only the four measured Eventz/Boardz/Placez card API entry components are in scope.
// Never infer-compile shared CardAPI, NeedzCard, OutzCard, model/test helpers, or
// consent/privacy controllers through a wildcard directory rule.
export const cardSourcePatterns = [
  /[\\/]client[\\/]src[\\/]components[\\/]cards[\\/](?:EventCard|BoardCard|PlaceCard|ZaylistCard)\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]discovery[\\/]PlaceDiscoveryCard\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]events[\\/]EventRailCard\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]events[\\/]EventFlyerArt\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]home[\\/]TonightEventCard\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]board[\\/]BoardBrowseCard\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]board[\\/]punk[\\/]PunkBoardCard\.jsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]board[\\/]punk[\\/]ZineCard\.jsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]home[\\/]TodayLocationCard\.tsx$/,
];

export const cardCompilerExcludedPatterns = [
  /[\\/]node_modules[\\/]/,
  /\x00rolldown\/runtime\.js/,
  /[\\/]script[\\/]fixtures[\\/]/,
];
