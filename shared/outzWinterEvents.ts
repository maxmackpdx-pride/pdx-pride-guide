export const winterPrideWatches = [
 {sourceKey:'outz-winter-pride-bachelor',placeId:'winter-bachelor',label:'Winter PrideFest · OUT Central Oregon',url:'https://www.winterpridefestcentraloregon.com/',aliases:['Mt. Bachelor','Mt. Bachelor Ski Resort','Mt. Bachelor Ski Area'],note:'2027 festival dates announced February 25–28; individual event dates, times, venues and ticket details not yet posted. Never roll 2026 occurrences into 2027.'},
 {sourceKey:'outz-winter-pride-meadows',placeId:'winter-meadows',label:'Mt. Hood Meadows · Pride Day only',url:'https://www.skihood.com/explore/pride-day',aliases:['Mt. Hood Meadows','Mt. Hood Meadows Ski Resort'],note:'The April 18, 2026 occurrence was canceled. Await an explicitly announced future LGBTQ+ occurrence.'},
 {sourceKey:'outz-winter-pride-crystal',placeId:'winter-crystal',label:'Crystal Mountain · MTN Pride only',url:'https://www.crystalmountainresort.com/things-to-do/event-calendar/mtn-pride-pride-in-the-pow',aliases:['Crystal Mountain','Crystal Mountain Resort'],note:'The available occurrence is March 21–22, 2026. Do not infer a 2027 date.'},
 {sourceKey:'outz-winter-pride-stevens',placeId:'winter-stevens',label:'Stevens Pass · Pride Parade only',url:'https://blog.stevenspass.com/stevens-pass-update-2-21-25/',aliases:['Stevens Pass','Stevens Pass Ski Resort'],note:'Historical official Pride parade evidence only. Follow official event links to find new explicit LGBTQ+ occurrences; do not import ordinary resort programming.'},
];
export const winterEventScope = 'User-authorized OR/WA resort LGBTQ+ weekends and Pride events only. Require event-specific LGBTQ+ evidence, exact resort identity, official occurrence dates/times and normal publication gates. Exclude races, concerts, generic après, general resort calendars and ambiguous uses of pride. This does not replace other QSearch sources.';
export function explicitWinterPrideEvent(event:{title?:unknown;description?:unknown}){
 const text=String(event.title||'')+' '+String(event.description||'');
 return /\b(?:lgbtq?\+?|queer|gay ski|ski (?:with|the mountain with) pride|pride (?:day|weekend|parade|in the pow|ski))\b|winter\s*pride\s*fest|winterpridefest|mtn pride/i.test(text);
}
const normalized=(s:unknown)=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g,'');
export function resortForPrideEvent(event:{title?:unknown;description?:unknown;venueName?:unknown;ticketUrl?:unknown}){
 if(!explicitWinterPrideEvent(event))return null;
 return winterPrideWatches.find(w=>w.aliases.some(a=>normalized(a)===normalized(event.venueName)))?.placeId||null;
}
export function publicWinterEvents(events:Array<any>,now=Date.now()){
 return events.filter(e=>e.status==='LIVE'&&e.isPublic&&!e.isPrivate&&Number.isFinite(Date.parse(e.dateStart))&&Date.parse(e.dateEnd)>now)
  .flatMap(e=>{const placeId=resortForPrideEvent(e);return placeId?[{id:e.id,placeId,title:e.title,dateStart:e.dateStart,dateEnd:e.dateEnd,href:'/events/'+e.id}]:[]});
}
