import type {Business} from '@/pages/Directory';
import {parsePacificDateTime} from '@shared/missedConnections';
import {eventPath} from '@shared/eventSlug';
import {placePath} from '@shared/placeSlug';
import {resolveBusinessLocations} from '@shared/businessLocations';
import type {CalendarFeed} from './eventCalendar';
import type {NextEvent} from './nextEvent';
import type {PlaceActivity} from './activity';
import type {NearbyRestaurant} from './PlaceLocation';
import type {PlaceActivePosts} from './PlaceFeed';
import type {PlacePeopleData} from './PlacePeople';
import type {NativePlace} from './nativeModel';
/** Existing detail route supplies public LIVE gigs and ACTIVE missed connections. */
export function nativePlacezData(place:NativePlace,updatedAt:number,origin:string,now:number){
 const checkedAt=updatedAt>0?new Date(updatedAt).toISOString():'';
 const sourceUrl=`${origin}/api/directory/${place.id}`;
 const events:NextEvent[]=(place.upcomingEvents||[]).flatMap(event=>{
  const start=parsePacificDateTime(event.dateStart);
  return start===null||event.previewExample?[]:[{id:String(event.id),venueId:place.id,title:event.title,startsAt:new Date(start).toISOString(),timeZone:'America/Los_Angeles',sourceUrl,checkedAt,href:eventPath(event.id,event.title)}];
 }).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt));
 const calendarFeed:CalendarFeed|undefined=place.upcomingEvents===undefined||!checkedAt?undefined:{checkedAt,timeZone:'America/Los_Angeles',sourceUrl,events};
 const nextEvent=events.find(event=>Date.parse(event.startsAt)>now);
 const activity:PlaceActivity={venueId:place.id,gigzCount:place.gigs?.length??null,mizzedConnectionsCount:place.spotted?.length??null,checkedAt};
 const activePosts:PlaceActivePosts={venueId:place.id,checkedAt,
  gigz:{status:place.gigs===undefined?'unavailable':place.gigs.length?'ready':'empty',posts:(place.gigs||[]).map(post=>({id:post.id,title:post.title,href:`/gigz?post=${post.id}`}))},
  mizzed:{status:place.spotted===undefined?'unavailable':place.spotted.length?'ready':'empty',posts:(place.spotted||[]).map(post=>({id:post.id,title:post.title,body:post.body}))}};
 const people:PlacePeopleData={venueId:place.id,checkedAt,owner:{status:'unavailable',people:[]},staff:{status:'unavailable',people:[]},promoters:{status:place.promoters===undefined?'unavailable':place.promoters.length?'available':'empty',people:(place.promoters||[]).map(person=>({id:String(person.id),name:person.displayName||person.username,role:'Promoter'}))}};
 return {calendarFeed,nextEvent,activity,activePosts,people};
}
const radians=(v:number)=>v*Math.PI/180;
export function nearbyPlacezRestaurants(place:NativePlace,rows:Business[]):NearbyRestaurant[]{
 const origin=resolveBusinessLocations(place)[0];const lat=place.lat??origin?.lat,lng=place.lng??origin?.lng;
 if(lat==null||lng==null||!Number.isFinite(lat)||!Number.isFinite(lng))return [];
 return rows.flatMap(row=>{
  if(row.id===place.id||row.type!=='restaurant'||row.status==='CLOSED'||!(row.queerOwned||row.queerFriendly))return [];
  return resolveBusinessLocations(row).flatMap(loc=>{
   if(loc.lat==null||loc.lng==null||!Number.isFinite(loc.lat)||!Number.isFinite(loc.lng))return [];
   const h=Math.sin(radians(loc.lat-lat)/2)**2+Math.cos(radians(lat))*Math.cos(radians(loc.lat))*Math.sin(radians(loc.lng-lng)/2)**2;
   const distanceMiles=3958.8*2*Math.asin(Math.min(1,Math.sqrt(h)));
   return distanceMiles>3?[]:[{id:row.id,name:row.name,address:loc.address,lat:loc.lat,lng:loc.lng,href:placePath(row.id,row.name),distanceMiles,distanceLabel:`${distanceMiles.toFixed(1)} mi`}];
  });
 }).sort((a,b)=>a.distanceMiles-b.distanceMiles).filter((row,index,all)=>all.findIndex(other=>other.id===row.id)===index);
}
