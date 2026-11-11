import {remainingToEvent,type NextEvent} from './nextEvent';

export interface CalendarFeed {
  checkedAt:string;
  timeZone:string;
  sourceUrl:string;
  events:NextEvent[];
}
export interface CalendarDay {key:string;weekday:string;day:string;label:string;events:NextEvent[];}

/** Seven local calendar dates, not seven 24-hour periods. This preserves DST boundaries. */
export function buildEventCalendar(feed:CalendarFeed|undefined,venueId:number,now=Date.now()) {
  const timeZone=feed?.timeZone||'America/Los_Angeles';
  let parts:Intl.DateTimeFormatPart[];
  try {parts=new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);}
  catch {return {days:[] as CalendarDay[],fresh:false,timeZone,zoneLabel:'',reason:'unavailable' as const};}
  const value=(type:string)=>Number(parts.find(p=>p.type===type)?.value);
  const first=Date.UTC(value('year'),value('month')-1,value('day'),12);
  const dateFormatter=new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'});
  const dateKey=(at:number)=>{
    const p=dateFormatter.formatToParts(at);
    return ['year','month','day'].map(k=>p.find(v=>v.type===k)?.value).join('-');
  };
  const checked=Date.parse(feed?.checkedAt||'');
  const fresh=Boolean(feed&&/^https?:\/\//.test(feed.sourceUrl)&&Number.isFinite(checked)&&checked<=now&&now-checked<=24*3600000);
  const byDate=new Map<string,NextEvent[]>();
  if(fresh)for(const event of feed!.events){
    if(event.timeZone!==timeZone||!remainingToEvent(event,venueId,now))continue;
    const key=dateKey(Date.parse(event.startsAt)),bucket=byDate.get(key)||[];
    bucket.push(event);byDate.set(key,bucket);
  }
  const days:CalendarDay[]=Array.from({length:7},(_,index)=>{
    const date=new Date(first+index*86400000),key=date.toISOString().slice(0,10);
    const events=(byDate.get(key)||[]).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt));
    return {key,weekday:new Intl.DateTimeFormat('en-US',{timeZone:'UTC',weekday:'short'}).format(date),day:String(date.getUTCDate()),label:new Intl.DateTimeFormat('en-US',{timeZone:'UTC',weekday:'long',month:'long',day:'numeric'}).format(date),events};
  });
  const zoneLabel=new Intl.DateTimeFormat('en-US',{timeZone,timeZoneName:'short'}).formatToParts(now).find(p=>p.type==='timeZoneName')?.value||timeZone;
  return {days,fresh,timeZone,zoneLabel,reason:feed?'stale' as const:'unavailable' as const};
}

export function eventPublicHref(href:string|undefined){
  if(!href)return null;
  if(/^\/events\/\d+(?:\/|\?|$)/.test(href))return href;
  try{const url=new URL(href);return url.protocol==='https:'&&url.hostname==='www.zaylist.com'&&/^\/events\/\d+(?:\/|$)/.test(url.pathname)?`${url.pathname}${url.search}${url.hash}`:null;}catch{return null;}
}
