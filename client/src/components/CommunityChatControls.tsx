import {useInboxSheet} from '@/context/InboxSheetContext';
import {useMutation} from '@tanstack/react-query';
import {apiRequest,queryClient} from '@/lib/queryClient';
import type {CommunitySummary} from '@shared/community';
export default function CommunityChatControls({community,onOpenInbox}:{community:CommunitySummary;onOpenInbox?:()=>void}) {
 const {openSheet}=useInboxSheet();
 const c=community;const url=`/api/communities/${encodeURIComponent(c.slug)}/chat`;const chat=c.chat;
 const action=useMutation({mutationFn:({path,method='POST',data={}}:{path:string;method?:string;data?:unknown})=>apiRequest(method,url+path,data),onSuccess:()=>{void queryClient.invalidateQueries({queryKey:['/api/communities']});void queryClient.invalidateQueries({queryKey:[`/api/communities/${encodeURIComponent(c.slug)}`]});void queryClient.invalidateQueries({queryKey:['/api/chats/mine']});}});
 return <div>{c.viewerRole==='owner'&&<label>Page chat <select aria-label="Page chat mode" value={chat?.mode||'off'} disabled={action.isPending} onChange={e=>action.mutate({method:'PUT',path:'/settings',data:{mode:e.target.value}})}><option value="off">Off</option><option value="news">News feed</option><option value="chat">Public group chat</option></select></label>}
 {chat&&chat.mode!=='off'&&(chat.joined?<><button onClick={onOpenInbox||(()=>openSheet({view:"inbox",account:"personal"}))}>Open in inbox{chat.unreadCount?` (${chat.unreadCount})`:''}</button><span>Joined · available in your inbox</span></>:<button disabled={!chat.canJoin||action.isPending} title={!chat.canJoin?'Follow this page to join its chat':undefined} onClick={()=>action.mutate({path:'/join'})}>Join {chat.mode==='news'?'news feed':'group chat'}</button>)}
 {action.isError&&<p role="alert">Could not update chat. Please refresh and try again.</p>}</div>;
}
