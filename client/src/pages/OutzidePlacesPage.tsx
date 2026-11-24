import type { DestinationCardProps } from '@/components/outz/MapDestinationCommunity';
import BuddyHosting,{UpcomingOutdoorEvents} from "@/components/outz/BuddyHosting";
import {usePageSeo} from '@/hooks/usePageSeo';
import RoomBackground from "@/components/RoomBackground";
import {CardStage} from '@/components/cards/CardStage';
import {useOpenCardClose} from '@/hooks/useOpenCardClose';
import '@/components/places/InlinePlacesDetails.css';
import OutzAlphabet from '@/components/outz/native/OutzAlphabet';
import {type OutzAlphabetRange} from '@shared/outzAlphabet';
import {Search,ArrowRight,ExternalLink} from 'lucide-react';
import { destinationBrowseLists, destinationIdentity, OUTZ_BROWSE_COLORS as COLORS } from '@/lib/outzDestinationBrowse';
import {useOutzArtwork,OutzArtworkCredit,type OutzArtworkRecord} from '@/components/outz/native/OutzArtworkCredit';
import CardBrowse,{type BrowseCardSize} from '@/components/places/CardBrowse';
import CardSizeSlider from '@/components/places/CardSizeSlider';
import {lazy,Suspense,useLayoutEffect,useState,useRef,type CSSProperties} from 'react';
import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {Link} from 'wouter';
import {outzPlacesWithCatalog,type OutzBrowseCatalogRow,type OutzSnapshot,type OutzPlace as Place} from '@shared/outz';
import {apiRequest} from '@/lib/queryClient';
import {useAuth} from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';
import {useToast} from '@/hooks/use-toast';
import PlacesPageSwitch from '@/components/places/PlacesPageSwitch';
import { DiscoveryWordmark } from '@/components/drawers/DiscoveryWordmark';
import PlacezDrawer from '@/components/places/PlacezDrawer';
import { OutzideDrawerContent } from '@/components/outz/OutzideDrawer';
import {RailHeader,SmallRail} from '@/components/places/RailBrowse';
import LockedCardSlot from '@/components/places/LockedCardSlot';
import {OutzClosed,OutzHero,OutzWaypoint,CampWaypoint,type OutzEntry} from '@/components/outz/native/NativeOutzideFace';
import type {BoardPost} from '@/lib/allBoards';
import BoardBrowseCard from '@/components/board/BoardBrowseCard';
import {outzWallToBoardPost,outzBoardIntent,type OutzBoardPost} from '@/lib/outzBoardPost';
import OutzPlace from './OutzPlace';
import { isValidBeachId } from '@shared/riverBrats';
const BeachCardSection = lazy(() => import('./NudeBeaches').then(module => ({default: module.BeachCardSection})));
import '@/components/outz/native/OutzidePlacesPage.css';
import './OutzidePlacesNative.css';
const GROUPS=[{id:'trails',label:'Trails, Parks & Snow',kind:'trail',kinds:['trail','dayuse','winter']},{id:'water',label:'Water & Beaches',kind:'beach',kinds:['beach','spring','fishing','boating']},{id:'camping',label:'Camping & Stays',kind:'camp',kinds:['camp','coastcamp','watercamp','stay']},{id:'atv',label:'ATV / OHV',kind:'atv',kinds:['atv']}];
type CatalogRow=OutzBrowseCatalogRow&{photo?:{src?:string;url?:string}};
type DestinationCounts={placeId:string;carpool:number;mizzed:number;buddy:number;total:number};
function entryFor(place:Place,photo:CatalogRow|undefined,counts:DestinationCounts|undefined,artwork:OutzArtworkRecord|undefined):OutzEntry{
 const identity = destinationIdentity(place.name, place.kind, photo?.kind);
 const silver = identity.artworkId === 'silver-falls', rooster = identity.artworkId === 'rooster-rock';
 return {id:'topographic',style:place.name,name:identity.name,location:silver?'Silverton, Oregon':rooster?'Corbett, Oregon':place.sourceName,kind:identity.kind,approvedArtworkId:artwork?place.id:undefined,artworkLandscapePosition:artwork?.landscapePosition,image:artwork?.src|| (silver?'/outzide-native/silver-falls-screenprint-v1.png':rooster?'/outzide-native/rooster-rock-screenprint-v1.png':photo?.photo?.src?(photo.photo.src.startsWith('/')?photo.photo.src:'/outzide-map/'+photo.photo.src):photo?.photo?.url||''),photoAlt:place.name,accent:'#FF7B00',categoryAccent:identity.categoryAccent,waypointKind:identity.waypointKind,postCounts:counts?{Carpool:counts.carpool,Mizzed:counts.mizzed,'Buddy Finder':counts.buddy}:undefined};
}
function Expanded({place,entry,initial,draft,onClose,onMarkRead,followed,onFollow}:{place:Place;entry:OutzEntry;initial:string;draft?:string;onClose:()=>void;onMarkRead?:()=>void;followed:boolean;onFollow:()=>void}){
 "use memo";
 const {dialogRef:dialog,requestClose}=useOpenCardClose(onClose);
 const scroller=useRef<HTMLDivElement>(null);
 const counters=useRef<HTMLDivElement>(null);
 const sectionNav=useRef<HTMLElement>(null);
 const touch=useRef<[number,number]|null>(null);
 const beach=isValidBeachId(place.id)?place.id:null;
 const tabs=beach?['Conditions','Your Trip','Wall','Beach community']:['Conditions','Your Trip','Wall'];
 const [tab,setTab]=useState(tabs.includes(initial)?initial:'Wall');
 const [boardIntent,setBoardIntent]=useState<'ride'|'missed'|'buddy'|null>(initial==='Carpool'?'ride':initial==='Mizzed'?'missed':initial==='Buddy Finder'?'buddy':null);
 const [scrollRequest,setScrollRequest]=useState(initial==='Conditions'?0:1);
 const chooseTab=(next:string)=>{
   setTab(next);
   setScrollRequest(n=>n+1);
 };
 const openWall=(intent:typeof boardIntent)=>{
   setBoardIntent(intent);
   chooseTab('Wall');
 };
 useLayoutEffect(()=>{
   const nav=sectionNav.current;
   const scrollBody=scroller.current;
   if(!nav||!scrollBody)return;
   const updatePadding=()=>scrollBody.style.setProperty('--outz-tabs-height', nav.offsetHeight+'px');
   updatePadding();
   const observer=new ResizeObserver(updatePadding);
   observer.observe(nav);
   return ()=>observer.disconnect();
 },[]);
 useLayoutEffect(()=>{
   const body=scroller.current;
   const actions=counters.current;
   if(!scrollRequest||!body||!actions)return;
   // The counters precede the sticky tabs and keep their position in the scroll body.
   const top=body.scrollTop+actions.getBoundingClientRect().bottom-body.getBoundingClientRect().top;
   body.scrollTo({top,behavior:'instant'});
 },[scrollRequest]);
 const weather=useQuery<{data:OutzSnapshot;stale:boolean}>({queryKey:['/api/outz'],refetchInterval:20*60_000});
 const reading=weather.data?.data.destinations.find(d=>d.id===place.id);
 const stamp=weather.data?.data.fetchedAt;
 return (
   <div ref={dialog} role="dialog" aria-modal="true" tabIndex={-1} className="outz-native-dialog" aria-label={place.name}>
     <div className="outz-native-expanded" style={{'--oz-category':entry.categoryAccent,'--oz-accent':entry.accent} as CSSProperties}>
       <button className="outz-native-close" aria-label="Close card" onClick={requestClose}>×</button>
       <div className="outz-expanded-scroll" ref={scroller}>
         <div className="outz-native-expanded-hero"><OutzHero entry={entry}/><CampWaypoint entry={entry}/></div><header className="outz-expanded-identity"><small>{entry.location}</small><h1>{entry.name}</h1><p>{entry.kind}</p></header><div className="outz-expanded-readings" aria-label="Destination snapshot"><div><b>Weather</b><span>{reading?.airTempF!=null?`${Math.round(reading.airTempF)}°F`:'Unavailable'}</span></div><div><b>Wind</b><span>{reading?.wind||'Unavailable'}</span></div><div><b>Access</b><span>{place.sourceStatus||'Check official source'}</span></div></div><div className="outz-expanded-freshness" role="status">{weather.isPending?'Loading conditions…':weather.isError?<><span>Could not refresh conditions. </span><button onClick={()=>weather.refetch()}>Try again</button></>:null}{reading&&stamp?<p>{weather.data?.stale||Date.now()-Date.parse(stamp)>20*60_000?'Last known snapshot':'Snapshot updated'} <time dateTime={stamp}>{new Date(stamp).toLocaleString()}</time>. Check the official source before travel.</p>:weather.isSuccess?<p>No conditions available for this destination. Check the official source before travel.</p>:null}{place.officialUrl&&<a href={place.officialUrl} target="_blank" rel="noopener noreferrer">Official destination information ↗</a>}</div>
         <BuddyHosting place={place} onIntent={openWall}/>
         <div ref={counters} className="oz-expanded-counters" aria-label="Destination posts">
           {(['Carpool','Mizzed','Buddy Finder'] as const).map(label=>
             <button key={label} className={`oz-counter ${label==='Mizzed'?'oz-counter--mizzed':label==='Buddy Finder'?'oz-counter--buddy':''}`}
               onClick={()=>openWall(label==='Carpool'?'ride':label==='Mizzed'?'missed':'buddy')}>
               {entry.postCounts?String(entry.postCounts[label]).padStart(2,'0'):'—'}<small>{label}</small>
             </button>)}
         </div>
         <nav ref={sectionNav} className="oz-tabs" aria-label="Destination sections">
           {tabs.map(t=><button key={t} aria-pressed={tab===t} onClick={()=>chooseTab(t)}>{t}</button>)}
         </nav>
         <div className="outz-native-sections" tabIndex={0} aria-label={`${tab} details`} data-section={tab}
           onTouchStart={e=>{
             // Maps, forms and horizontal rails handle their own touch gestures.
             if((e.target as HTMLElement).closest('input,textarea,select,button,a,form,[role="slider"],.maplibregl-map'))return;
             touch.current=[e.touches[0].clientX,e.touches[0].clientY];
           }}
           onTouchCancel={()=>{touch.current=null;}}
           onTouchEnd={e=>{
             const start=touch.current;
             touch.current=null;
             if(!start)return;
             const dx=e.changedTouches[0].clientX-start[0],dy=e.changedTouches[0].clientY-start[1];
             const index=tabs.indexOf(tab)+(dx<0?1:-1);
             if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.3&&tabs[index])chooseTab(tabs[index]);
           }}>
           {tab==='Wall'&&onMarkRead&&<button className="outz-native-mark-read" onClick={onMarkRead}>Mark these notifications read</button>}
           {tab==='Wall'&&<nav className="outz-wall-intents" aria-label="Filter destination posts">
             {([[null,'All posts'],['ride','Carpool'],['missed','Mizzed'],['buddy','Buddy Finder']] as const).map(([intent,label])=>
               <button key={label} aria-pressed={boardIntent===intent} onClick={()=>setBoardIntent(intent)}>{label}</button>)}
           </nav>}
           <div hidden={tab==='Beach community'}>
             <OutzPlace initialPostBody={draft} placeSlug={place.slug} embedded boardIntent={boardIntent}/>
           </div>
           {beach&&tab!=='Wall'&&<Suspense fallback={<p role="status">Loading beach details…</p>}>
             <BeachCardSection beachId={beach} section={tab==='Conditions'?'conditions':tab==='Your Trip'?'trip':'community'}/>
           </Suspense>}
         </div>
       </div>
       <footer className="outz-expanded-footer"><details className="outz-native-credit"><summary>Artwork sources</summary><p>{entry.approvedArtworkId?<OutzArtworkCredit placeId={entry.approvedArtworkId}/>:entry.image.includes('silver-falls')?'Artwork based on Bonnie Moreland’s CC0 South Falls photo.':entry.image.includes('rooster-rock')?<><a href="https://commons.wikimedia.org/wiki/File:Rooster_Rock_State_Park,_Oregon,_2019_-_47.jpg">Photo: Another Believer</a> · treated artwork <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</>:'Destination photograph from the OutZide catalog.'} Artwork is not a current conditions report.</p></details><button type="button" className="outz-expanded-save" aria-pressed={followed} aria-label={`${followed?'Unsave':'Save'} ${entry.name}`} onClick={onFollow}><span>Save this destination</span><span className="outz-expanded-save__heart" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 20 3.5 11.7A5.2 5.2 0 0 1 12 5.8a5.2 5.2 0 0 1 8.5 5.9Z" fill={followed?'currentColor':'none'}/></svg></span></button></footer>
     </div>
   </div>
 );
}
function useDestinationCards(){
 const {user}=useAuth(),{toast}=useToast(),qc=useQueryClient();
 const snapshot=useQuery<{data:OutzSnapshot}>({queryKey:['/api/outz']});
 const catalog=useQuery<{places:CatalogRow[]}>({queryKey:['/outzide-map/places.json'],queryFn:()=>apiRequest('GET','/outzide-map/places.json').then(r=>r.json()),staleTime:300000});
 const totals=useQuery<{items:DestinationCounts[]}>({queryKey:['/api/outz/board/counts',user?.id],queryFn:()=>apiRequest('GET','/api/outz/board/counts').then(r=>r.json()),staleTime:15000});
 const notices=useQuery<{outzide:{id:string;unreadCount:number;lastVisibleId:number}[]}>({queryKey:['/api/card-notifications',user?.id],queryFn:()=>apiRequest('GET','/api/card-notifications').then(r=>r.json()),enabled:!!user});
 const places=outzPlacesWithCatalog(snapshot.data?.data,catalog.data?.places||[]);
 const hearts=useQuery<{kind:string;ref:string}[]>({queryKey:['/api/hearts',user?.id],queryFn:()=>apiRequest('GET','/api/hearts').then(r=>r.json()),enabled:!!user});
 const following=new Set((hearts.data||[]).filter(h=>h.kind==='outz').map(h=>h.ref));
 const follow=useMutation({mutationFn:({id,on}:{id:string;on:boolean})=>apiRequest(on?'DELETE':'POST','/api/outz/follow',{placeId:id}),onSuccess:()=>{qc.invalidateQueries({queryKey:['/api/outz/upcoming']});qc.invalidateQueries({queryKey:['/api/outz/follow']});qc.invalidateQueries({queryKey:['/api/hearts']});qc.invalidateQueries({queryKey:['/api/card-notifications']});qc.invalidateQueries({queryKey:['/api/hub/feed']});},onError:()=>toast({title:'Could not update follow. Please try again.',variant:'destructive'})});
 const artwork=useOutzArtwork();
 const entry=(p:Place)=>entryFor(p,catalog.data?.places.find(c=>c.id===p.id),totals.data?totals.data.items.find(c=>c.placeId===p.id)||{placeId:p.id,carpool:0,mizzed:0,buddy:0,total:0}:undefined,artwork?.[p.id]);
 const markRead=(id:string)=>{
   const notice=notices.data?.outzide.find(item=>item.id===id);
   if(!notice)return;
   void apiRequest('PUT',`/api/card-notifications/outzide/${encodeURIComponent(id)}/read`,{lastVisibleId:notice.lastVisibleId})
     .then(()=>qc.invalidateQueries({queryKey:['/api/card-notifications']}))
     .catch(()=>toast({title:'Could not mark notifications read',variant:'destructive'}));
 };
 const toggleFollow=(id:string)=>{if(!follow.isPending)follow.mutate({id,on:following.has(id)});};
 return {snapshot,catalog,places,entry,following,notices,markRead,toggleFollow};
}

/** The same writable card can open over a mapped place without navigating away from the map. */
export function DestinationCardById({placeId,initial,draft,onClose}:DestinationCardProps){
 const {user}=useAuth();
 const [auth,setAuth]=useState(false);
 const {snapshot,catalog,places,entry,following,markRead,toggleFollow}=useDestinationCards();
 const place=places.find(item=>item.id===placeId);
 if(!place)return <CardStage onClose={onClose}><div role="dialog" aria-label="Destination card" className="outz-native-dialog">
   <button onClick={onClose}>Close</button>
   {snapshot.isPending||catalog.isPending?<p role="status">Loading destination…</p>:
     <p role="alert">Destination unavailable. <button onClick={()=>{void snapshot.refetch();void catalog.refetch();}}>Retry</button></p>}
 </div></CardStage>;
 return <>
   <CardStage onClose={onClose}><Expanded key={placeId} place={place} entry={entry(place)} initial={initial} draft={draft}
     followed={following.has(place.id)} onFollow={()=>user?toggleFollow(place.id):setAuth(true)}
     onMarkRead={user?()=>markRead(place.id):undefined} onClose={onClose}/></CardStage>
   {auth&&<AuthModal portalTargetSelector=".outz-native-dialog" onClose={()=>setAuth(false)}/>}
 </>;
}
export default function OutzidePlacesPage(){
 "use memo";
 usePageSeo('OutZide destinations | Zaylist','Explore outdoor destinations, conditions, and community trip boards.');
 const {user}=useAuth(),{toast}=useToast(),qc=useQueryClient();const [auth,setAuth]=useState(false);const [cardSize,setCardSize]=useState<BrowseCardSize>('small'),[search,setSearch]=useState(''),[group,setGroup]=useState(''),[tab,setTab]=useState('destinations'),[active,setActive]=useState<{place:Place;initial:string}|null>(null);
 const [alphabet,setAlphabet]=useState<OutzAlphabetRange>('All');
 const {snapshot,catalog,places,entry,following,notices,markRead,toggleFollow}=useDestinationCards();
 const board=useQuery<OutzBoardPost[]>({queryKey:['/api/outz/board',user?.id],queryFn:()=>apiRequest('GET','/api/outz/board').then(r=>r.json())});
 const savedPosts=useQuery<string[]>({queryKey:['/api/boards/saved',user?.id],queryFn:()=>apiRequest('GET','/api/boards/saved').then(r=>r.json()),enabled:!!user});
 const savePost=useMutation({mutationFn:(post:BoardPost)=>apiRequest(savedPosts.data?.includes(post.key)?'DELETE':'PUT',`/api/boards/${post.category}/posts/${post.id}/save`),onSuccess:()=>{void qc.invalidateQueries({queryKey:['/api/boards/saved']});},onError:()=>toast({title:'Could not update saved posts. Please try again.',variant:'destructive'})});
 const { explored, exploreWithPhotos, seasonal, followed, scope } = destinationBrowseLists(
   places, search, group, GROUPS.find(item => item.id === group)?.kinds, alphabet, following, entry,
 );
 function card(p:Place,size:'small'|'square'|'wide'='wide'){return <LockedCardSlot key={p.id} size={size}><OutzClosed entry={entry(p)} size={size==='wide'?'wide-map':size} followed={following.has(p.id)} onFollow={()=>user?(toggleFollow(p.id)):setAuth(true)} unread={notices.data?.outzide.find(n=>n.id===p.id)?.unreadCount||0} onNotifications={()=>setActive({place:p,initial:'Wall'})} onOpen={initial=>setActive({place:p,initial})}/></LockedCardSlot>}
 const destinationSearch = (
   <form className="ol-search" role="search" onSubmit={event => {
     event.preventDefault();
     const drawer = event.currentTarget.closest('[role="dialog"]');
     setTab('destinations');
     requestAnimationFrame(() => {
       const results = drawer
         ? drawer.querySelector<HTMLElement>('.outz-drawer-lead a,.outz-drawer-status')
         : document.getElementById('outz-destination-results');
       results?.scrollIntoView({block: 'start'});
       results?.focus({preventScroll: true});
     });
   }}>
     <Search aria-hidden="true"/>
     <input aria-label="Search OutZide destinations" placeholder="DISCOVER OUTDOOR DESTINATIONS"
       value={search} onChange={event => setSearch(event.target.value)}/>
     <button type="submit" aria-label="Show matching destinations"><ArrowRight aria-hidden="true"/></button>
   </form>
 );
 const destinationActivities = (
   <div className="ol-filters" role="group" aria-label="Destination activities">
     {GROUPS.map(activity => (
       <button key={activity.id} style={{'--kind': COLORS[activity.kind]} as CSSProperties}
         aria-pressed={group === activity.id} onClick={() => setGroup(group === activity.id ? '' : activity.id)}>
         <OutzWaypoint kind={activity.kind}/>
         <span><b>{activity.label}</b><small>{activity.kinds.map(kind => kind.replace('camp', ' camping')).join(' · ')}</small></span>
       </button>
     ))}
   </div>
 );
 const matchingDestinationIds = new Set(explored.map(place => place.id));
 const drawerTop = <>
   <section className="outz-drawer-browse-filters" aria-label="Destination filters">
     {destinationSearch}
     {destinationActivities}
     <OutzAlphabet value={alphabet} onChange={setAlphabet}/>
   </section>
   <OutzideDrawerContent browse={(catalog.data?.places ?? []).filter(row => matchingDestinationIds.has(row.id))}
     onOpen={row => {
       const place = places.find(item => item.id === row.id);
       if (place) setActive({place, initial: 'Wall'});
     }}/>
 </>;
 return <main className="outz-landing outz-native-page room-shader-page"><RoomBackground room="outzide"/><header className="ol-hero"><img className="ol-full-logo" src="/outzide-native/outzide-full.png" alt="OutZide"/><PlacesPageSwitch active="outzide" compact/><h1>Out there. Together.</h1></header><div className="ol-body">{destinationSearch}<Link className="ol-map-link" href="/outzide">Open OutZide map <ExternalLink aria-hidden="true"/></Link><Link className="ol-map-link" href="/outzide/a-z">Every location, A–Z</Link>{snapshot.isError?<p role="alert">Destinations could not load. <button onClick={()=>snapshot.refetch()}>Try again</button></p>:snapshot.isPending?<p role="status">Loading destinations…</p>:null}{catalog.isError?<p role="alert">The destination catalog could not load. <button onClick={()=>catalog.refetch()}>Retry catalog</button></p>:catalog.isPending?<p role="status">Loading destination catalog…</p>:null}{seasonal.length>0&&<section aria-label="Discover seasonal destinations"><div className="ol-discover-heading"><h2>DISCOVER <i aria-hidden="true">///</i></h2><span>DESTINATION PICKS · {seasonal.length}</span></div><div className="outz-native-rail">{seasonal.map(p=>card(p))}</div></section>}{destinationActivities}<nav className="oz-tabs" aria-label="OutZide content"><button aria-pressed={tab==='destinations'} onClick={()=>setTab('destinations')}>DESTINATIONS</button><button aria-pressed={tab==='boardz'} onClick={()=>setTab('boardz')}>BOARDZ POSTS</button></nav>{tab==='boardz'?<section><h2>BOARDZ POSTS</h2><p>Carpool · Mizzed · Buddy Finder</p>{user&&savedPosts.isError&&<p role="alert">Saved posts could not load. <button onClick={()=>savedPosts.refetch()}>Retry saved posts</button></p>}{board.isError?<p role="alert">Posts could not load. <button onClick={()=>board.refetch()}>Try again</button></p>:board.isPending?<p>Loading posts…</p>:<div className="outz-native-board">{board.data.filter(p=>!p.isDemo&&outzBoardIntent(p.postKind)).map(p=>{const post=outzWallToBoardPost(p);if(!post)return null;return <BoardBrowseCard key={p.id} post={post} isSaved={savedPosts.data?.includes(post.key)} saveDisabled={savePost.isPending||!!user&&(savedPosts.isPending||savedPosts.isError)} onSave={()=>user?savePost.mutate(post):setAuth(true)} onOpen={()=>{const place=places.find(x=>x.id===p.placeId);if(place)setActive({place,initial:'Wall'});else window.location.assign('/boardz');}}/>;})}{!board.data.some(p=>!p.isDemo&&outzBoardIntent(p.postKind))&&<p>No active posts yet. Open a destination to post.</p>}</div>}</section>:<><h2 id="outz-destination-results" tabIndex={-1}>EXPLORE OUTZIDE</h2>{group?(()=>{const g=GROUPS.find(g=>g.id===group)!;return <><RailHeader name={g.label} color={COLORS[g.kind]} count={exploreWithPhotos.length} action="Show all" onFilter={()=>setGroup('')}/><CardBrowse items={exploreWithPhotos} scope={JSON.stringify(scope)} label="OutZide destinations" renderCard={card} size={cardSize} onSizeChange={setCardSize}/></>;})():<div className="pz-rails">{GROUPS.map(g=>{const items=explored.filter(p=>entry(p).image&&g.kinds.includes(entry(p).waypointKind));return items.length?<section key={g.id} aria-label={g.label}><RailHeader name={g.label} color={COLORS[g.kind]} count={items.length} onFilter={()=>setGroup(g.id)}/><SmallRail label={`${g.label} destinations`}>{items.map(p=>card(p,'small'))}</SmallRail></section>:null;})}</div>}{explored.filter(p=>!entry(p).image).length>0&&<section><h2>MORE DESTINATIONS</h2><p className="ol-note">These destinations are available while their artwork is being prepared.</p>{explored.filter(p=>!entry(p).image).map(p=><button className="outz-native-list-row" key={p.id} onClick={()=>setActive({place:p,initial:'Conditions'})}>{p.name}<span>View details ›</span></button>)}</section>}{snapshot.isSuccess&&catalog.isSuccess&&!explored.length&&<p>No destinations match these filters.</p>}</> }</div><PlacezDrawer brand={<DiscoveryWordmark rooms={["outz"]}/>} title="Outzide" events={null} accent="var(--neon-orange)" top={drawerTop} filters={<CardSizeSlider value={cardSize} onChange={setCardSize} accent="var(--neon-orange)"/>} upcoming={<UpcomingOutdoorEvents/>} saved={(()=>{return followed.length?<div className="pz-drawer-saved">{GROUPS.filter(g=>followed.some(p=>g.kinds.includes(entry(p).waypointKind))).map(g=><div className="pz-drawer-saved__group" key={g.id} style={{'--category':COLORS[g.kind]} as CSSProperties}><h4>{g.label}</h4><div className="pz-drawer-saved__cards">{followed.filter(p=>g.kinds.includes(entry(p).waypointKind)).map(p=>card(p,'small'))}</div></div>)}</div>:<p className="pz-drawer-empty">Follow a destination with its heart to keep it here.</p>;})()}/>{active&&<CardStage key={active.place.id} onClose={()=>setActive(null)}><Expanded place={active.place} entry={entry(active.place)} followed={following.has(active.place.id)} onFollow={()=>user?(toggleFollow(active.place.id)):setAuth(true)} initial={active.initial} onMarkRead={user?()=>markRead(active.place.id):undefined} onClose={()=>setActive(null)}/></CardStage>}{auth&&<AuthModal portalTargetSelector=".outz-native-dialog" onClose={()=>setAuth(false)}/>}</main>;
}


