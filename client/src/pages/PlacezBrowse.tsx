import {useAuth} from '@/context/AuthContext';
import {usePageSeo} from '@/hooks/usePageSeo';
import RoomBackground from "@/components/RoomBackground";
import CardBrowse,{type BrowseCardSize} from '@/components/places/CardBrowse';
import CardSizeSlider from '@/components/places/CardSizeSlider';
import {useRef,useState,type CSSProperties} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Coffee,Utensils,Wine,Compass,Flame,Search,ArrowRight,Heart} from 'lucide-react';
import {apiRequest} from '@/lib/queryClient';
import {isPlacezType} from '@shared/directoryTheme';
import {directoryResourceName} from '@/lib/directoryResources';
import NativePlacezFace from '@/components/placez/NativePlacezFace';
import PlaceModal from '@/components/PlaceModal';
import AuthModal from '@/components/AuthModal';
import type {Business} from './Directory';
import LockedCardSlot from '@/components/places/LockedCardSlot';
import PlacesPageSwitch from '@/components/places/PlacesPageSwitch';
import PlacezBoardFeed from '@/components/places/PlacezBoardFeed';
import PlacezDrawer from '@/components/places/PlacezDrawer';
import { pacificCalendarDate } from '@shared/missedConnections';
import { DrawerTop } from '@/components/drawers';
import { EMPTY_DRAWER_FILTERS, eventMatchesAnyTime, eventMatchesTags, placeMatchesCategories, type DrawerFilterState } from '@shared/drawerFilters';
import {RailHeader,SmallRail} from '@/components/places/RailBrowse';
import '@/components/places/PlacezLanding.css';
import '@/components/places/PlacezReferenceHeader.css';
const FILTERS=[{id:'coffee',name:'Coffee & conversation',color:'#2BFF00',Icon:Coffee},{id:'food',name:'Something good to eat',color:'#FF7B00',Icon:Utensils},{id:'night',name:'A night out',color:'#FF1FA0',Icon:Wine},{id:'different',name:'Something different',color:'#00FFFF',Icon:Compass},{id:'adult',name:'Adult',color:'#7B00FF',Icon:Flame}];
const group=(p:Business)=>p.type==='cafe'?'coffee':p.type==='restaurant'?'food':['bar','venue'].includes(p.type)?'night':'different';
const DISCOVER_ORDER=[5,30,2,3,31,23,9];
const adult=(p:Business)=>/\b(adult|21\+|strip|sex club)\b/i.test(`${p.description} ${p.name}`);
export default function PlacezBrowse(){
 "use memo";
 usePageSeo('Our PlaceZ | Zaylist','Discover and follow Portland venues, businesses, and community places.');
 const {user}=useAuth();
 const resultHeading=useRef<HTMLHeadingElement>(null);
 const rail=useRef<HTMLDivElement>(null);const [query,setQuery]=useState(''),[filter,setFilter]=useState(''),[tab,setTab]=useState('places'),[auth,setAuth]=useState(false),[active,setActive]=useState<Business|null>(null);
 const [cardSize,setCardSize]=useState<BrowseCardSize>('small');
 const [drawerFilters,setDrawerFilters]=useState<DrawerFilterState>(EMPTY_DRAWER_FILTERS);
 const [selectedDate,setSelectedDate]=useState<string|null>(null);
 const result=useQuery<Business[]>({queryKey:['/api/directory','browse',user?.id],queryFn:()=>apiRequest('GET','/api/directory').then(r=>r.json()),staleTime:60000,refetchOnMount:'always'});
 const detail=useQuery<Business>({queryKey:['/api/directory',active?.id,user?.id],queryFn:()=>apiRequest('GET',`/api/directory/${active!.id}`).then(r=>r.json()),enabled:!!active,staleTime:30000});
 const places=(result.data||[]).filter(p=>isPlacezType(p.type)&&p.type!=='campground'&&!directoryResourceName(p));
 const textMatch=(p:Business)=>!query||`${p.name} ${p.description} ${p.neighborhood}`.toLowerCase().includes(query.toLowerCase());
 const inFilter=(p:Business,f:string)=>f==='adult'?adult(p):group(p)===f;
 const matchesDrawer=(p:Business)=>{
  if(selectedDate && !(p.upcomingEvents||[]).some(event=>pacificCalendarDate(event.dateStart)===selectedDate))return false;
  if(drawerFilters.categories.length && !placeMatchesCategories(p, drawerFilters.categories)) return false;
  if(drawerFilters.times.length){
    const upcoming=p.upcomingEvents||[];
    if(!upcoming.some(event=>eventMatchesAnyTime(event,drawerFilters.times))) return false;
  }
  if(drawerFilters.tags.length){
    const upcoming=p.upcomingEvents||[];
    if(!upcoming.some(event=>eventMatchesTags(event as never,drawerFilters.tags))) return false;
  }
  return true;
};
 const matches=(p:Business)=>textMatch(p)&&(!filter||inFilter(p,filter))&&matchesDrawer(p);
 const shown=places.filter(matches),saved=places.filter(p=>p.isFollowing);
 const railItems=(f:string)=>places.filter(p=>textMatch(p)&&inFilter(p,f)&&matchesDrawer(p));
 const nextUpcoming=(p:Business)=>(p.upcomingEvents||[]).filter(e=>Date.parse(e.dateEnd||e.dateStart)>=Date.now()).sort((a,b)=>Date.parse(a.dateStart)-Date.parse(b.dateStart))[0];
 const drawerEvents=places.filter(p=>!drawerFilters.categories.length||placeMatchesCategories(p,drawerFilters.categories)).flatMap(p=>p.upcomingEvents||[]).filter((e,i,all)=>all.findIndex(x=>x.id===e.id)===i);
 const upcomingSaved=saved.flatMap(p=>{const next=nextUpcoming(p);return next?[{p,next}]:[];}).sort((a,b)=>Date.parse(a.next.dateStart)-Date.parse(b.next.dateStart));
 const card=(p:Business,size:'wide'|'small'|'square')=><LockedCardSlot key={p.id} size={size}><NativePlacezFace place={p} size={size} onOpen={()=>setActive(p)} onRequireAuth={()=>setAuth(true)}/></LockedCardSlot>;
 return <main className="pl-page pl-native pl-production room-shader-page"><RoomBackground room="placez"/><header className="pl-hero pl-centered-hero"><h1 className="sr-only">Our PlaceZ. Your city. Your people.</h1><img className="pl-centered-hero__art" src="/brand/family/our-placez.svg" alt="Our PlaceZ" width={1672} height={941} fetchPriority="high" decoding="async"/><PlacesPageSwitch active="placez"/></header><div className="pl-body"><form className="pl-search" role="search" onSubmit={e=>{e.preventDefault();resultHeading.current?.focus();}}><Search size={24}/><input aria-label="Search PlaceZ" placeholder="Search PlaceZ" value={query} onChange={e=>setQuery(e.target.value)}/><button type="submit" aria-label="Show matching places"><ArrowRight size={24}/></button></form><div className="pl-filters">{FILTERS.map(g=><button key={g.id} style={{'--category':g.color} as CSSProperties} aria-pressed={filter===g.id} onClick={()=>setFilter(filter===g.id?'':g.id)}><g.Icon size={29}/><span><b>{g.name}</b></span></button>)}</div>
 {result.isLoading&&<p role="status">Loading your places…</p>}{result.isError&&<p role="alert">Places could not load. <button onClick={()=>result.refetch()}>Try again</button></p>}
 <section className="pl-discover"><div className="pl-section-title"><h2 ref={resultHeading} tabIndex={-1}>DISCOVER <i>///</i></h2><span/><div><button aria-label="Previous places" onClick={()=>rail.current?.scrollBy({left:-376,behavior:'smooth'})}>←</button><button aria-label="Next places" onClick={()=>rail.current?.scrollBy({left:376,behavior:'smooth'})}>→</button></div></div><div className="pl-wide-rail" ref={rail} tabIndex={0} aria-label="PlaceZ wide cards, swipe left for next">{[...shown].sort((a,b)=>(DISCOVER_ORDER.includes(a.id)?DISCOVER_ORDER.indexOf(a.id):999)-(DISCOVER_ORDER.includes(b.id)?DISCOVER_ORDER.indexOf(b.id):999)).slice(0,5).map(p=><div className="pl-wide-slot" key={p.id}>{card(p,'wide')}</div>)}</div>{result.isSuccess&&!shown.length&&<p className="pl-empty">No places match these filters.</p>}</section>
 <div className="pl-content-switch"><div className="pl-content-tabs" role="tablist" aria-label="Choose PlaceZ content">{[['places','PLACEZ'],['board','BOARDZ POSTS']].map(([id,label],i)=><button key={id} role="tab" id={`pl-tab-${id}`} aria-selected={tab===id} aria-controls={`pl-panel-${id}`} tabIndex={tab===id?0:-1} onClick={()=>setTab(id)} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'places':e.key==='End'?'board':i?'places':'board';setTab(next);document.getElementById(`pl-tab-${next}`)?.focus();}}}>{label}</button>)}</div></div>
 {tab==='board'?<div id="pl-panel-board" role="tabpanel" aria-labelledby="pl-tab-board"><PlacezBoardFeed onRequireAuth={()=>setAuth(true)}/></div>:<div id="pl-panel-places" role="tabpanel" aria-labelledby="pl-tab-places"><section className="pl-browse"><div className="pl-section-title"><h2>IN YOUR CITY <i>///</i></h2></div>{filter?(()=>{const g=FILTERS.find(f=>f.id===filter)!;return <><RailHeader name={g.name} color={g.color} count={shown.length} action="Show all" onFilter={()=>setFilter('')}/><CardBrowse items={shown} scope={JSON.stringify([query,filter])} label="PlaceZ" renderCard={card}/> size={cardSize} onSizeChange={setCardSize}</>;})():<div className="pz-rails">{FILTERS.map(g=>{const items=railItems(g.id);return items.length?<section key={g.id} aria-label={g.name}><RailHeader name={g.name} color={g.color} count={items.length} onFilter={()=>setFilter(g.id)}/><SmallRail label={`${g.name} places`}>{items.map(p=>card(p,'small'))}</SmallRail></section>:null;})}{result.isSuccess&&!FILTERS.some(g=>railItems(g.id).length)&&<p className="pl-empty">No places match these filters.</p>}</div>}</section></div>}
 <footer className="pl-footer"><small className="pl-az-link"><a href="/directory/a-z">Every place, A–Z</a> · </small><small className="pl-photo-credit">Skyline: <a href="https://commons.wikimedia.org/wiki/File:Portland_Skyline_glow_July_2017_pan_-_Oregon.jpg">M.O. Stevens (2017)</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. Modified: Xerox/blueprint treatment, also CC BY-SA 4.0.</small></footer></div><PlacezDrawer accent="var(--neon-cyan)" top={<DrawerTop events={drawerEvents} selectedDate={selectedDate} onSelectDate={date=>setSelectedDate(date||null)} filters={drawerFilters} onFiltersChange={setDrawerFilters}/>} filters={<CardSizeSlider value={cardSize} onChange={setCardSize} accent="var(--text-hi)"/>} upcoming={upcomingSaved.length?<div className="pz-drawer-rail">{upcomingSaved.map(({p})=><div className="pz-drawer-bare" key={p.id}>{card(p,'wide')}</div>)}</div>:<p className="pz-drawer-empty">Nothing coming up at your saved places yet.</p>} saved={saved.length?<div className="pz-drawer-saved">{FILTERS.filter(g=>saved.some(p=>group(p)===g.id)).map(g=><div className="pz-drawer-saved__group" key={g.id} style={{'--category':g.color} as CSSProperties}><h4>{g.name}</h4><div className="pz-drawer-saved__cards">{saved.filter(p=>group(p)===g.id).map(p=>card(p,'small'))}</div></div>)}</div>:<p className="pz-drawer-empty">Use a card's heart to follow your places.</p>}/>{active&&<PlaceModal place={detail.data?.id===active.id?detail.data:active} onClose={()=>setActive(null)} onRequireAuth={()=>setAuth(true)}/>}{auth&&<AuthModal portalTargetSelector=".placez-fullscreen[open]" onClose={()=>setAuth(false)} defaultTab="register"/>}</main>;
}

