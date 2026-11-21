import {useState} from 'react';
import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {useLocation} from 'wouter';
import {useAuth} from '@/context/AuthContext';
import {apiRequest} from '@/lib/queryClient';
import {toBoardPosts,type BoardPost} from '@/lib/allBoards';
import BoardBrowseCard from '@/components/board/BoardBrowseCard';
import LockedCardSlot from './LockedCardSlot';
export default function PlacezBoardFeed({onRequireAuth}:{onRequireAuth:()=>void}){
 const {user}=useAuth();const cache=useQueryClient();const [,navigate]=useLocation();const [category,setCategory]=useState<'gigz'|'mizzed'>('gigz');
 const endpoint=category==='gigz'?'/api/gigs':'/api/missed-connections';
 const feed=useQuery({queryKey:[endpoint],queryFn:()=>apiRequest('GET',endpoint).then(r=>r.json())});
 const saved=useQuery<string[]>({queryKey:['/api/boards/saved',user?.id],queryFn:()=>apiRequest('GET','/api/boards/saved').then(r=>r.json()),enabled:!!user});
 const save=useMutation({mutationFn:(p:BoardPost)=>apiRequest(saved.data?.includes(p.key)?'DELETE':'PUT',`/api/boards/${p.category}/posts/${p.id}/save`),onSuccess:()=>{void cache.invalidateQueries({queryKey:['/api/boards/saved']});}});
 const posts=feed.data?toBoardPosts(category,feed.data):[];
 return <section className="pl-board-native"><div className="pl-board-choices">{(['gigz','mizzed'] as const).map(c=><button key={c} aria-pressed={category===c} onClick={()=>setCategory(c)} style={{color:c==='gigz'?'#7B00FF':'#FF1FA0'}}>{c==='gigz'?'GIGZ':'MIZZED CONNECTIONS'}</button>)}</div>{feed.isLoading&&<p role="status">Loading posts…</p>}{feed.isError&&<p role="alert">Posts could not load. <button onClick={()=>feed.refetch()}>Try again</button></p>}{save.isError&&<p role="alert">Could not save that post. Please try again.</p>}<div className="pl-board-grid">{posts.map(p=><LockedCardSlot key={p.key} size="wide"><BoardBrowseCard post={p} size="wide" isSaved={saved.data?.includes(p.key)} saveDisabled={save.isPending} onSave={()=>user?save.mutate(p):onRequireAuth()} onOpen={()=>navigate(`/boardz?board=${p.category}&post=${p.id}`)}/></LockedCardSlot>)}</div>{!feed.isLoading&&!feed.isError&&!posts.length&&<p className="pl-empty">No current posts yet.</p>}</section>;
}
