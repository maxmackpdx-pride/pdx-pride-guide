import {useQuery} from '@tanstack/react-query';
import type {Event} from '@shared/schema';
import {getEventScheduleTiming,parsePacificDateTime} from '@shared/missedConnections';
import {useAuth} from '@/context/AuthContext';
import {apiRequest} from '@/lib/queryClient';
import {useToast} from '@/hooks/use-toast';
import {RsvpRow} from './ZaydarUpcomingRsvps';

type Props={events:Event[];loading:boolean;onOpen:(event:Event,target:HTMLElement)=>void;onSignIn:()=>void};
export default function ZaydarRecentEvents({events,loading,onOpen,onSignIn}:Props){
 const {user}=useAuth(),{toast}=useToast();
 const preview=Boolean((window as unknown as {__PDX_LOCAL_PREVIEW__?:number}).__PDX_LOCAL_PREVIEW__);
 // Use the same attendance history as the member profile, including archived hosted nights.
 const profile=useQuery<{activity?:{attendedPast?:Event[]}}>({queryKey:['profile',user?.username],queryFn:()=>apiRequest('GET',`/api/users/${encodeURIComponent(user!.username)}`).then(r=>r.json()),enabled:!!user&&!preview});
 const source=preview?events:profile.data?.activity?.attendedPast||[];
 const rows=source.filter(event=>getEventScheduleTiming(event.dateStart,event.dateEnd)==='past').sort((a,b)=>(parsePacificDateTime(b.dateEnd)||0)-(parsePacificDateTime(a.dateEnd)||0)).filter((event,index,array)=>array.findIndex(other=>other.id===event.id)===index).slice(0,preview?3:10);
 const openEvent=async(event:Event,target:HTMLElement)=>{
  const fullEvent=events.find(item=>item.id===event.id);
  if(fullEvent){onOpen(fullEvent,target);return;}
  try{const response=await apiRequest('GET',`/api/events/${event.id}`);onOpen(await response.json(),target);}catch{toast({title:'This event card is no longer available',description:'You can still use its drawer options.'});}
 };
 return <section className="zaydar-upcoming" aria-labelledby="zaydar-recent-title">
  <h2 id="zaydar-recent-title">Recently attended</h2>
  {preview&&<p className="zaydar-rsvp-note">Sample attendance · venue and host previews.</p>}
  {!preview&&!user?<p className="zaydar-rsvp-note"><button type="button" onClick={onSignIn}>Sign in</button> to see events you attended.</p>:<>
   {(preview?loading:profile.isLoading)&&<p role="status" className="zaydar-rsvp-note">Loading recent events…</p>}
   {!preview&&profile.isError&&<p role="alert" className="zaydar-rsvp-note">Couldn’t load your recent events. <button type="button" onClick={()=>void profile.refetch()}>Retry</button></p>}
   {!(preview?loading:profile.isLoading)&&!profile.isError&&!rows.length&&<p className="zaydar-rsvp-note">Events you attended will appear here.</p>}
   <div className="zaydar-rsvp-list">{rows.map((event,index)=><RsvpRow key={event.id} event={event} preview={preview} recent host={false} claimed={Boolean(event.claimedBy)||(preview&&index<2)} previewContact={preview?(index===0?'venue':index===1?'host':'none'):undefined} onOpen={(event,target)=>void openEvent(event,target)} onRemove={()=>{}}/>)}</div>
  </>}
 </section>;
}
