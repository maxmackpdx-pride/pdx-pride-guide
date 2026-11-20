import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";

type MemberStats={interested:number;going:{id:number;title:string}[];privateEventSaves:number;followers:number;gigReplies:number;admitted:number};
export default function MemberStatsView(){
  const {user}=useAuth();
  const key="/api/hub/member-stats";
  const query=useQuery({queryKey:[key,user?.id],enabled:!!user,queryFn:()=>apiRequest("GET",key).then(r=>r.json() as Promise<MemberStats>)});
  if(query.isPending) return <p role="status">Loading your activity…</p>;
  if(query.isError) return <p role="alert">Your activity is unavailable. <button onClick={()=>query.refetch()}>Retry</button></p>;
  const m=query.data;
  return <section className="inbox-exp-personal-stats" aria-label="Personal statistics"><h3>Your activity</h3>
    <dl><dt>Interested · {m.interested}</dt><dd>Events you follow with the heart.</dd>
      <dt>Going · {m.going.length}</dt><dd>{m.going.length ? m.going.map((e,i)=><span key={e.id}>{i>0 && " · "}<a href={`/events/${e.id}`}>{e.title}</a></span>) : "You have no active event RSVPs."}</dd>
      <dt>Private event saves · {m.privateEventSaves}</dt><dd>Bookmarks in your schedule. Only you see this count.</dd>
      <dt>Gig replies waiting · {m.gigReplies}</dt><dd>Gig conversations with unread replies for you.</dd>
      <dt>Followers · {m.followers}</dt><dd>Active accounts following your profile.</dd>
      <dt>Door entries · {m.admitted}</dt><dd>Your passes admitted at the door.</dd></dl>
  </section>;
}
