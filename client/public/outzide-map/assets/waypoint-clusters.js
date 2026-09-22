// Cluster only matching categories. Measure spacing in screen pixels so a wider
// map view naturally condenses more destinations into each beacon.
export function clusterWaypoints(places, project, zoom, selectedId) {
  const groups = [];
  const radius = zoom >= 14 ? 0 : zoom < 8 ? 105 : 80;
  for (const place of [...places].sort((a,b)=>a.id.localeCompare(b.id))) {
    if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) continue;
    const point = project([place.lng,place.lat]);
    let nearest = null, distance = radius;
    if (place.id !== selectedId && radius) {
      for (const group of groups) {
        if (group.kind !== place.kind || group.members[0].id === selectedId) continue;
        const d = Math.hypot(point.x-group.x,point.y-group.y);
        if (d < distance) { nearest=group; distance=d; }
      }
    }
    if (!nearest) groups.push({kind:place.kind,x:point.x,y:point.y,lng:place.lng,lat:place.lat,members:[place]});
    else {
      const n=nearest.members.length;
      for (const [key,value] of Object.entries({x:point.x,y:point.y,lng:place.lng,lat:place.lat})) nearest[key]=(nearest[key]*n+value)/(n+1);
      nearest.members.push(place);
    }
  }
  return groups;
}
