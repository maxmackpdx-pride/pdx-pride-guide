import {useState} from 'react';
import {useQueries,useQuery,useMutation} from '@tanstack/react-query';
import {useLocation} from 'wouter';
import {useAuth} from '@/context/AuthContext';
import {apiRequest,queryClient} from '@/lib/queryClient';
import {toBoardPosts,type BoardPayload,type BoardPost} from '@/lib/allBoards';
import BoardBrowseCard from '@/components/board/BoardBrowseCard';
import LockedCardSlot from '@/components/places/LockedCardSlot';
import type {CommunitySummary} from '@shared/community';
type Feed={gigz:BoardPayload;mizzed:BoardPayload};
export default function SceneBoards({scenes,initialCategory='gigz'}:{scenes:CommunitySummary[];initialCategory?:'gigz'|'mizzed'}){
 const {user}=useAuth();const [,navigate]=useLocation();const saved=useQuery<string[]>({queryKey:['/api/boards/saved',user?.id],queryFn:()=>apiRequest('GET','/api/boards/saved').then(r=>r.json()),enabled:!!user});const save=useMutation({mutationFn:(p:BoardPost)=>apiRequest(saved.data?.includes(p.key)?'DELETE':'PUT',`/api/boards/${p.category}/posts/${p.id}/save`),onSuccess:()=>{void queryClient.invalidateQueries({queryKey:['/api/boards/saved']});}});
 const [tab,setTab]=useState<'gigz'|'mizzed'>(initialCategory);const results=useQueries({queries:scenes.map(c=>({queryKey:[`/api/communities/${encodeURIComponent(c.slug)}/boardz`,user?.id],queryFn:()=>apiRequest('GET',`/api/communities/${encodeURIComponent(c.slug)}/boardz`).then(r=>r.json()),staleTime:60000}))});
 const rows=results.flatMap(q=>{const data=(q.data as Feed|undefined)?.[tab];return data?toBoardPosts(tab,data):[];});const unique=[...new Map(rows.map(p=>[p.id,p])).values()];
 return <section className="ns-board"><div className="ns-heading"><h2>Boardz Posts</h2></div><div className="ns-board-tabs"><button aria-pressed={tab==='gigz'} onClick={()=>setTab('gigz')}>Gigz</button><button aria-pressed={tab==='mizzed'} onClick={()=>setTab('mizzed')}>Mizzed Connections</button></div><p className="ns-board-note">Posts connected to these scenes and their events.</p>{results.some(q=>q.isLoading)&&<p role="status">Loading Boardz posts…</p>}{results.some(q=>q.isError)&&<p role="alert">Some scene posts could not load. <button onClick={()=>results.forEach(q=>void q.refetch())}>Retry</button></p>}{save.isError&&<p role="alert">Could not save this post. Try again.</p>}<div className="ns-board-grid">{unique.map(p=><LockedCardSlot key={p.key} size="wide"><BoardBrowseCard post={p} size="wide" isSaved={saved.data?.includes(p.key)} saveDisabled={save.isPending} onSave={()=>user?save.mutate(p):navigate('/dashboard')} onOpen={()=>navigate(`/boardz?board=${p.category}&post=${p.id}`)}/></LockedCardSlot>)}</div>{!results.some(q=>q.isLoading)&&!unique.length&&<p className="ns-empty">No connected {tab==='gigz'?'Gigz':'Mizzed Connections'} posts yet.</p>}</section>;
}
