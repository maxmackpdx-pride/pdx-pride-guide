/** Only a source-backed event with an explicit timezone offset can drive a countdown. */
export interface NextEvent {
  id:string;venueId:number;title:string;startsAt:string;timeZone:string;
  sourceUrl:string;checkedAt:string;href?:string;
}
export function remainingToEvent(event:NextEvent|undefined,venueId:number,now=Date.now()){
  if(!event||event.venueId!==venueId||!event.title.trim()||!/^https?:\/\//.test(event.sourceUrl))return null;
  if(!/(Z|[+-]\d{2}:\d{2})$/.test(event.startsAt))return null;
  try{new Intl.DateTimeFormat('en-US',{timeZone:event.timeZone}).format(0);}catch{return null;}
  const starts=Date.parse(event.startsAt),checked=Date.parse(event.checkedAt);
  if(!Number.isFinite(starts)||!Number.isFinite(checked)||checked>now||now-checked>24*60*60*1000||starts<=now)return null;
  const minutes=Math.ceil((starts-now)/60000);
  return{days:Math.floor(minutes/1440),hours:Math.floor(minutes%1440/60),minutes:minutes%60,starts};
}
