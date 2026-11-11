import {Link} from 'wouter';
import {useEffect,useId,useState} from 'react';
import {buildEventCalendar,eventPublicHref,type CalendarFeed} from './eventCalendar';

export default function SevenDayEvents({feed,venueId,previewNow}:{feed?:CalendarFeed;venueId:number;previewNow?:number}) {
  const [clock,setClock]=useState(()=>previewNow??Date.now()),[selected,setSelected]=useState<string|null>(null),id=useId();
  useEffect(()=>{
    if(previewNow!==undefined){setClock(previewNow);return;}
    let timer:ReturnType<typeof setTimeout>|undefined;
    const tick=()=>{clearTimeout(timer);setClock(Date.now());if(!document.hidden)timer=setTimeout(tick,60000-Date.now()%60000);};
    tick();document.addEventListener('visibilitychange',tick);
    return()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',tick);};
  },[previewNow]);
  const calendar=buildEventCalendar(feed,venueId,clock),days=calendar.days;
  const active=days.find(d=>d.key===selected)||days.find(d=>d.events.length)||days[0];
  return <section className="pz-event-calendar" aria-labelledby={id}>
    <div className="pz-section-heading"><h3 id={id}>Next 7 days</h3><span>Events · {calendar.zoneLabel||'Local time'}</span></div>
    <div className="pz-calendar-rail" aria-label="Choose an event day">{days.map(day=><button key={day.key} type="button" className="pz-calendar-day" aria-pressed={active?.key===day.key} aria-controls={`${id}-events`} aria-label={`${day.label}. ${calendar.fresh?`${day.events.length} upcoming ${day.events.length===1?'event':'events'}`:'Listings need refresh'}`} onClick={()=>setSelected(day.key)}>
      <span>{day.weekday}</span><strong>{day.day}</strong><small>{calendar.fresh?(day.events.length?`${day.events.length} ${day.events.length===1?'event':'events'}`:'—'):'—'}</small>
    </button>)}</div><p className="pz-calendar-help">Scroll for all 7 days</p>
    <div className="pz-calendar-events" id={`${id}-events`} aria-live="polite">
      <p className="pz-calendar-date">{active?.label||'Events'}</p>
      {!calendar.fresh?<p className="pz-calendar-empty">Event listings need a refresh. No availability is assumed.</p>:active?.events.length?<ul>{active.events.map(event=><li key={event.id}><time dateTime={event.startsAt}>{new Intl.DateTimeFormat('en-US',{timeZone:calendar.timeZone,hour:'numeric',minute:'2-digit'}).format(Date.parse(event.startsAt))}</time>{eventPublicHref(event.href)?<Link href={eventPublicHref(event.href)!}>{event.title}<span aria-hidden="true">↗</span></Link>:<strong>{event.title}</strong>}</li>)}</ul>:<p className="pz-calendar-empty">No upcoming events listed for this day.</p>}
    </div>
  </section>;
}
