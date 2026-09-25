export const MIZZED_NOTIFICATION_LIFETIME=8*24*60*60*1000;
export const EVENT_WAYPOINT_GAP=24;
export const TONIGHT_HEIGHT_MULTIPLIER=1.2;

export function mizzedNotificationActive(row,now=Date.now()){
 if(row.waypointFamily!=='mizzed')return true;
 const created=Date.parse(row.createdAt),closes=Date.parse(row.closesAt);
 return Number.isFinite(created)&&now>=created&&now<created+MIZZED_NOTIFICATION_LIFETIME
  &&(!Number.isFinite(closes)||now<closes)&&(!row.status||row.status==='ACTIVE');
}

// Keep a real venue waypoint even when the Placez layer is hidden. Never infer
// a venue from proximity: the host resolves a directory identity first.
export function attachVenueRows(rows){
 const result=rows.map(row=>({...row}));
 for(const row of result.slice()){
  const venue=row.venueAnchor;if(!venue)continue;
  let parent=result.find(other=>other.kind==='place'&&(other.logoKey===venue.key||other.key===venue.key)
   &&Math.hypot(other.coordinates[0]-venue.coordinates[0],other.coordinates[1]-venue.coordinates[1])<.00001);
  if(!parent){parent={...venue,kind:'place',waypointFamily:'places',logoKey:venue.key,attachmentOnly:true};result.push(parent);}
  row.coordinates=parent.coordinates;row.venueWaypointKey=parent.key;
 }
 return result;
}

export function extensionGeometry(parent,index=0,selected=false){
 const size=selected?44:28,gap=12;
 const right=parent.x-parent.size/2-gap-index*(44+gap);
 return {x:right-size/2,y:parent.y,size,right,startX:parent.x-parent.size/2};
}
