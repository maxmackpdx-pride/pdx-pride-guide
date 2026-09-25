// Cluster by projected screen distance. Broad overviews group destination
// types; the Portland / Salem corridor (zoom 7+) separates activity groups.
export function clusterWaypoints(places, project, zoom, selectedId, {mobile=false}={}) {
  const groups=[];
  const radius=zoom>=14?0:zoom<8?(mobile?138:116):zoom<10?(mobile?112:92):(mobile?88:72);
  const mixedKinds=zoom<7;
  for(const place of [...places].sort((a,b)=>a.id.localeCompare(b.id))){
    if(!Number.isFinite(place.lat)||!Number.isFinite(place.lng))continue;
    const point=project([place.lng,place.lat]);
    let nearest=null,distance=radius;
    if(place.id!==selectedId&&radius){
      for(const group of groups){
        if(group.members[0].id===selectedId||(!mixedKinds&&group.kind!==place.kind))continue;
        const d=Math.hypot(point.x-group.x,point.y-group.y);
        if(d<distance){nearest=group;distance=d}
      }
    }
    if(!nearest)groups.push({kind:place.kind,x:point.x,y:point.y,lng:place.lng,lat:place.lat,members:[place]});
    else{
      const n=nearest.members.length;
      for(const [key,value] of Object.entries({x:point.x,y:point.y,lng:place.lng,lat:place.lat}))nearest[key]=(nearest[key]*n+value)/(n+1);
      if(nearest.kind!==place.kind)nearest.kind='mixed';
      nearest.members.push(place);
    }
  }
  return groups;
}
