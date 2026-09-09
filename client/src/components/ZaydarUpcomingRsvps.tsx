import {useEffect,useRef,useState} from 'react';
import {useMutation,useQuery} from '@tanstack/react-query';
import {MoreHorizontal,CalendarDays,Check,Share2,MessageCircle,Megaphone,X} from 'lucide-react';
import type {Event} from '@shared/schema';
import {ATTENDANCE_PHRASES} from '@shared/attendancePhrases';
import {EVENT_PLACEHOLDER_PENDING,resolveEventPosterUrl} from '@shared/eventPoster';
import {eventPath} from '@shared/eventSlug';
import {useAuth} from '@/context/AuthContext';
import {apiRequest,parseApiError,queryClient} from '@/lib/queryClient';
import {RSVP_CHECKINS_KEY,RSVP_SUMMARIES_KEY} from '@/lib/optimisticCache';
import {shareEventLink,shareToastTitle} from '@/lib/shareEvent';
import {useToast} from '@/hooks/use-toast';

type CheckIn={eventId:number;message?:string;visibility?:string;isAnonymous?:boolean};
type Action='options'|'rsvp'|'host'|'attendees'|null;
const dateLabel=(value:string)=>new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(value));

export default function ZaydarUpcomingRsvps({events,loading,onOpen,onSignIn}:{events:Event[];loading:boolean;onOpen:(event:Event,target:HTMLElement)=>void;onSignIn:()=>void}){
 const {user}=useAuth();
 const preview=Boolean((window as unknown as {__PDX_LOCAL_PREVIEW__?:number}).__PDX_LOCAL_PREVIEW__);
 const [now,setNow]=useState(Date.now);
 const [removed,setRemoved]=useState<number[]>([]);
 useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(timer);},[]);
 const checkIns=useQuery<CheckIn[]>({queryKey:[...RSVP_CHECKINS_KEY],queryFn:()=>apiRequest('GET','/api/events/mine/check-ins').then(r=>r.json()),enabled:!!user&&!preview});
 // The server's host list includes co-hosts and is the same authority used by host updates.
 const hosted=useQuery<Event[]>({queryKey:['/api/events/mine/claimed'],queryFn:()=>apiRequest('GET','/api/events/mine/claimed').then(r=>r.json()),enabled:!!user&&!preview});
 const missingIds=(checkIns.data||[]).map(row=>row.eventId).filter(id=>!events.some(event=>event.id===id));
 const missing=useQuery<Event[]>({queryKey:['zaydar-rsvp-events',user?.id,...missingIds],queryFn:async()=>{
  const rows=await Promise.all(missingIds.map(async id=>{const response=await fetch(`/api/events/${id}`,{credentials:'include'});if(response.status===404)return null;if(!response.ok)throw new Error('Could not load your event');return response.json() as Promise<Event>;}));
  return rows.filter((event):event is Event=>event!==null);
 },enabled:!preview&&!!user&&missingIds.length>0});
 const future=[...events,...(missing.data||[])].filter(event=>new Date(event.dateStart).getTime()>=now).sort((a,b)=>Date.parse(a.dateStart)-Date.parse(b.dateStart)).filter((event,index,array)=>array.findIndex(other=>other.id===event.id)===index);
 // Only the explicitly marked, read-only phone demo gets sample RSVPs. Never seed personal caches.
 const samples=future.filter((event,index,array)=>array.findIndex(other=>other.title===event.title)===index).slice(0,3);
 const rows=preview?samples.filter(event=>!removed.includes(event.id)):future.filter(event=>checkIns.data?.some(row=>row.eventId===event.id));
 const waiting=loading||(!preview&&!!user&&(checkIns.isLoading||(missingIds.length>0&&missing.isLoading)));
 return <section className="zaydar-upcoming" aria-labelledby="zaydar-upcoming-title">
  <h2 id="zaydar-upcoming-title">Upcoming RSVPs</h2>
  {preview&&<p className="zaydar-rsvp-note">Sample RSVPs · includes a host preview. Your RSVPs are unchanged.</p>}
  {!preview&&!user?<p className="zaydar-rsvp-note"><button type="button" onClick={onSignIn}>Sign in</button> to see your upcoming RSVPs.</p>:<>
   {waiting&&<p role="status" className="zaydar-rsvp-note">Loading your events…</p>}
   {!preview&&(checkIns.isError||missing.isError)&&<p role="alert" className="zaydar-rsvp-note">Couldn’t load your RSVPs. <button type="button" onClick={()=>{void checkIns.refetch();if(missingIds.length)void missing.refetch();}}>Retry</button></p>}
   {!waiting&&!rows.length&&!checkIns.isError&&!missing.isError&&<p className="zaydar-rsvp-note">Your next plans will appear here when you RSVP to an event.</p>}
   <div className="zaydar-rsvp-list">{rows.map(event=><RsvpRow key={event.id} event={event} checkIn={checkIns.data?.find(row=>row.eventId===event.id)} preview={preview} host={preview?event.id===samples[1]?.id:Boolean(hosted.data?.some(row=>row.id===event.id))} claimed={Boolean(event.claimedBy)||(preview&&event.id===samples[1]?.id)} onOpen={onOpen} onRemove={()=>setRemoved(ids=>[...ids,event.id])}/>)}</div>
  </>}
 </section>;
}

function RsvpRow({event,checkIn,preview,host,claimed,onOpen,onRemove}:{event:Event;checkIn?:CheckIn;preview:boolean;host:boolean;claimed:boolean;onOpen:(event:Event,target:HTMLElement)=>void;onRemove:()=>void}){
 const [action,setAction]=useState<Action>(null);
 const [phrase,setPhrase]=useState(checkIn?.message||"I'll be there");
 const [visibility,setVisibility]=useState(checkIn?.visibility||(checkIn?.isAnonymous?'anonymous':'public'));
 const [body,setBody]=useState('');
 const [error,setError]=useState('');
 const optionsButton=useRef<HTMLButtonElement>(null),panelTitle=useRef<HTMLHeadingElement>(null);
 const {toast}=useToast();
 useEffect(()=>{if(action)panelTitle.current?.focus();},[action]);
 const close=()=>{setAction(null);setError('');optionsButton.current?.focus();};
 const open=(next:Action)=>{setError('');setBody('');if(next==='rsvp'&&!preview){setPhrase(checkIn?.message||"I'll be there");setVisibility(checkIn?.visibility||(checkIn?.isAnonymous?'anonymous':'public'));}setAction(next);};
 const mutation=useMutation({mutationFn:async(kind:'save'|'remove'|'host'|'attendees')=>{
  if(preview){if(kind==='host'||kind==='attendees')throw new Error('Messages are disabled in this preview.');return kind;}
  if(kind==='attendees'&&!host)throw new Error('Only the event host can post updates.');
  if(kind==='host'&&(!event.isPublic||event.isPrivate))throw new Error('Host messaging is not available for this event.');
  if(kind==='save')await apiRequest('POST',`/api/events/${event.id}/attendance`,{message:phrase,visibility,isAnonymous:visibility==='anonymous'});
  if(kind==='remove')await apiRequest('DELETE',`/api/events/${event.id}/attendance`);
  if(kind==='host'||kind==='attendees')await apiRequest('POST',`/api/events/${event.id}/${kind==='host'?'message-host':'host-messages'}`,{body:body.trim()});
  return kind;
 },onSuccess:kind=>{
  if(preview&&kind==='remove')onRemove();
  if(!preview){
   if(kind==='save'||kind==='remove')for(const key of [[...RSVP_CHECKINS_KEY],[...RSVP_SUMMARIES_KEY],['/api/events',event.id,'attendance'],['profile']])void queryClient.invalidateQueries({queryKey:key});
   if(kind==='attendees')void queryClient.invalidateQueries({queryKey:['/api/events',event.id,'host-messages']});
   if(kind==='host')for(const path of ['/api/messages/inbox','/api/messages/sent','/api/messages/unread'])void queryClient.invalidateQueries({queryKey:[path]});
  }
  toast({title:preview?'Preview RSVP updated':kind==='save'?'RSVP updated':kind==='remove'?'RSVP removed':kind==='host'?'Message sent':'Attendee update posted'});close();
 },onError:err=>{const message=parseApiError(err,'Could not save. Please try again.');setError(message==='NO_CONTACT'?'This event has no host or venue owner to message yet.':message);}});
 const invite=async()=>{try{const path=eventPath(event.id,event.title);const result=await shareEventLink(preview?`https://www.zaylist.com${path}`:path,event.title,`Join me at ${event.title}`);toast({title:shareToastTitle(result,'event')});close();}catch(err){if((err as DOMException).name!=='AbortError')setError('Could not share this event. Please try again.');}};
 const title=action==='rsvp'?'Change RSVP':action==='host'?'Message the host':action==='attendees'?'Post message for attendees':'Event options';
 return <article className={`zaydar-rsvp-row${claimed?' is-claimed':''}`} onKeyDown={e=>{if(e.key==='Escape'&&action){e.stopPropagation();close();}}}>
  <div className="zaydar-rsvp-summary">
   <button type="button" className="zaydar-rsvp-event" onClick={e=>onOpen(event,e.currentTarget)}>
    <img className="zaydar-rsvp-poster" src={resolveEventPosterUrl(event.id,event.posterImageUrl,event.dayOfWeek)} onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=EVENT_PLACEHOLDER_PENDING;}} alt="" loading="lazy"/>
    <span><strong>{event.title}</strong><time dateTime={event.dateStart}>{dateLabel(event.dateStart)}</time><small>{event.venueName}</small>{claimed&&<em>{preview&&host?'Host preview':host?'You’re hosting':'Claimed event'}</em>}</span>
   </button>
   <button type="button" ref={optionsButton} className="zaydar-rsvp-options" aria-label={`Options for ${event.title}`} aria-expanded={action!==null} aria-controls={`rsvp-options-${event.id}`} onClick={()=>action?close():open('options')}><MoreHorizontal size={23}/></button>
  </div>
  {action&&<div className="zaydar-rsvp-panel" id={`rsvp-options-${event.id}`}>
   <div className="zaydar-rsvp-panel-heading"><h3 ref={panelTitle} tabIndex={-1}>{title}</h3><button type="button" onClick={close} aria-label="Close event options"><X size={19}/></button></div>
   {action==='options'?<div className="zaydar-rsvp-actions">
    <button type="button" onClick={()=>open('rsvp')}><Check size={17}/>Change RSVP</button>
    <button type="button" onClick={()=>void invite()}><Share2 size={17}/>Invite</button>
    {claimed&&host&&<button type="button" onClick={()=>open('attendees')}><Megaphone size={17}/>Post message for attendees</button>}
    {event.isPublic&&!event.isPrivate&&!host&&<button type="button" onClick={()=>open('host')}><MessageCircle size={17}/>Message the host</button>}
   </div>:action==='rsvp'?<form onSubmit={e=>{e.preventDefault();mutation.mutate('save');}}>
    <label>RSVP<select value={phrase} onChange={e=>setPhrase(e.target.value)}>{!ATTENDANCE_PHRASES.some(p=>p.label===phrase)&&<option>{phrase}</option>}{ATTENDANCE_PHRASES.filter(p=>p.key!=='I_WAS_HERE').map(p=><option key={p.key} value={p.label}>{p.label}</option>)}</select></label>
    <label>Who can see you<select value={visibility} onChange={e=>setVisibility(e.target.value)}><option value="public">Public</option><option value="friends">Friends only</option><option value="anonymous">Anonymous</option></select></label>
    <div className="zaydar-rsvp-form-actions"><button disabled={mutation.isPending} type="submit"><CalendarDays size={16}/>{mutation.isPending?'Saving…':preview?'Apply to preview':'Save RSVP'}</button><button disabled={mutation.isPending} type="button" onClick={()=>mutation.mutate('remove')}>Remove RSVP</button></div>
   </form>:<form onSubmit={e=>{e.preventDefault();mutation.mutate(action==='host'?'host':'attendees');}}>
    <p>{action==='attendees'?'This update appears on the event and notifies its attendees.':'Send a private message to the event host or venue owner.'}</p>
    <label>Message<textarea autoFocus rows={3} maxLength={1000} value={body} onChange={e=>setBody(e.target.value)} placeholder={action==='attendees'?'An update for your attendees…':'Ask the host…'}/></label>
    {preview&&<p className="zaydar-rsvp-note">Preview only. Messages won’t be sent.</p>}
    <button className="zaydar-rsvp-submit" type="submit" disabled={preview||mutation.isPending||!body.trim()}>{mutation.isPending?'Sending…':action==='attendees'?'Post message':'Send message'}</button>
   </form>}
   {error&&<p role="alert" className="zaydar-rsvp-error">{error}</p>}
  </div>}
 </article>;
}
