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
export const placezCompilerModules = [
  'cards/PlaceCard',
  'placez/NativePlacezFace',
  'placez/PlacezQuickCard',
  'placez/NativePlacezExpanded',
  'placez/ExpandedPager',
  'scenez/SceneCardFace',
  'outz/native/NativeOutzideFace',
];

/** The open event card and the new card types it opens (Tucker, t321u):
 * module -> the component functions that must each own a compiler cache.
 * The legacy EventModal manage view, AuthModal and VenueFollowButton stay out. */
export const openCardModules = [
  ['events/OpenEventCard', ['OpenEventCard', 'EventFeedChat', 'FlyerViewer']],
  ['events/OpenCardShare', ['EventSharePopup', 'GigInvitePopup', 'ShareJoinPrompt', 'ShareImagePanel']],
  ['events/EventFormCards', ['EventFormCard']],
  ['events/EventParticipation', ['EventInterestedHeart', 'EventPrivateSaveButton']],
  ['cards/ActionSheetCard', ['ActionSheetCard']],
  ['cards/ExpandingActionPanel', ['ExpandingActionPanel']],
  ['cards/FormCard', ['FormCard']],
  ['cards/cardLogo', ['CardLogoMark']],
  ['events/EventRailCards', ['EventRailCard', 'CarpoolRailCard']],
  ['cards/rideBrands', ['RideBrandMark']],
  ['inbox/InboxGroupChat', ['TimedInboxGroupChat']],
  ['HeartButton', ['HeartButton']],
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
  /[\\/]client[\\/]src[\\/]components[\\/]cards[\\/](?:EventCard|BoardCard)\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]events[\\/](?:FlyerBoard|EventFlyerFront)\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]events[\\/]EventRailCard\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]events[\\/]EventFlyerArt\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]home[\\/]TonightEventCard\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]board[\\/]BoardBrowseCard\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]board[\\/]punk[\\/]PunkBoardCard\.jsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]board[\\/]punk[\\/]ZineCard\.jsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]events[\\/](?:OpenEventCard|OpenCardShare|EventFormCards|EventParticipation|EventRailCards)\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]cards[\\/](?:ActionSheetCard|ExpandingActionPanel|FormCard|cardLogo|rideBrands)\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]inbox[\\/]InboxGroupChat\.tsx$/,
  /[\\/]client[\\/]src[\\/]components[\\/]HeartButton\.tsx$/,
];

export const cardCompilerExcludedPatterns = [
  /[\\/]node_modules[\\/]/,
  /\x00rolldown\/runtime\.js/,
  /[\\/]script[\\/]fixtures[\\/]/,
];

