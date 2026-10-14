/** Reset visibility reflects every active discovery filter, including region-only choices. */
export function hasActiveOutzFilters(state) {
  return state.region !== 'all' || state.hiddenKinds.size > 0 || state.kind !== 'all' || Boolean(state.query || state.browseRegion || state.activities.length);
}
