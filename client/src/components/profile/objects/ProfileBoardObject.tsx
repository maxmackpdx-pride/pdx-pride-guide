import {Suspense,useRef,lazy} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/context/AuthContext';
import {apiRequest} from '@/lib/queryClient';
import BoardPostFace from '@/components/board/BoardPostFace';
import BoardDetailBoundary from '@/components/board/BoardDetailBoundary';
import {BoardCardInline,BoardCardOrigin,type CardOrigin} from '@/components/board/BoardCardContinuity';
import {boardCategories,type BoardCategory} from '@/lib/allBoards';
const BoardDetail=lazy(()=>import('@/components/board/BoardDetail'));
export default function ProfileBoardObject({category,id,small,open,inline,onOpen,onClose,onRequireAuth,onSelect}:{category:Exclude<BoardCategory,'mizzed'>;id:number;small:boolean;open:boolean;inline:boolean;onOpen:()=>void;onClose:()=>void;onRequireAuth:()=>void;onSelect:(key:string)=>void}){
 const {user}=useAuth(),face=useRef<HTMLDivElement>(null),origin=useRef<CardOrigin|null>(null);const endpoint=boardCategories.find(c=>c.id===category)!.endpoint;
 const query=useQuery({queryKey:[endpoint,id,user?.id],queryFn:()=>apiRequest('GET',`${endpoint}/${id}`).then(r=>r.json()),staleTime:30000});
 if(query.isPending)return <p role="status">Loading post…</p>;
 if(query.isError||!query.data)return <div role="status">This post is unavailable. <button onClick={()=>void query.refetch()}>Try again</button></div>;
 return <div className={`profile-board-object${open&&inline?' is-open':''}`}><div ref={face} className="profile-board-object__face"><BoardPostFace category={category} post={query.data} small={small} onOpen={()=>{const element=face.current?.querySelector<HTMLElement>('.boardz-production-card');if(element)origin.current={element,rect:element.getBoundingClientRect()};onOpen();}}/></div>{open&&<div className={inline?'boardz-inline-host':''}><BoardCardInline.Provider value={inline}><BoardCardOrigin.Provider value={origin.current}><BoardDetailBoundary onClose={onClose}><Suspense fallback={<p role="status">Opening post…</p>}><BoardDetail postKey={`${category}:${id}`} onClose={onClose} onRequireAuth={onRequireAuth} onSelect={onSelect}/></Suspense></BoardDetailBoundary></BoardCardOrigin.Provider></BoardCardInline.Provider></div>}</div>;
}
