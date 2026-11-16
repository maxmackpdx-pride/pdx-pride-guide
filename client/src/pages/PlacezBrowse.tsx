import CardBrowse from '@/components/places/CardBrowse';
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
import '@/components/places/PlacezLanding.css';
import '@/components/places/PlacezReferenceHeader.css';
const FILTERS=[{id:'coffee',name:'Coffee & conversation',color:'#2BFF00',Icon:Coffee},{id:'food',name:'Something good to eat',color:'#FF7B00',Icon:Utensils},{id:'night',name:'A night out',color:'#FF1FA0',Icon:Wine},{id:'different',name:'Something different',color:'#00FFFF',Icon:Compass},{id:'adult',name:'Adult',color:'#7B00FF',Icon:Flame}];
const group=(p:Business)=>p.type==='cafe'?'coffee':p.type==='restaurant'?'food':['bar','venue'].includes(p.type)?'night':'different';
const DISCOVER_ORDER=[5,30,2,3,31,23,9];
const adult=(p:Business)=>/\b(adult|21\+|strip|sex club)\b/i.test(`${p.description} ${p.name}`);
export default function PlacezBrowse(){
 "use memo";
 const rail=useRef<HTMLDivElement>(null);const [query,setQuery]=useState(''),[filter,setFilter]=useState(''),[stack,setStack]=useState(''),[tab,setTab]=useState('places'),[auth,setAuth]=useState(false),[active,setActive]=useState<Business|null>(null);
 const result=useQuery<Business[]>({queryKey:['/api/directory'],queryFn:()=>apiRequest('GET','/api/directory').then(r=>r.json()),staleTime:60000,refetchOnMount:'always'});
 const detail=useQuery<Business>({queryKey:['/api/directory',active?.id],queryFn:()=>apiRequest('GET',`/api/directory/${active!.id}`).then(r=>r.json()),enabled:!!active,staleTime:30000});
 const places=(result.data||[]).filter(p=>isPlacezType(p.type)&&p.type!=='campground'&&!directoryResourceName(p));
 const matches=(p:Business)=>(!query||`${p.name} ${p.description} ${p.neighborhood}`.toLowerCase().includes(query.toLowerCase()))&&(!filter||(filter==='adult'?adult(p):group(p)===filter));
 const shown=places.filter(matches),saved=places.filter(p=>p.isFollowing);
 const card=(p:Business,size:'wide'|'small'|'square')=><LockedCardSlot key={p.id} size={size}><NativePlacezFace place={p} size={size} onOpen={()=>setActive(p)} onRequireAuth={()=>setAuth(true)}/></LockedCardSlot>;
 return <main className="pl-page pl-native pl-production"><header className="pl-hero pl-centered-hero"><h1 className="sr-only">Our PlaceZ. Your city. Your people.</h1><img className="pl-centered-hero__art" src="/placez-page/placez-centered-zine.webp" alt="Portland waterfront in torn Xerox collage, centered Our PlaceZ logo, and a full-spectrum rainbow route. Your city. Your people." width={1672} height={941} fetchPriority="high" decoding="async"/><PlacesPageSwitch active="placez"/></header><div className="pl-body"><label className="pl-search"><Search size={23}/><input aria-label="Search PlaceZ" placeholder="Search PlaceZ" value={query} onChange={e=>setQuery(e.target.value)}/><ArrowRight size={23}/></label><div className="pl-filters">{FILTERS.map(g=><button key={g.id} style={{'--category':g.color} as CSSProperties} aria-pressed={filter===g.id} onClick={()=>setFilter(filter===g.id?'':g.id)}><g.Icon size={29}/><span><b>{g.name}</b></span></button>)}</div>
 {result.isLoading&&<p role="status">Loading your places…</p>}{result.isError&&<p role="alert">Places could not load. <button onClick={()=>result.refetch()}>Try again</button></p>}
 <section className="pl-discover"><div className="pl-section-title"><h2>DISCOVER <i>///</i></h2><span/><div><button aria-label="Previous places" onClick={()=>rail.current?.scrollBy({left:-376,behavior:'smooth'})}>←</button><button aria-label="Next places" onClick={()=>rail.current?.scrollBy({left:376,behavior:'smooth'})}>→</button></div></div><div className="pl-wide-rail" ref={rail} tabIndex={0} aria-label="PlaceZ wide cards, swipe left for next">{[...shown].sort((a,b)=>(DISCOVER_ORDER.includes(a.id)?DISCOVER_ORDER.indexOf(a.id):999)-(DISCOVER_ORDER.includes(b.id)?DISCOVER_ORDER.indexOf(b.id):999)).slice(0,5).map(p=><div className="pl-wide-slot" key={p.id}>{card(p,'wide')}</div>)}</div>{!result.isLoading&&!shown.length&&<p className="pl-empty">No places match these filters.</p>}</section>
 <div className="pl-content-switch"><div className="pl-content-tabs" role="tablist" aria-label="Choose PlaceZ content">{[['places','PLACEZ'],['board','BOARDZ POSTS']].map(([id,label],i)=><button key={id} role="tab" id={`pl-tab-${id}`} aria-selected={tab===id} aria-controls={`pl-panel-${id}`} tabIndex={tab===id?0:-1} onClick={()=>setTab(id)} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'places':e.key==='End'?'board':i?'places':'board';setTab(next);document.getElementById(`pl-tab-${next}`)?.focus();}}}>{label}</button>)}</div></div>
 {tab==='board'?<div id="pl-panel-board" role="tabpanel" aria-labelledby="pl-tab-board"><PlacezBoardFeed onRequireAuth={()=>setAuth(true)}/></div>:<div id="pl-panel-places" role="tabpanel" aria-labelledby="pl-tab-places"><section className="pl-saved"><div className="pl-section-title"><h2>SAVED & FOLLOWED <i>///</i></h2></div>{saved.length?<><div className="pl-stacks">{FILTERS.filter(g=>saved.some(p=>group(p)===g.id)).map(g=><button key={g.id} style={{'--category':g.color} as CSSProperties} onClick={()=>setStack(stack===g.id?'':g.id)} aria-expanded={stack===g.id}><g.Icon size={40}/><b>{g.name}</b><small>{saved.filter(p=>group(p)===g.id).length} saved</small></button>)}</div><CardBrowse items={saved.filter(p=>!stack||group(p)===stack)} scope={stack} label="Saved PlaceZ" renderCard={card}/></>:<p className="pl-empty"><Heart size={19}/> Use a card’s heart to follow your places.</p>}</section><section className="pl-browse"><div className="pl-section-title"><h2>IN YOUR CITY <i>///</i></h2></div><CardBrowse items={shown} scope={JSON.stringify([query,filter])} label="PlaceZ" renderCard={card}/></section></div>}
 <footer className="pl-footer"><small className="pl-photo-credit">Skyline: <a href="https://commons.wikimedia.org/wiki/File:Portland_Skyline_glow_July_2017_pan_-_Oregon.jpg">M.O. Stevens (2017)</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. Modified: Xerox/blueprint treatment, also CC BY-SA 4.0.</small></footer></div>{active&&<PlaceModal place={detail.data?.id===active.id?detail.data:active} onClose={()=>setActive(null)} onRequireAuth={()=>setAuth(true)}/>}{auth&&<AuthModal portalTargetSelector=".placez-fullscreen[open]" onClose={()=>setAuth(false)} defaultTab="register"/>}</main>;
}

