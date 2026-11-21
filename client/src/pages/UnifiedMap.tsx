import { MapPlacePreview } from '@/components/MapCardPresentation';
import {useMapPlacezRenderer} from '@/components/placez/MapPlacezBridge';
import PlacezMapDrawer from '@/components/places/PlacezMapDrawer';
import OutzideDrawer from '@/components/outz/OutzideDrawer';
import AfterzDrawer from '@/components/afterz/AfterzDrawer';
import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import type {Event} from '@shared/schema';
import type {Business} from '@/pages/Directory';
import {canonicalBoardBookmark,mapBookmark} from '@/lib/mapBookmarks';
const AfterzInvitations=lazy(()=>import("@/components/afterz/AfterzInvitations"));
const EventCard=lazy(()=>import('@/components/events/EventzExpanded'));
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
function isPlacezMapMode(){
 const path=window.location.pathname.replace(/\/+$/, '') || '/';
 const mode=new URLSearchParams(window.location.search).get('mode');
 if(path==='/placez/map') return !mode || mode==='mapz';
 if(path==='/mapz') return !mode || mode==='mapz';
 return path==='/map' || path==='/map-demo' ? mode==='mapz' : false;
}
function isOutzideMapMode(){
 const path=window.location.pathname.replace(/\/+$/, '') || '/';
 const mode=new URLSearchParams(window.location.search).get('mode');
 if(path==='/outzide' || path.startsWith('/outzide/share/')) return !mode || mode==='outzide';
 return path==='/map' || path==='/map-demo' ? mode==='outzide' : false;
}
function isAfterzMapMode(){
 const path=window.location.pathname.replace(/\/+$/, '') || '/';
 const mode=new URLSearchParams(window.location.search).get('mode');
 return path==='/map' || path==='/map-demo' ? mode==='afterz' : false;
}

/** One native engine loaded from a checksum-verified, pinned release artifact.
 * The component owns its styles/root and tears both down when leaving maps. */
export default function UnifiedMap(){
 const node=useRef<HTMLDivElement>(null);
 const {renderer:placezRenderer,portals:placezPortals}=useMapPlacezRenderer();
 const {user}=useAuth();const search=useSearch();
 const placezMode=isPlacezMapMode();
 const outzideMode=isOutzideMapMode();
 const afterzMode=isAfterzMapMode();
 const afterzDeepLink=new URLSearchParams(search).has('gathering')||new URLSearchParams(search).get('invites')==='1';
 useEffect(()=>{
  const root=document.querySelector('.zaylist-unified-map');
  if(root instanceof HTMLElement) root.dataset.placezHostDrawer=placezMode?'on':'off';
  return()=>{if(root instanceof HTMLElement) delete root.dataset.placezHostDrawer;};
 },[placezMode,search]);
 const [attempt,setAttempt]=useState(0),[error,setError]=useState('');
 const [legacyDetail,setLegacyDetail]=useState<{kind:'event';record:Event}|{kind:'place';record:Business}|null>(null);
 const [expandedPlace,setExpandedPlace]=useState(false);
 const [legacyError,setLegacyError]=useState('');
 const [authOpen,setAuthOpen]=useState(()=>new URLSearchParams(window.location.search).get('auth')==='login');
 usePageSeo(`${({mapz:'PlaceZ',outzide:'OutZide',boardz:'Boardz',afterz:'Afterz',zaydark:'ZayDark'})[initialMode()]} · Zaylist`,'Events, places, outdoor destinations, community boards, Afterz and adult-gated ZayDark.');
 useEffect(()=>{if(new URLSearchParams(search).get('auth')==='login')setAuthOpen(true);},[search]);
 const bookmark=mapBookmark(new URLSearchParams(search),initialMode()).native;
 const bookmarkKind=bookmark?.kind,bookmarkId=bookmark?.id;
 useEffect(()=>{
  const request=bookmarkKind&&bookmarkId?{kind:bookmarkKind,id:bookmarkId}:undefined;
  setLegacyDetail(null);setExpandedPlace(false);setLegacyError('');if(!request)return;
  const controller=new AbortController();
  void fetch(`/api/${request.kind==='event'?'events':'directory'}/${encodeURIComponent(request.id)}`,{credentials:'same-origin',cache:'no-store',signal:controller.signal}).then(async response=>{if(!response.ok)throw Error('This bookmarked record is unavailable.');const record=await response.json();if(!record||String(record.id)!==request.id)throw Error('The bookmarked source returned an invalid record.');setLegacyDetail(request.kind==='event'?{kind:'event',record}:{kind:'place',record});}).catch(reason=>{if(!controller.signal.aborted)setLegacyError(reason instanceof Error?reason.message:'Bookmarked record could not load.');});
  return()=>controller.abort();
 },[bookmarkKind,bookmarkId]);
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
   if(bookmark.mode==='boardz' && bookmark.selectedId && !params.has('item')){
    const url=new URL(window.location.href);url.search=canonicalBoardBookmark(params,bookmark.selectedId).toString();
    window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash);
   }else if(bookmark.mode!==initialMode()){const url=new URL(window.location.href);url.searchParams.set('mode',bookmark.mode);window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash);}
   const result=module.mount(node.current,{initialMode:bookmark.mode,selectedId:shared?decodeURIComponent(shared):bookmark.selectedId,loginHref:'/map?mode=zaydark&auth=login',placezRenderer});
   cleanup=()=>result.unmount();
   window.dispatchEvent(new CustomEvent('zaylist:map-ready',{detail:{map:'unified',release:release.tag}}));
  };
  void load().catch(reason=>{if(!disposed)setError(reason instanceof Error?reason.message:'Map could not load.');});
  return()=>{disposed=true;cleanup?.();releaseStyles?.();};
 },[attempt,user?.id,placezRenderer]);
 return <section className="zaylist-unified-map" aria-label="Zaylist five-mode map" data-map-release={release.tag} data-map-commit={release.commit} style={{position:'fixed',inset:0,zIndex:45,background:'var(--z-black,#050506)'}}>
  <div ref={node} style={{width:'100%',height:'100%',position:'relative'}}/>
  {placezPortals}
  {placezMode&&<PlacezMapDrawer/>}
  {outzideMode&&<OutzideDrawer/>}
  {afterzMode&&<AfterzDrawer/>}
  {afterzMode&&afterzDeepLink && <Suspense fallback={null}><AfterzInvitations signIn={()=>setAuthOpen(true)} signingIn={authOpen && !user}/></Suspense>}
  {error&&<div role="alert" style={{position:'absolute',inset:0,display:'grid',placeContent:'center',padding:24,background:'var(--z-black,#050506)',color:'white',gap:16}}><h1>Map unavailable</h1><p>{error}</p><button type="button" onClick={()=>setAttempt(v=>v+1)}>Retry map</button><a href="/events">Browse events without the map</a><a href="/">Back to Zaylist</a></div>}
  {legacyError&&<div role="alert" style={{position:'absolute',top:80,left:16,right:16,padding:16,background:'var(--z-black)',color:'white',zIndex:300}}>{legacyError} <button onClick={closeLegacy}>Dismiss</button></div>}
  {legacyDetail&&<Suspense fallback={<p role="status">Loading bookmarked details…</p>}>{legacyDetail.kind==='event'?<EventCard event={legacyDetail.record} onClose={closeLegacy}/>:!expandedPlace?<MapPlacePreview place={legacyDetail.record} onExpand={()=>setExpandedPlace(true)} onClose={closeLegacy} onRequireAuth={()=>setAuthOpen(true)}/>:<PlaceModal place={legacyDetail.record} onClose={closeLegacy} onRequireAuth={()=>setAuthOpen(true)}/>}</Suspense>}
  {authOpen&&!user&&<AuthModal onClose={()=>{setAuthOpen(false);const url=new URL(window.location.href);url.searchParams.delete('auth');window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash);}}/>}
 </section>;
}

