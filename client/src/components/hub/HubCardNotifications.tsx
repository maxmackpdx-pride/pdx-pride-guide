import {useQuery} from '@tanstack/react-query';
import {Link} from 'wouter';
import {useAuth} from '@/context/AuthContext';
import {useInboxSheet} from '@/context/InboxSheetContext';
import {apiRequest} from '@/lib/queryClient';
type Update={id:string;title:string;href:string;unreadCount:number;muted?:boolean};
export default function HubCardNotifications({enabled,onNavigate}:{enabled:boolean;onNavigate?:()=>void}){
 const {user}=useAuth();const {openSheet}=useInboxSheet();
 const q=useQuery<{outzide:Update[];scenez:Update[];placez?:Update[];scenezBoards?:Update[]}>({queryKey:['/api/card-notifications',user?.id],enabled:enabled&&!!user,queryFn:()=>apiRequest('GET','/api/card-notifications').then(r=>r.json()),refetchInterval:30000});
 if(!user||q.isError)return null;
 const outz=q.data?.outzide.filter(r=>r.unreadCount>0)||[],scenes=q.data?.scenez.filter(r=>r.unreadCount>0)||[];
 const boards=[...(q.data?.placez||[]),...(q.data?.scenezBoards||[])].filter(r=>r.unreadCount>0);
 if(!outz.length&&!scenes.length&&!boards.length)return null;
 return <section aria-label="New card activity" className="hub-reader__card-notifications"><div className="hub-reader__section">Your card updates</div>{[...outz,...boards].map(r=><Link key={r.href} href={r.href} onClick={onNavigate} className="hub-reader__card-update"><span>{r.title}</span><span>{r.unreadCount} new Boardz posts</span></Link>)}{scenes.map(r=><button key={r.id} className="hub-reader__card-update" onClick={()=>{onNavigate?.();openSheet({view:'inbox',account:'personal'});}}><span>{r.title}</span><span>{r.unreadCount} unread{r.muted?' · muted':''}</span></button>)}</section>;
}
