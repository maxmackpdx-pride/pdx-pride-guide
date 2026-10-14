import {useEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/context/AuthContext';
import {apiRequest} from '@/lib/queryClient';
import {boardCategories,intentLabels,toBoardPosts,type BoardPost,type BoardPayload} from '@/lib/allBoards';
import UnifiedBoardArt from '@/components/board/UnifiedBoardArt';
import {BoardCardMotif} from '@/components/board/BoardCardMotif';
import BoardPushPin from '@/components/board/BoardPushPin';
import type {ProfileBoardPost} from './types';
import '@/pages/AllBoards.css';
import './ProfileBoardPreview.css';
/** The same Our BoardZ closed object; profile engagement remains its native footer. */
export default function ProfileBoardPreview({post,type,onOpen,footer}:{post:ProfileBoardPost;type:'GIG'|'GIFTING';onOpen:()=>void;footer:ReactNode}) {
 const host=useRef<HTMLDivElement>(null);const [visible,setVisible]=useState(false);const {user}=useAuth();
 const category=type==='GIG'?'gigz':'giftz';const endpoint=type==='GIG'?'/api/gigs':'/api/gifting';
 useEffect(()=>{const node=host.current;if(!node)return;const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setVisible(true);observer.disconnect();}},{rootMargin:'120px'});observer.observe(node);return()=>observer.disconnect();},[]);
 const detail=useQuery({queryKey:[endpoint,post.id,user?.id],queryFn:()=>apiRequest('GET',`${endpoint}/${post.id}`).then(r=>r.json()),enabled:visible,staleTime:60000,retry:1});
 const fallback:BoardPost={key:`${category}:${post.id}`,id:post.id,category,intent:type==='GIG'?'hiring':'giving',title:post.title || post.text,description:post.text,area:post.where || '',value:'',detail:'',createdAt:post.createdAt || ''};
 const record=detail.data ? toBoardPosts(category,[detail.data] as BoardPayload,true)[0] : undefined;
 const shown=record || fallback;
 const room=boardCategories.find(item=>item.id===category)!;
 return <div ref={host} className="pp-board-preview ab-pinned-card pdx-glass-rebind" role="listitem" style={{'--c':room.color} as CSSProperties}>
 <BoardPushPin postKey={shown.key}/><article className={`ab-card${record ? ` ab-card--${record.intent}` : ''} pdx-glass-rebind`} role="button" tabIndex={0} aria-label={`Open ${shown.title}`} onClick={event=>{if(!(event.target as Element).closest('button,a,input,textarea,select'))onOpen();}} onKeyDown={event=>{if(event.target===event.currentTarget && (event.key==='Enter'||event.key===' ')){event.preventDefault();onOpen();}}}>{record ? <><BoardCardMotif post={record} placement="card"/><UnifiedBoardArt post={record}/></> : <div className="ab-art pp-board-preview__pending" aria-hidden="true"><img className="ab-art__brand" src={`/brand/family/${room.logo}`} alt=""/></div>}<div className="ab-card__body"><div className="ab-card__eyebrow">{record && <span>{intentLabels[record.intent]}</span>}{record?.isDemo && <span className="ab-demo-badge">DEMO</span>}</div><h3><button type="button" onClick={onOpen}>{shown.title}</button></h3><p className="ab-card__detail">{shown.detail || shown.description}</p><div className="ab-card__bottom">{shown.value && <strong className="ab-card__value">{shown.value}</strong>}<p className="ab-card__location">{shown.area}</p><button className="ab-open" type="button" onClick={onOpen} aria-label={`Open ${shown.title}`}>Open card ↗</button>{detail.isError && <button type="button" className="ab-open" onClick={()=>void detail.refetch()}>Retry details</button>}{detail.isPending && <span className="pp-board-preview__status" role="status">Loading details…</span>}{footer}</div></div></article></div>;
}
