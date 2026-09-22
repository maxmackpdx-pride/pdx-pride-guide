// `map.loaded()` includes every overlay and becomes false again during updates.
// Only the OpenFreeMap vector source determines whether the basemap has failed.
export function installBasemapStatus(map, banner) {
  map.on('error', event => {
    console.warn('Map source:', event.error?.message);
    if (event.sourceId === 'terrain') banner.hidden = false;
  });
  map.on('sourcedata', event => {
    // Metadata alone (or idle after failed requests) does not prove recovery.
    // A successful tile can recover before optional sources let the map go idle.
    if (event.sourceId === 'terrain' && event.tile?.state === 'loaded') {
      banner.hidden = true;
    }
  });
}
