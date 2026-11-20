import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, parseApiError } from "@/lib/queryClient";

type Prices = {standard:number;nonprofit:number};
type Access = {state:"requested"|"active"|"revoked";verification:"none"|"pending"|"verified"|"declined";org:string|null;quote:number|null;canCorrect?:boolean};
type Plan = {prices:Prices|null;application:Access|null;items:{id:number;title:string;scheduledAt:string|null;completed:number}[]};
type Application = Access & {eventId:number;eventTitle:string;ein:string|null;reference:string|null;decision?:{kind:string;actor:string;detail:string;at:string}|null};
const ownerPath="/api/hub/planning-owner";
const dollars=(cents:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(cents/100);
function cents(value:string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return NaN;
  return Math.round(Number(value)*100);
}
function usePlanningAction() {
  const qc=useQueryClient(), [busy,setBusy]=useState(false), [note,setNote]=useState("");
  async function run(method:string,path:string,data:object,success:string) {
    setBusy(true);setNote("");
    try {
      await apiRequest(method,path,data);
      await qc.invalidateQueries({predicate:q=>String(q.queryKey[0]).includes("organizer-plan")||q.queryKey[0]===ownerPath});
      setNote(success);
      return true;
    } catch(e){setNote(parseApiError(e,"Could not update event planning."));return false;}
    finally {setBusy(false);}
  }
  return {busy,note,run};
}

export function OrganizerPlanning({eventId}:{eventId:number}) {
  const {user}=useAuth(), [open,setOpen]=useState(false), [nonprofit,setNonprofit]=useState(false);
  const [correcting,setCorrecting]=useState(false);
  const [org,setOrg]=useState(""),[ein,setEin]=useState(""),[title,setTitle]=useState(""),[when,setWhen]=useState("");
  const requestKey=useRef({data:"",key:""});
  const {busy,note,run}=usePlanningAction(),path=`/api/events/${eventId}/organizer-plan`;
  const query=useQuery({queryKey:[path,user?.id],enabled:open,queryFn:()=>apiRequest("GET",path).then(r=>r.json() as Promise<Plan>)});
  const plan=query.data,application=plan?.application;
  async function addTask(){
    const data=JSON.stringify([title,when]);
    if(requestKey.current.data!==data) requestKey.current={data,key:crypto.randomUUID()};
    if(await run("POST",path+"/items",{title,scheduledAt:when||null,requestKey:requestKey.current.key},"Plan updated.")){
      setTitle("");setWhen("");requestKey.current={data:"",key:""};
    }
  }
  return <details className="zl-tool" onToggle={e=>setOpen(e.currentTarget.open)}><summary>Organizer planning</summary>
    {open && <>
      {query.isPending && <p className="zl-note">Loading planning access…</p>}
      {query.isError && <button className="zl-btn" onClick={()=>query.refetch()}>Retry</button>}
      {plan && !application && <form onSubmit={e=>{e.preventDefault();void run("POST",path+"/request",nonprofit?{organization:org,ein}:{},"Request received.");}}>
        <p className="zl-note">A shared run of show and task list for this event’s organizers.</p>
        <p>{plan.prices ? `${dollars(plan.prices.standard)} per event · ${dollars(plan.prices.nonprofit)} for verified 501(c)(3) nonprofits` : "Paid planning · pricing pending"}</p>
        <label className="zl-alert-switch"><input type="checkbox" checked={nonprofit} onChange={e=>setNonprofit(e.target.checked)}/>Request a 501(c)(3) discount</label>
        {nonprofit && <>
          <label className="zl-label">Legal organization name<input className="zl-input" required value={org} maxLength={150} onChange={e=>setOrg(e.target.value)}/></label>
          <label className="zl-label">Employer identification number (EIN)<input className="zl-input" required value={ein} placeholder="12-3456789" maxLength={10} pattern="[0-9]{2}-?[0-9]{7}" onChange={e=>setEin(e.target.value)}/></label>
        </>}
        <button type="submit" className="zl-btn" disabled={busy}>Request planning access</button>
      </form>}
      {application && application.state!=="active" && <p className="zl-note">
        {application.state==="revoked" ? "Planning access withdrawn." : application.verification==="pending" ? "Nonprofit review pending." :
          application.quote===null ? "Request received. Pricing is pending." : `${application.verification==="verified" ? "Verified nonprofit" : "Standard"} rate · ${dollars(application.quote)}. Access begins once the owner confirms payment.`}
      </p>}
      {application?.canCorrect && <><button type="button" className="zl-btn" onClick={()=>setCorrecting(!correcting)}>{correcting ? "Close correction" : "Correct nonprofit details"}</button>
        {correcting && <form onSubmit={async e=>{e.preventDefault();if(await run("POST",path+"/request",{organization:org,ein},"Corrected details submitted.")) setCorrecting(false);}}>
          <label className="zl-label">Legal organization name<input className="zl-input" value={org} onChange={e=>setOrg(e.target.value)} required maxLength={150}/></label>
          <label className="zl-label">Corrected EIN<input className="zl-input" required pattern="[0-9]{2}-?[0-9]{7}" maxLength={10} value={ein} onChange={e=>setEin(e.target.value)}/></label>
          <button className="zl-btn" disabled={busy}>Submit correction</button>
        </form>}</>}
      {application?.state==="active" && <>
        <ol className="zl-plan-items">{(plan?.items||[]).map(item=><li key={item.id}><label>
          <input type="checkbox" checked={!!item.completed} disabled={busy} onChange={e=>void run("PATCH",path+"/items/"+item.id,{completed:e.target.checked},"Plan updated.")}/>
          <span>{item.title}{item.scheduledAt && <small>{item.scheduledAt.replace("T"," · ")} PT</small>}</span>
        </label></li>)}</ol>
        <form onSubmit={e=>{e.preventDefault();void addTask();}}>
          <label className="zl-label">Task<input className="zl-input" required maxLength={180} value={title} onChange={e=>setTitle(e.target.value)}/></label>
          <label className="zl-label">When · Pacific time (optional)<input className="zl-input" type="datetime-local" value={when} onChange={e=>setWhen(e.target.value)}/></label>
          <button className="zl-btn" disabled={busy || !title.trim()}>Add task</button>
        </form>
      </>}
      {note && <p className="zl-note" role="status">{note}</p>}
    </>}
  </details>;
}

function ReviewApplication({item}:{item:Application}) {
  const {busy,note,run}=usePlanningAction();
  const [basis,setBasis]=useState(""),[reference,setReference]=useState(""),[received,setReceived]=useState("");
  const path=ownerPath+"/requests/"+item.eventId;
  const amount=cents(received);
  return <details className="zl-tool"><summary>{item.eventTitle || `Event ${item.eventId}`} · {item.state}</summary>
    {item.org && <><p>{item.org} · EIN {item.ein} · {item.verification}</p>
      {item.decision && <p className="zl-note">Latest review · {item.decision.actor} · {item.decision.at} UTC<br/>{item.decision.detail}</p>}
      {item.state==="requested" && <><label className="zl-label">501(c)(3) review record<input className="zl-input" value={basis}
        maxLength={500} placeholder="Determination letter or registry check" onChange={e=>setBasis(e.target.value)}/></label>
        <div className="zl-row">{(["verify","decline"] as const).map(action=><button type="button" key={action} disabled={busy||!basis.trim()}
          className="zl-btn" onClick={()=>void run("PUT",path,{action,note:basis},"Verification recorded.")}>
          {action==="verify" ? "Verify discount" : "Decline discount"}</button>)}</div></>}
    </>}
    {item.state!=="active" && item.quote!==null && <form onSubmit={e=>{e.preventDefault();void run("PUT",path,{action:"activate",reference,amount},"Planning access activated.");}}>
      <p>Quoted amount · {dollars(item.quote)}</p>
      <label className="zl-label">External payment receipt<input className="zl-input" value={reference} required maxLength={160} onChange={e=>setReference(e.target.value)}/></label>
      <label className="zl-label">Amount received (USD)<input className="zl-input" required inputMode="decimal" value={received} onChange={e=>setReceived(e.target.value)}/></label>
      <button type="submit" className="zl-btn" disabled={busy||amount!==item.quote||!reference.trim()}>Confirm payment &amp; activate</button>
    </form>}
    {item.state==="active" && <><p>Receipt {item.reference} · {dollars(item.quote!)}</p>
      <button className="zl-btn" type="button" disabled={busy} onClick={()=>void run("PUT",path,{action:"revoke"},"Planning access withdrawn.")}>Withdraw planning access</button></>}
    {note && <p className="zl-note" role="status">{note}</p>}
  </details>;
}

export function PlanningOwnerDesk() {
  const {user}=useAuth(),[open,setOpen]=useState(false),[cursor,setCursor]=useState<number|null>(null);
  const [standard,setStandard]=useState(""),[discounted,setDiscounted]=useState("");
  const {busy,note,run}=usePlanningAction();
  const query=useQuery({queryKey:[ownerPath,user?.id,cursor],enabled:open,
    queryFn:()=>apiRequest("GET",ownerPath+(cursor ? `?before=${cursor}` : "")).then(r=>r.json() as Promise<{prices:Prices|null;applications:Application[];next:number|null}>)});
  const data=query.data;
  return <details className="zl-tool" onToggle={e=>setOpen(e.currentTarget.open)}><summary>Paid planning &amp; nonprofit review</summary>
    {open && <>
      {query.isPending && <p className="zl-note">Loading requests…</p>}
      {query.isError && <button className="zl-btn" onClick={()=>query.refetch()}>Retry</button>}
      {data && <><p>{data.prices ? `Standard ${dollars(data.prices.standard)} · nonprofit ${dollars(data.prices.nonprofit)}` : "No planning prices set."}</p>
        <form onSubmit={e=>{e.preventDefault();void run("PUT",ownerPath+"/prices",{standard:cents(standard),nonprofit:cents(discounted)},"Prices saved.");}}>
          <label className="zl-label">Standard event price (USD)<input className="zl-input" inputMode="decimal" required value={standard} onChange={e=>setStandard(e.target.value)}/></label>
          <label className="zl-label">501(c)(3) event price (USD)<input className="zl-input" inputMode="decimal" required value={discounted} onChange={e=>setDiscounted(e.target.value)}/></label>
          <button className="zl-btn" type="submit" disabled={busy || !(cents(discounted)>0 && cents(standard)>cents(discounted))}>Save prices</button>
        </form>
        {note && <p className="zl-note" role="status">{note}</p>}
        {data.applications.length===0 && <p className="zl-note">No planning requests.</p>}
        {data.applications.map(item=><ReviewApplication key={item.eventId} item={item}/>)}
        {data.next && <button className="zl-btn" type="button" onClick={()=>setCursor(data.next)}>Earlier events</button>}
        {cursor && <button className="zl-btn" type="button" onClick={()=>setCursor(null)}>Latest events</button>}
      </>}
    </>}
  </details>;
}
