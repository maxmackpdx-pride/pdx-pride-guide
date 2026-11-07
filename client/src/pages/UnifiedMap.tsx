import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import type {Event} from '@shared/schema';
import type {Business} from '@/pages/Directory';
import {mapBookmark} from '@/lib/mapBookmarks';
const EventModal=lazy(()=>import('@/components/EventModal'));
const PlaceModal=lazy(()=>import('@/components/PlaceModal'));
import {useSearch} from 'wouter';
import {useAuth} from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';
import {usePageSeo} from '@/hooks/usePageSeo';
import release from '@shared/mapReleaseLock.json';
import {acquirePinnedMapModule} from '@/lib/pinnedMapModule';

type Mode='mapz'|'outzide'|'boardz'|'afterz'|'zaydark';
function initialMode():Mode {
 const candidate=new URLSearchParams(window.location.search).get('mode');
 if(['mapz','outzide','boardz','afterz','zaydark'].includes(candidate??''))return candidate as Mode;
 const layer=new URLSearchParams(window.location.search).get('layer');
 return ['gigz','giftz','sellz','mizzed','houz','housing'].includes(layer??'')?'boardz':window.location.pathname.startsWith('/outzide')?'outzide':'mapz';
}
/** One native engine loaded from a checksum-verified, pinned release artifact.
 * The component owns its styles/root and tears both down when leaving maps. */
export default function UnifiedMap(){
 const node=useRef<HTMLDivElement>(null);
 const {user}=useAuth();const search=useSearch();
 const [attempt,setAttempt]=useState(0),[error,setError]=useState('');
 const [legacyDetail,setLegacyDetail]=useState<{kind:'event';record:Event}|{kind:'place';record:Business}|null>(null);
 const [legacyError,setLegacyError]=useState('');
 const [authOpen,setAuthOpen]=useState(()=>new URLSearchParams(window.location.search).get('auth')==='login');
 usePageSeo('Mapz · Zaylist','Events, places, outdoor destinations, community boards, Afterz and adult-gated ZayDark.');
 useEffect(()=>{if(new URLSearchParams(search).get('auth')==='login')setAuthOpen(true);},[search]);
 useEffect(()=>{
  const request=mapBookmark(new URLSearchParams(search),initialMode()).native;
  setLegacyDetail(null);setLegacyError('');if(!request)return;
  const controller=new AbortController();
  void fetch(`/api/${request.kind==='event'?'events':'directory'}/${encodeURIComponent(request.id)}`,{credentials:'same-origin',cache:'no-store',signal:controller.signal}).then(async response=>{if(!response.ok)throw Error('This bookmarked record is unavailable.');const record=await response.json();if(!record||String(record.id)!==request.id)throw Error('The bookmarked source returned an invalid record.');setLegacyDetail(request.kind==='event'?{kind:'event',record}:{kind:'place',record});}).catch(reason=>{if(!controller.signal.aborted)setLegacyError(reason instanceof Error?reason.message:'Bookmarked record could not load.');});
  return()=>controller.abort();
 },[search]);
 const closeLegacy=()=>{setLegacyDetail(null);setLegacyError('');const url=new URL(window.location.href);url.searchParams.delete('event');url.searchParams.delete('place');window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash);};
 useEffect(()=>{
  let disposed=false;let cleanup:(()=>void)|undefined;let releaseStyles:(()=>void)|undefined;
  setError('');
  const load=async()=>{
   const acquired=await acquirePinnedMapModule();releaseStyles=acquired.release;
   if(disposed||!node.current){releaseStyles();return;}
   const module=acquired.module;
   const params=new URLSearchParams(window.location.search);
   const shared=window.location.pathname.match(/^\/outzide\/share\/([^/]+)$/)?.[1];
   const bookmark=mapBookmark(params,initialMode());
   if(bookmark.mode!==initialMode()){const url=new URL(window.location.href);url.searchParams.set('mode',bookmark.mode);window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash);}
   const result=module.mount(node.current,{initialMode:bookmark.mode,selectedId:shared?decodeURIComponent(shared):bookmark.selectedId,loginHref:'/map?mode=zaydark&auth=login'});
   cleanup=()=>result.unmount();
   window.dispatchEvent(new CustomEvent('zaylist:map-ready',{detail:{map:'unified',release:release.tag}}));
  };
  void load().catch(reason=>{if(!disposed)setError(reason instanceof Error?reason.message:'Map could not load.');});
  return()=>{disposed=true;cleanup?.();releaseStyles?.();};
 },[attempt,user?.id]);
 return <section className="zaylist-unified-map" aria-label="Zaylist five-mode map" data-map-release={release.tag} data-map-commit={release.commit} style={{position:'fixed',inset:0,zIndex:45,background:'var(--z-black,#050506)'}}>
  <div ref={node} style={{width:'100%',height:'100%',position:'relative'}}/>
  {error&&<div role="alert" style={{position:'absolute',inset:0,display:'grid',placeContent:'center',padding:24,background:'var(--z-black,#050506)',color:'white',gap:16}}><h1>Map unavailable</h1><p>{error}</p><button type="button" onClick={()=>setAttempt(v=>v+1)}>Retry map</button><a href="/events">Browse events without the map</a><a href="/">Back to Zaylist</a></div>}
  {legacyError&&<div role="alert" style={{position:'absolute',top:80,left:16,right:16,padding:16,background:'var(--z-black)',color:'white',zIndex:300}}>{legacyError} <button onClick={closeLegacy}>Dismiss</button></div>}
  {legacyDetail&&<Suspense fallback={<p role="status">Loading bookmarked details…</p>}>{legacyDetail.kind==='event'?<EventModal event={legacyDetail.record} onClose={closeLegacy}/>:<PlaceModal place={legacyDetail.record} onClose={closeLegacy} onRequireAuth={()=>setAuthOpen(true)}/>}</Suspense>}
  {authOpen&&!user&&<AuthModal onClose={()=>{setAuthOpen(false);const url=new URL(window.location.href);url.searchParams.delete('auth');window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash);}}/>}
 </section>;
}
