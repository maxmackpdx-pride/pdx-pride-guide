import {useState} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {useAuth} from "@/context/AuthContext";
import {useInboxSheet} from "@/context/InboxSheetContext";
import {apiRequest,parseApiError} from "@/lib/queryClient";
import UsernameAutocomplete from "@/components/UsernameAutocomplete";
import type {HostEvent} from "./HostCard";

const stages=["Listed","Interest","Commitment","Night of","After"] as const;
type Stage=typeof stages[number];
type Draft={stage:string;body:string;revision:number};
type Signal={stage:Stage;age:string|null;openGigs:number;lineupPending:number;latestGoing:string|null;repeatGuests:number;notes:Draft[]};

function HostNote({path,stage,initial}:{path:string;stage:Stage;initial?:Draft}){
  const qc=useQueryClient(),[draft,setDraft]=useState(initial?.body||""),[busy,setBusy]=useState(false),[status,setStatus]=useState("");
  const [revision,setRevision]=useState(initial?.revision||0);
  async function save(){
    setBusy(true);setStatus("");
    try{
      const res=await apiRequest("PUT",path+"/note",{stage,body:draft,revision});
      const result=await res.json();
      setRevision(result.revision);setStatus("Saved.");
      await qc.invalidateQueries({queryKey:[path]});
    }catch(e){setStatus(parseApiError(e,"Could not save your note."));await qc.invalidateQueries({queryKey:[path]});}
    finally{setBusy(false);}
  }
  return <form onSubmit={e=>{e.preventDefault();void save();}}>
    <label className="zl-label">Private host note · {stage}<textarea className="zl-textarea" maxLength={800} value={draft} onChange={e=>setDraft(e.target.value)}/></label>
    <div className="zl-row"><button className="zl-btn" disabled={busy||draft===(initial?.body||"")}>Save note</button>
      {revision!==(initial?.revision||0) && <button className="zl-btn" type="button" disabled={busy} onClick={()=>{setDraft(initial?.body||"");setRevision(initial?.revision||0);setStatus("");}}>Load saved version</button>}
      <span role="status">{status}</span></div>
  </form>;
}

export default function HostSignal({event,onEdit,onDoor}:{event:HostEvent;onEdit:()=>void;onDoor:()=>void}){
  const {user}=useAuth(),{openSheet}=useInboxSheet();
  const [open,setOpen]=useState(false),[selected,setSelected]=useState<Stage|null>(null);
  const [transfer,setTransfer]=useState(false),[target,setTarget]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const path=`/api/events/${event.id}/host-signal`;
  const query=useQuery({queryKey:[path,user?.id],enabled:open,queryFn:()=>apiRequest("GET",path).then(r=>r.json() as Promise<Signal>)});
  const signal=query.data, stage=selected||signal?.stage, m=event.metrics;
  async function requestTransfer(){
    setBusy(true);
    try{await apiRequest("POST",`/api/events/${event.id}/transfer`,{target});setMessage("Transfer request sent for review.");setTransfer(false);setTarget("");}
    catch(e){setMessage(parseApiError(e,"Could not request this transfer."));}
    finally{setBusy(false);}
  }
  return <details className="zl-tool" onToggle={e=>setOpen(e.currentTarget.open)}><summary>Event stages</summary>
    {open&&<>
      {query.isPending&&<p role="status">Loading stages…</p>}
      {query.isError&&<button className="zl-btn" onClick={()=>query.refetch()}>Retry stages</button>}
      {signal&&<><div className="zl-stage-picks" role="group" aria-label="Event stages">{stages.map(s=>
        <button className="zl-btn zl-btn--small" type="button" key={s} aria-pressed={stage===s} onClick={()=>setSelected(s)}>{s}</button>)}</div>
        {stage==="Listed" && <><dl className="zl-listing-facts">
          <div><dt>Flyer</dt><dd>{event.posterImageUrl ? "On the listing" : "No event flyer"}</dd></div>
          <div><dt>Place</dt><dd>{event.venueName||"Venue missing"}</dd></div><div><dt>Admission</dt><dd>{event.admission||"Unspecified"}</dd></div>
          <div><dt>Ages</dt><dd>{signal.age||"Unspecified"}</dd></div></dl>
          {event.canEditEvent&&<div className="zl-row"><button className="zl-btn" onClick={onEdit}>Update listing</button>
            <button className="zl-btn" onClick={()=>setTransfer(!transfer)}>Request hosting transfer</button></div>}
          {transfer&&<form className="zl-row" onSubmit={e=>{e.preventDefault();void requestTransfer();}}><UsernameAutocomplete placeholder="New host username" value={target} onChange={setTarget}/><button className="zl-btn" disabled={!target.trim()||busy}>Submit for review</button></form>}
          {message&&<p className="zl-note" role="status">{message}</p>}</>}
        {stage==="Interest"&&<><p><strong>{m.interested} interested</strong> · {m.going} going</p><p className="zl-note">
          Hearts track interest. Going tracks active RSVPs.{signal.latestGoing ? " Latest RSVP "+signal.latestGoing.slice(0,10)+"." : ""}</p>
          <button className="zl-btn" onClick={()=>setSelected("Listed")}>Check listing</button></>}
        {stage==="Commitment"&&<><p><strong>{m.accepted} expected guests</strong> · {signal.openGigs} live gig listings · {signal.lineupPending} pending lineup requests</p>
          <button className="zl-btn" onClick={e=>openSheet({view:"inbox",account:"personal"},e.currentTarget)}>Open personal inbox</button></>}
        {(stage==="Interest" || stage==="Commitment")&&<HostNote key={stage} path={path} stage={stage} initial={signal.notes.find(n=>n.stage===stage)}/>}
        {stage==="Night of"&&<><p><strong>{m.arrived} through the door</strong> · {m.pending} pending · {m.drinksServed} drinks served</p><button className="zl-btn" onClick={onDoor}>Work the door</button></>}
        {stage==="After"&&<><p><strong>{m.arrived} checked in</strong> · {signal.repeatGuests} returning guests</p>
          <p className="zl-note">A returning guest used a pass at an earlier event with a host in common.</p></>}
      </>}
    </>}
  </details>;
}
