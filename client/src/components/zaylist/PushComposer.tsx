import { useId, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, parseApiError } from "@/lib/queryClient";
import { pushCopyIssue, type PushAudience, type PushTier } from "@shared/hostPushPolicy";

interface Audience { key: PushAudience; remaining: number | null; limit: number | null; windowDays: number; reachable: number }
type Preview = {allowed:false} | {allowed:true;configured:boolean;tier:PushTier;audiences:Audience[]};
type Receipt = {id:number;devices:number;sent:number;queued:number;failed:number;skipped:number};
type EventOption = {id:number;title:string};

export default function PushComposer({events = [], selectedEvent}: {events?:EventOption[];selectedEvent?:EventOption}) {
  const {user} = useAuth();
  const qc = useQueryClient();
  const prefix = useId();
  const [target,setTarget] = useState<number | null>(null);
  const eventId = selectedEvent?.id || target || events[0]?.id || null;
  const [audience,setAudience] = useState<PushAudience>(selectedEvent ? "rsvps" : "followers");
  const [title,setTitle] = useState("");
  const [body,setBody] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [receiptId,setReceiptId] = useState<number | null>(null);
  const request = useRef({payload:"",key:""});
  const [open,setOpen] = useState(false);
  const query = useQuery({
    queryKey:["/api/hub/push",user?.id,eventId],enabled:!!user,
    queryFn:() => apiRequest("GET","/api/hub/push" + (eventId ? `?eventId=${eventId}` : "")).then(r => r.json() as Promise<Preview>),
  });
  const receipt = useQuery({
    queryKey:["/api/hub/push/receipt",user?.id,receiptId],enabled:!!receiptId,
    queryFn:() => apiRequest("GET",`/api/hub/push/${receiptId}/receipt`).then(r => r.json() as Promise<Receipt>),
    refetchInterval:q => q.state.data?.queued ? 2000 : false,
  });
  const preview = query.data;
  if (!preview?.allowed) return null;
  const selected = preview.audiences.find(a => a.key === audience);
  const options = preview.audiences.filter(a => a.key !== "rsvps" || eventId);
  const copyIssue = pushCopyIssue(title,body);
  const canSend = !!selected && selected.remaining !== 0 && selected.reachable > 0 && title.trim() && body.trim() && !copyIssue && !busy && preview.configured;
  async function send() {
    if (!canSend) return;
    const message = {audience,eventId:audience==="rsvps" || selectedEvent ? eventId : null,title:title.trim(),body:body.trim()};
    const payload=JSON.stringify(message);
    if (request.current.payload!==payload) request.current={payload,key:crypto.randomUUID()};
    setBusy(true);setError("");
    try {
      const response = await apiRequest("POST","/api/hub/push",{...message,requestKey:request.current.key});
      const result = await response.json() as Receipt;
      qc.setQueryData(["/api/hub/push/receipt",user?.id,result.id],result);
      setReceiptId(result.id); setTitle(""); setBody(""); request.current={payload:"",key:""};
      await qc.invalidateQueries({queryKey:["/api/hub/push"]});
    } catch (e) { setError(parseApiError(e,"Could not send this push")); }
    finally { setBusy(false); }
  }
  return <section className="zl-section zl-push" aria-label="Push notification">
    <button type="button" className="zl-disclosure" aria-expanded={open} onClick={() => setOpen(!open)}>
      <span>Push notification</span><span aria-hidden="true">{open ? "−" : "+"}</span>
    </button>
    {open && <form onSubmit={e => {e.preventDefault();void send();}}>
      <div className="zl-push-aud" role="group" aria-label="Audience">{options.map(a =>
        <button className="zl-btn zl-btn--small" key={a.key} type="button" aria-pressed={a.key===audience} onClick={() => {setAudience(a.key);setError("");}}>
          {a.key==="rsvps" ? "RSVPs" : a.key==="followers" ? "Followers" : "Everyone"}
        </button>)}</div>
      {audience==="rsvps" && !selectedEvent && !!events.length && <label className="zl-label">Event
        <select className="zl-select" value={eventId || ""} onChange={e => setTarget(Number(e.target.value))}>
          {events.map(event => <option value={event.id} key={event.id}>{event.title}</option>)}
        </select></label>}
      {selected && <p className="zl-note" role="status">{selected.reachable} subscribed {selected.reachable===1 ? "person" : "people"} · {selected.remaining===null ? "Unlimited sends" :
        `${selected.remaining} of ${selected.limit} sends left per ${selected.windowDays===1 ? "day" : selected.windowDays+" days"}`}</p>}
      <label className="zl-label" htmlFor={prefix+"title"}>Title</label>
      <input id={prefix+"title"} className="zl-input" maxLength={40} value={title} onChange={e=>setTitle(e.target.value)} required />
      <span className="zl-charcount">{title.length}/40</span>
      <label className="zl-label" htmlFor={prefix+"body"}>Message</label>
      <textarea id={prefix+"body"} className="zl-textarea" maxLength={110} required value={body} onChange={e=>setBody(e.target.value)}/>
      <span className="zl-charcount">{body.length}/110</span>
      {(title.trim() || body.trim()) && <div className="zl-lock-preview" aria-label="Lock screen preview">
        <span>Lock screen preview · Zaylist</span><strong>{title}</strong><p>{body}</p>
      </div>}
      {copyIssue && <p className="zl-error" role="status">{copyIssue}</p>}
      {!preview.configured && <p className="zl-note">Device push is unavailable.</p>}
      {error && <p className="zl-error" role="alert">{error}</p>}
      <button type="submit" className="zl-btn zl-btn--primary" disabled={!canSend}>{busy ? "Sending…" : "Send push"}</button>
    </form>}
    {receipt.data && <p className="zl-note" role="status">Delivered to {receipt.data.sent} of {receipt.data.devices} devices{receipt.data.queued ? ` · ${receipt.data.queued} queued` : ""}{receipt.data.failed ? ` · ${receipt.data.failed} failed` : ""}{receipt.data.skipped ? ` · ${receipt.data.skipped} no longer eligible` : ""}.</p>}
  </section>;
}

export function PushMemberships() {
  const [username,setUsername] = useState("");
  const [tier,setTier] = useState("standard");
  const [note,setNote] = useState("");
  const [busy,setBusy] = useState(false);
  return <details className="zl-access"><summary>Sender access</summary>
    <form onSubmit={async e => {
      e.preventDefault();setBusy(true);setNote("");
      try {
        const res=await apiRequest("PUT","/api/hub/push/access",{username,tier});
        const saved=await res.json() as {username:string;tier:PushTier|null};
        setNote(`@${saved.username} · ${saved.tier || "no"} sender access`);setUsername("");
      } catch(e){setNote(parseApiError(e,"Could not update access"));}
      finally{setBusy(false);}
    }}>
      <label className="zl-label">Account username<input className="zl-input" value={username} onChange={e=>setUsername(e.target.value)} required/></label>
      <label className="zl-label">Sender access<select className="zl-select" value={tier} onChange={e=>setTier(e.target.value)}>
        <option value="standard">Standard</option><option value="paid">Paid member</option><option value="off">Remove membership grant</option>
      </select></label>
      <button className="zl-btn" type="submit" disabled={busy || !username.trim()}>Save access</button>
      {note && <p className="zl-note" role="status">{note}</p>}
    </form></details>;
}
