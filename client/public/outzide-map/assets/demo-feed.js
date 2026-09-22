// Fictional preview content only. Never sent to community APIs.
export function demoFeedItems(){
 const examples=[
 ['TRIP_NOTE','Forest Park · Wildwood Trails','A slow morning on Wildwood','Demo trail note: took the shady route and stopped for photos. Looking for suggestions for another easy city hike.','Milo','__openplans'],
 ['LOOKING_FOR_COMPANY','Rooster Rock','Beach afternoon, anyone?','Demo plan: bringing a picnic and looking for a few people to hang out with. We’ll check access and river conditions before choosing a time.','Jay','rooster-rock'],
 ['HIKE_BUDDY','Destination open','Find a hike buddy · pick the trail together','Demo request: Portland area, relaxed pace, around 4–6 miles. Flexible on the day and destination. Who wants to choose a hike together?','Alex','__openplans'],
 ['CAMP_BUDDY','Destination open','Looking for a camping buddy','Demo request: one or two nights by a lake or on the coast. I have a tent and stove; let’s decide on dates and a campground together.','River','__openplans'],
 ['CARPOOL_OFFER','Rooster Rock','Ride offer · two seats from Portland','Demo offer: leaving from Northeast Portland for a beach day. Two seats available; meeting place and return time to be agreed together.','Sam','rooster-rock'],
 ['CARPOOL_REQUEST','Sauvie Island','Ride request · one seat to Collins','Demo request: hoping to join a ride from North Portland. Happy to split fuel costs. Flexible on departure and return.','Kai','sauvie-island'],
 ['checkin','Umpqua Hot Springs','Planning a visit with friends','Demo check-in: a small group is planning a morning soak and a picnic. This is a fictional check-in, not someone currently at the springs.','Rowan','umpqua-hot-springs'],
 ['weather','Northwest','Example weather update','Demo weather notice: an agency update would appear here with its affected area, issue time and official link. This is not a current forecast or warning.','Example agency feed',null]
 ];
 return examples.map(([kind,placeName,title,body,author,placeId],i)=>({id:'demo:'+i,demo:true,kind:['weather','checkin'].includes(kind)?kind:'post',postKind:['weather','checkin'].includes(kind)?undefined:kind,placeId,placeName,title,body,author,createdAt:new Date(Date.now()-i*3600000).toISOString()}));
}
