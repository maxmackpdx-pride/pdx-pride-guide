// `map.loaded()` includes every overlay and becomes false again during updates.
// Only the OpenFreeMap vector source determines whether the basemap has failed.
export function installBasemapStatus(map, banner) {
  let sourceFailed=false,contextLost=false;
  const sync=()=>{banner.hidden=!sourceFailed&&!contextLost;};
  map.on('error', event => {
    console.warn('Map source:', event.error?.message);
    if (event.sourceId === 'terrain') {sourceFailed=true;sync();}
  });
  map.on('sourcedata', event => {
    // Metadata alone (or idle after failed requests) does not prove recovery.
    // A successful tile can recover before optional sources let the map go idle.
    if (event.sourceId === 'terrain' && event.tile?.state === 'loaded') {
      sourceFailed=false;sync();
    }
  });
  map.on('webglcontextlost',()=>{contextLost=true;sync();});
  map.on('webglcontextrestored',()=>{contextLost=false;sync();});
}
