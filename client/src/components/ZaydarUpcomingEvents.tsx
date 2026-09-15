import type {Event} from '@shared/schema';
import {parsePacificDateTime} from '@shared/missedConnections';
import {EVENT_PLACEHOLDER_PENDING,resolveEventPosterUrl} from '@shared/eventPoster';

type Props={events:Event[];loading:boolean;onOpen:(event:Event,target:HTMLElement)=>void};
const dateLabel=(value:string)=>new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',weekday:'short',month:'short',day:'numeric',hour:'numeric'}).format(new Date(parsePacificDateTime(value)??value));

export default function ZaydarUpcomingEvents({events,loading,onOpen}:Props){
 const now=Date.now();
 const rows=events.filter(event=>(parsePacificDateTime(event.dateStart)||0)>=now).sort((a,b)=>(parsePacificDateTime(a.dateStart)||0)-(parsePacificDateTime(b.dateStart)||0)).slice(0,4);
 return <section className="zaydar-upcoming" aria-labelledby="zaydar-events-title">
  <h2 id="zaydar-events-title">Upcoming events</h2>
  {loading&&<p role="status" className="zaydar-rsvp-note">Loading upcoming events…</p>}
  {!loading&&!rows.length&&<p className="zaydar-rsvp-note">New events will appear here as they are added.</p>}
  <div className="zaydar-rsvp-list">{rows.map(event=><button type="button" className="zaydar-upcoming-event" key={event.id} onClick={click=>onOpen(event,click.currentTarget)}>
   <img src={resolveEventPosterUrl(event.id,event.posterImageUrl,event.dayOfWeek)} onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=EVENT_PLACEHOLDER_PENDING;}} alt="" loading="lazy"/>
   <span><strong>{event.title}</strong><time dateTime={event.dateStart}>{dateLabel(event.dateStart)}</time><small>{event.venueName}</small></span><b aria-hidden="true">›</b>
  </button>)}</div>
 </section>;
}
