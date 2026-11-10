/**
 * React Compiler experimental production candidate.
 * Shared by Vite's real app build and the isolated browser comparison so the
 * measured allowlist cannot drift from the proposed deployment configuration.
 * Scope tightened after four production-optimized whole-page trials on
 * cde93d3: Eventz/Boardz improved; Resources/Placez did not consistently improve.
 * Do not broaden scope to routes, Mapz, auth, consent, or modal controllers.
 */
export const cardFaceModules = [
  'events/EventRailCard',
  'events/EventFlyerArt',
  'home/TonightEventCard',
  'board/BoardBrowseCard',
  'board/punk/PunkBoardCard',
  'board/punk/ZineCard',
];

// Identical to the allowlist measured in PR #69's four-trial Chromium fixture.
// Compile only category-specific Eventz and Boardz card entries plus their
// enumerated faces. Placez and Needz have not demonstrated consistent whole-
// page benefit and remain uncompiled. The shared ZaylistCard switch also
// renders Needz and Outzide; it stays uncompiled alongside CardAPI, helpers,
// consent/privacy controllers and other card-family renderers.
export const cardSourcePatterns = [
  /[\\/]client[\\/]src[\\/]components[\\/]cards[\\/](?:EventCard|BoardCard)\.tsx$/,
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
