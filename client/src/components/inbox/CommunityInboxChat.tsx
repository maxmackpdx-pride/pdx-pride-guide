import {useEffect,useState} from 'react';
import {useQuery,useMutation} from '@tanstack/react-query';
import {useAuth} from '@/context/AuthContext';
import {apiRequest,queryClient} from '@/lib/queryClient';
export default function CommunityInboxChat({slug,onBack}:{slug:string;onBack:()=>void}) {
 const {user}=useAuth(); const [body,setBody]=useState(''); const key=['community-chat',slug,user?.id];
 const url=`/api/communities/${encodeURIComponent(slug)}/chat`;
 const q=useQuery<any>({queryKey:key,enabled:!!user,queryFn:()=>apiRequest('GET',url).then(r=>r.json()),refetchInterval:8000,retry:false});
 const mutation=useMutation({mutationFn:({method,path,data}:{method:string;path:string;data?:unknown})=>apiRequest(method,url+path,data),onSuccess:()=>{setBody('');void queryClient.invalidateQueries({queryKey:key});void queryClient.invalidateQueries({queryKey:['/api/chats/mine']});}});
 useEffect(()=>setBody(''),[slug,user?.id]);
 const last=q.data?.messages?.at(-1)?.id;
 useEffect(()=>{if(user&&last&&!q.isError)void apiRequest('PUT',url+'/read',{lastReadId:last}).then(()=>queryClient.invalidateQueries({queryKey:['/api/chats/mine']})).catch(()=>{});},[last,slug,user?.id,q.isError]);
 if(!user)return <p>Sign in to view this chat.</p>;
 return <section className="inbox-group-chat"><button onClick={onBack}>Back to inbox</button>{q.isError?<p role="alert">This chat is no longer available. Follow the page and join its chat to continue.</p>:q.isLoading?<p>Loading…</p>:<>
 <header><strong>{q.data.mode==='news'?'News feed':'SceneZ chat'}</strong><button disabled={mutation.isPending} onClick={()=>mutation.mutate({method:'PATCH',path:'/membership',data:{muted:!q.data.muted}})}>{q.data.muted?'Turn notifications on':'Mute notifications'}</button><button disabled={mutation.isPending} onClick={()=>mutation.mutateAsync({method:'DELETE',path:'/membership'}).then(onBack).catch(()=>{})}>Leave chat</button></header>
 <div className="inbox-group-chat__messages">{q.data.messages.map((m:any)=><article key={m.id} className="inbox-group-chat__bubble"><strong>{m.displayName||m.username}</strong><p>{m.body}</p></article>)}</div>
 {q.data.canPost?<form onSubmit={e=>{e.preventDefault();if(body.trim()&&!mutation.isPending)mutation.mutate({method:'POST',path:'',data:{body}});}}><input aria-label="Message" maxLength={500} value={body} onChange={e=>setBody(e.target.value)}/><button disabled={!body.trim()||mutation.isPending}>Send</button></form>:<p>Updates from the page managers.</p>}
 </>}{mutation.isError&&<p role="alert">Could not complete that action. Please try again.</p>}</section>;
}
