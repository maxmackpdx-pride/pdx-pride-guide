import {useEffect,useState} from 'react';
import {remainingToEvent,type NextEvent} from './nextEvent';
export default function NextEventCountdown({event,venueId,previewNow,compact=false}:{event?:NextEvent;venueId:number;previewNow?:number;compact?:boolean}){
 const [clock,setClock]=useState(()=>previewNow??Date.now());
 useEffect(()=>{
  if(previewNow!==undefined){setClock(previewNow);return;}if(!event)return;
  let timer:ReturnType<typeof setTimeout>|undefined;
  const tick=()=>{clearTimeout(timer);const now=Date.now();setClock(now);if(!document.hidden&&remainingToEvent(event,venueId,now))timer=setTimeout(tick,Math.min(60000-now%60000,Math.max(1,Date.parse(event.startsAt)-now),Math.max(1,Date.parse(event.checkedAt)+24*3600000-now)));};
  tick();document.addEventListener('visibilitychange',tick);return()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',tick);};
 },[event,venueId,previewNow]);
 const remaining=remainingToEvent(event,venueId,clock);if(!event||!remaining)return null;
 const when=new Intl.DateTimeFormat('en-US',{timeZone:event.timeZone,month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(remaining.starts);
 return <section className={`pz-countdown${compact?' pz-countdown--compact':''}`} title={`${event.title} · ${when}`} aria-label={`Next event: ${event.title}. ${when}. ${remaining.days} days ${remaining.hours} hours ${remaining.minutes} minutes remaining.`}>
  <div className="pz-countdown-heading"><p className="pz-countdown-label">Next event</p>{compact&&<span className="pz-countdown-inline" aria-hidden="true">{remaining.days>0?`${remaining.days}d `:''}{String(remaining.hours).padStart(2,'0')}h {String(remaining.minutes).padStart(2,'0')}m</span>}</div>
  <p className="pz-countdown-title">{event.title}</p>
  {!compact&&<div className="pz-countdown-digits" aria-hidden="true">{[[remaining.days,'days'],[remaining.hours,'hrs'],[remaining.minutes,'min']].map(([value,label])=><span key={label}><strong>{String(value).padStart(2,'0')}</strong><small>{label}</small></span>)}</div>}
  <time dateTime={event.startsAt}>{when}</time>
 </section>;
}
