export const STASH_WORK_XP = {DJ:70,DRAG:70,MC:60,GOGO:55,PHOTO:45,BAR:40,SECURITY:40,VOLUNTEER:35,VENDOR:35,WENT:15} as const;
export type StashRole = keyof typeof STASH_WORK_XP;
export function normalizeStashRole(raw?: string | null): StashRole {
  const role=String(raw || 'WENT').toUpperCase().replace(/[\s/-]+/g,'');
  if(role==='DJ'||role==='DJSET')return 'DJ';
  if(role==='DRAG'||role==='PERFORMER')return 'DRAG';
  if(['MC','HOST','HOSTMC','PRIMARY','COHOST'].includes(role))return 'MC';
  if(role==='GOGO'||role==='GOGODANCER')return 'GOGO';
  if(['PHOTO','PHOTOG','PHOTOGRAPHER'].includes(role))return 'PHOTO';
  if(['BAR','BARTENDER','BARTEND'].includes(role))return 'BAR';
  if(role==='SECURITY'||role==='DOOR')return 'SECURITY';
  if(role==='VOLUNTEER'||role==='CREW')return 'VOLUNTEER';
  if(role==='VENDOR')return 'VENDOR';
  return 'WENT';
}
/** Pure album identity/scoring. Trips are self-entered past check-ins, never
 * evidence of GPS-verified visits. Caller supplies only authorized records. */
export function buildStashCollection<
 E extends {id:number;stashRole?:string|null;featured?:boolean},
 A extends {placeId:string;calendarDate:string},
 P extends {id:number},
 B extends {id:number;contentType?:string},
>({events,adventures,places,posts,canRenderPosts}:{events:E[];adventures:A[];places:P[];posts:B[];canRenderPosts:boolean}) {
 const eventMap=new Map<number,E>();
 for(const event of events){
  const old=eventMap.get(event.id);
  if(!old){eventMap.set(event.id,event);continue;}
  const strongest=STASH_WORK_XP[normalizeStashRole(event.stashRole)]>STASH_WORK_XP[normalizeStashRole(old.stashRole)]?event:old;
  eventMap.set(event.id,{...strongest,featured:!!(old.featured||event.featured)});
 }
 const uniqueEvents=[...eventMap.values()];
 const uniqueAdventures=[...new Map(adventures.map(trip=>[`${trip.placeId}:${trip.calendarDate}`,trip])).values()];
 const uniquePlaces=[...new Map(places.map(place=>[place.id,place])).values()];
 const uniquePosts=[...new Map(posts.filter(post=>canRenderPosts&&['GIG','GIFTING','HUB'].includes(post.contentType||'')).map(post=>[`${post.contentType}:${post.id}`,post])).values()];
 const counts={flyers:uniqueEvents.length,outz:uniqueAdventures.length,places:uniquePlaces.length,boards:uniquePosts.length,all:uniqueEvents.length+uniqueAdventures.length+uniquePlaces.length+uniquePosts.length};
 const eventXp=uniqueEvents.reduce((total,event)=>total+STASH_WORK_XP[normalizeStashRole(event.stashRole)]+(event.featured?25:0),0);
 const collectionXp=counts.outz*25+counts.places*10+counts.boards*10;
 return {events:uniqueEvents,adventures:uniqueAdventures,places:uniquePlaces,posts:uniquePosts,counts,eventXp,collectionXp,totalXp:eventXp+collectionXp};
}
