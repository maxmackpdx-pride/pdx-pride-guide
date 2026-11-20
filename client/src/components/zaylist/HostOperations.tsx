import { lazy, Suspense, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, parseApiError } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import UsernameAutocomplete from "@/components/UsernameAutocomplete";
import { pacificCalendarDate } from "@shared/missedConnections";
import type { HostEvent } from "./HostCard";
const Talent = lazy(() => import("@/components/EventTalentPanel"));
const GigComposer = lazy(() => import("@/pages/PrideWork").then(m => ({default:m.GigComposer})));
type Person = {userId:number;username:string;displayName?:string;photoUrl?:string;role:string};

export function Connections({kind,id}:{kind:"events"|"places";id:number}) {
  const [open,setOpen]=useState(false);
  const [error,setError]=useState("");
  const {user}=useAuth(); const qc=useQueryClient();
  const path=`/api/hub/workspace/${kind}/${id}/connections`,key=[path,user?.id];
  const query=useQuery({queryKey:key,enabled:open,queryFn:()=>apiRequest("GET",path).then(r=>r.json() as Promise<{alerts:boolean;items:{id:number;title:string;body:string}[]}> )});
  async function action(method:string,suffix:string,body?:object){
    setError("");
    try { await apiRequest(method,path+suffix,body);await qc.invalidateQueries({queryKey:key}); }
    catch(e){setError(parseApiError(e,"Could not update this card"));}
  }
  return <details className="zl-tool" onToggle={e=>setOpen(e.currentTarget.open)}><summary>Missed connections</summary>
    {query.isPending && <p className="zl-note">Loading…</p>}
    {query.isError && <button className="zl-btn" onClick={()=>query.refetch()}>Retry</button>}
    {query.data && <>
      <label className="zl-alert-switch"><input type="checkbox" checked={query.data.alerts} onChange={e=>void action("PUT","/alerts",{enabled:e.target.checked})}/>Notify me about new posts</label>
      {!query.data.items.length && <p className="zl-note">No active posts on this card.</p>}
      {query.data.items.map(post=><div key={post.id} className="zl-person"><div className="zl-person-main"><b>{post.title}</b><p>{post.body}</p></div>
        <button className="zl-btn" onClick={()=>void action("DELETE",`/${post.id}`)}>Remove post</button></div>)}
    </>}
    {error&&<p className="zl-error" role="alert">{error}</p>}
  </details>;
}

export function EventTeam({event,otherEvents}:{event:HostEvent;otherEvents:HostEvent[]}) {
  const {user}=useAuth();const qc=useQueryClient();
  const [open,setOpen]=useState(false),[person,setPerson]=useState<Person|null>(null);
  const [username,setUsername]=useState(""),[message,setMessage]=useState(""),[note,setNote]=useState(""),[target,setTarget]=useState("");
  const [busy,setBusy]=useState(false);
  const hostsPath=`/api/events/${event.id}/hosts`,talentPath=`/api/events/${event.id}/talent`;
  const hosts=useQuery({queryKey:[hostsPath],enabled:open,queryFn:()=>apiRequest("GET",hostsPath).then(r=>r.json() as Promise<Person[]>)});
  const talent=useQuery({queryKey:[talentPath,user?.id],enabled:open,queryFn:()=>apiRequest("GET",talentPath).then(r=>r.json() as Promise<(Person&{status:string})[]>)});
  const people=(hosts.data||[]).concat((talent.data||[]).filter(p=>p.status==="LIVE" && !(hosts.data||[]).some(h=>h.userId===p.userId)));
  async function action(method:string,url:string,body:object,msg:string) {
    setNote("");setBusy(true);
    try {await apiRequest(method,url,body);setNote(msg);setMessage("");setUsername("");setPerson(null);await Promise.all([qc.invalidateQueries({queryKey:[hostsPath]}),qc.invalidateQueries({queryKey:["/api/hub/workspace"]})]);}
    catch(e){setNote(parseApiError(e,"Could not complete this action"));}
    finally{setBusy(false);}
  }
  return <details className="zl-tool" onToggle={e=>setOpen(e.currentTarget.open)}><summary>Team &amp; lineup</summary>
    {open&&<>
      {hosts.isError||talent.isError ? <p className="zl-error">Team unavailable.</p> : <div className="zl-faces">{people.map(p=><button key={p.userId} title={p.displayName||p.username}
        aria-label={p.displayName||p.username} aria-pressed={p.userId===person?.userId} onClick={()=>{setPerson(p);setNote("");}}>
        {p.photoUrl ? <img src={p.photoUrl} alt=""/> : (p.displayName||p.username).slice(0,1).toUpperCase()}</button>)}</div>}
      {person && <div className="zl-person-main"><b>{person.displayName||person.username}</b> · {person.role}
        <div className="zl-row"><a className="zl-btn" href={`/u/${encodeURIComponent(person.username)}`}>View profile</a>
        {event.canManageTeam && person.role==="COHOST" && <button className="zl-btn" disabled={busy} onClick={()=>void action("DELETE",`/api/hub/workspace/events/${event.id}/hosts/${person.userId}`,{},"Co-host removed.")}>Remove co-host</button>}</div>
        {person.userId!==user?.id && <form className="zl-row" onSubmit={e=>{e.preventDefault();void action("POST",`/api/users/${encodeURIComponent(person.username)}/message`,{body:message.trim(),subject:event.title},"Message sent.");}}>
          <input className="zl-input" aria-label="Message to team member" value={message} onChange={e=>setMessage(e.target.value)} maxLength={1500} required/><button className="zl-btn" disabled={busy||!message.trim()}>Message</button></form>}
        {otherEvents.some(e=>e.id!==event.id && e.canEditEvent) && <div className="zl-row">
          <select className="zl-select" aria-label="Add this person to another event" value={target} onChange={e=>setTarget(e.target.value)}><option value="">Choose another event</option>
            {otherEvents.filter(e=>e.id!==event.id && e.canEditEvent).map(e=><option value={e.id} key={e.id}>{e.title}</option>)}</select>
          <button className="zl-btn" disabled={!target||busy} onClick={()=>void action("POST",`/api/events/${target}/hosts`,{username:person.username},"Co-host added.")}>Add as co-host</button></div>}
      </div>}
      {event.canEditEvent&&<>
        <form className="zl-row" onSubmit={e=>{e.preventDefault();void action("POST",hostsPath,{username},"Co-host added.");}}>
          <UsernameAutocomplete value={username} onChange={setUsername} placeholder="Find a co-host"/><button className="zl-btn" disabled={busy||!username.trim()}>Add co-host</button></form>
        <div className="zl-lineup"><Suspense fallback={<p>Loading lineup…</p>}><Talent eventId={event.id} eventTitle={event.title} mode="manage" hideSelfTag/></Suspense></div>
      </>}
      {note&&<p className="zl-note" role="status">{note}</p>}
    </>}
  </details>;
}

export function EventGig({event}:{event:HostEvent}){
  const [open,setOpen]=useState(false),[link,setLink]=useState(0);
  const day=pacificCalendarDate(event.dateStart);
  if(!day) return null;
  return <><button className="zl-btn" type="button" onClick={()=>setOpen(true)}>Add gig to event</button>
    {link>0&&<a className="zl-btn" href={`/gigz?gig=${link}`}>View posted gig</a>}
    {open&&<Suspense fallback={<p>Loading composer…</p>}><GigComposer eventLink={{eventId:event.id,occurrenceDate:day}} venueName={event.venueName||undefined}
      onClose={()=>setOpen(false)} onPosted={id=>{setLink(id);setOpen(false);}}/></Suspense>}</>;
}
