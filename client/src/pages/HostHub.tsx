import RosterChat, { RosterInvitations } from "@/components/zaylist/RosterChat";
import { lazy, Suspense, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { useInboxSheet } from "@/context/InboxSheetContext";
import { apiRequest } from "@/lib/queryClient";
import PushComposer, { PushMemberships } from "@/components/zaylist/PushComposer";
import { PlanningOwnerDesk } from "@/components/zaylist/OrganizerPlanning";
import GuestSpots from "@/components/zaylist/GuestSpots";
import HostCard, { type HostEvent } from "@/components/zaylist/HostCard";
import { Connections } from "@/components/zaylist/HostOperations";
import "@/components/zaylist/zaylist.css";

const VenueSection = lazy(() => import("@/components/dashboard/DashboardVenueSection"));
type Workspace = {events:HostEvent[];venues:{id:number;name:string;logoImageUrl:string|null}[];personal:{interested:number;going:number;admitted:number}};

export default function HostHub() {
  const {user,loading}=useAuth();
  const {openSheet}=useInboxSheet();
  const [auth,setAuth]=useState(false),[venuesOpen,setVenuesOpen]=useState(false);
  useEffect(()=>{
    const token=new URLSearchParams(location.hash.slice(1)).get("invite");
    if(token && /^[A-Za-z0-9_-]{43}$/.test(token)) sessionStorage.setItem("guest-list-invitation",token);
  },[]);
  const workspace=useQuery({queryKey:["/api/hub/workspace",user?.id],enabled:!!user,
    queryFn:()=>apiRequest("GET","/api/hub/workspace").then(r=>r.json() as Promise<Workspace>)});
  const data=workspace.data, events=data?.events||[];
  const admin=!!(user?.isAdmin||user?.isSuperAdmin);
  const owner=!!user?.isPrimaryOwner;
  if(loading) return <main className="zl-root"><p role="status">Loading your hub…</p></main>;
  if(!user) return <main className="zl-root"><div className="zl-wrap"><header className="zl-hub-head"><h1>Your Zay’list</h1>
    <p>Guest spots, passes and the nights you host.</p>
    <button className="zl-btn zl-btn--primary" onClick={()=>setAuth(true)}>Sign in or join</button>
    <a className="zl-btn" href="/hub/help">How to use your Zay’list</a>
    {auth&&<AuthModal onClose={()=>setAuth(false)}/>}</header></div></main>;
  return <main className="zl-root"><div className="zl-wrap zl-workspace">
    <header className="zl-hub-head"><div><p>{user.displayName||user.username}</p><h1>Your Zay’list</h1></div>
      <button type="button" className="zl-btn" onClick={e=>openSheet({account:"personal",view:"inbox"},e.currentTarget)}>Inbox</button></header>
    <PushComposer events={events.filter(e=>e.canEditEvent||e.canManageTeam)}/>
    {workspace.isError&&<p role="alert">Your workspace could not load. <button className="zl-btn" onClick={()=>workspace.refetch()}>Try again</button></p>}
    <section className="zl-section zl-personal" aria-labelledby="zl-pass-title"><h2 id="zl-pass-title">Guest spots &amp; passes</h2>
      <GuestSpots key={user.id}/></section>
    {events.length>0&&<section className="zl-section zl-work-rail"><h2>Working the night</h2>
      <div className="zl-rail">{events.map(e=><HostCard key={e.id} event={e} otherEvents={events}/>)}</div>
    </section>}
    {!!data?.venues.length&&<section className="zl-section"><h2>Your venues</h2>
      <Suspense fallback={<p>Loading venues…</p>}><VenueSection open={venuesOpen} onToggle={()=>setVenuesOpen(!venuesOpen)}/></Suspense>
      {data.venues.map(v=><details className="zl-tool" key={v.id}><summary>{v.name}</summary><a href={`/directory?place=${v.id}`} className="zl-btn">View venue</a><Connections kind="places" id={v.id}/><RosterChat kind="places" id={v.id}/></details>)}
    </section>}
    <RosterInvitations/>
    {data&&<section className="zl-section"><h2>Your activity</h2><dl className="zl-stat-strip">
      <div><dt>Interested</dt><dd>{data.personal.interested}</dd></div><div><dt>Going</dt><dd>{data.personal.going}</dd></div>
      <div><dt>Door entries</dt><dd>{data.personal.admitted}</dd></div></dl>
      <div className="zl-row"><button className="zl-btn" onClick={e=>openSheet({account:"personal",view:"stats"},e.currentTarget)}>My stats</button><button className="zl-btn" onClick={e=>openSheet({account:"personal",view:"chats"},e.currentTarget)}>Chats</button><a className="zl-btn" href="/schedule">My schedule</a><a className="zl-btn" href="/settings/notifications">Notifications</a></div></section>}
    {admin&&<section className="zl-section"><h2>Administration</h2><div className="zl-row">
      <a className="zl-btn" href="/admin">Open admin</a><button className="zl-btn" onClick={e=>openSheet({account:"admin",queueFolder:"active"},e.currentTarget)}>Review approvals</button>
    </div></section>}
    {owner&&<section className="zl-section"><h2>Owner desk</h2><button className="zl-btn" onClick={e=>openSheet({account:"owner",view:"inbox"},e.currentTarget)}>Open owner inbox</button><PushMemberships/><PlanningOwnerDesk/></section>}
    <a className="zl-btn" href="/hub/help">How to use your Zay’list</a>
  </div></main>;
}
