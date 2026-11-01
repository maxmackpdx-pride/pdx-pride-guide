/** Browser-only fixture importing production cards. No API writes are sent. */
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@/lib/queryClient';
import {AuthProvider} from '@/context/AuthContext';
import {ThemeProvider} from '@/context/ThemeContext';
import EventModal from '@/components/EventModal';
import {ZaylistCard} from '@/components/cards/ZaylistCard';
const destinationData=await fetch('/outzide-map/places.json').then(response=>response.json());
import {RESOURCE_CATEGORIES} from '@/lib/resourcesData';
import {CardDetails} from '@/components/cards/CardAPI';
import '@/components/cards/CategoryCardAPI.css';
import '@/index.css';
import '@/pages/Events.css';
import '@/components/ds/tokens/index.css';
import '@/components/ds/styles.css';

const query = new URLSearchParams(location.search);
const family = query.get('family') || 'outz';
const size = query.get('size') || 'tall';
const layout = query.get('layout') || 'grid';
const width = size === 'small' ? 136 : size === 'wide' ? 360 : 200;
const places = ['rooster-rock','silver-falls','bc-garibaldi','memaloose','cape-lookout','sauvie-island'];
const events = places.map((_,i)=>({id:90000+i,title:`QA Event ${i+1}`,venueName:'QA venue',neighborhood:'Portland',dateStart:'2026-12-04T20:00:00-08:00',dateEnd:'2026-12-04T23:00:00-08:00',dayOfWeek:'Friday',admission:'FREE',ageRequirement:'21_PLUS',description:'Browser regression fixture',eventType:'PARTY',status:'LIVE'} as any));
function Fixture(){
 const [selected,setSelected] = useState<any>(null);
 const [detail,setDetail] = useState<string|null>(null);
 const [saved,setSaved] = useState<number[]>([]);
 const save=(id:number)=>setSaved(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
 return <><h1>Production card layout regression</h1><div id="qa-grid" style={{display:layout.startsWith('flex')?'flex':'grid',flexWrap:'wrap',gridTemplateColumns:layout==='fluid'?`repeat(3,minmax(${width}px,1fr))`:`repeat(3, ${width}px)`,gap:24,alignItems:'start',justifyContent:'start',width:layout==='fluid'?1100:width*3+48,maxWidth:'100%',position:'relative','--qa-card-width':`${width}px`} as React.CSSProperties}>
 {places.map((id,i)=>{
  const destination=destinationData.places.find((p:any)=>p.id===id);
  const item = {photo:destination?.photo,art:destination?.art,key:`outz:${id}`,name:destination?.name||`QA Destination ${i+1}`,room:family==='place'?'Placez':'OutZide',detail:destination?.region||'Portland region',href:`/outzide?place=${id}`,kind:destination?.kind||'beach',place:family==='place'?{id:80000+i,name:`QA Place ${i+1}`,type:'bar',description:'Browser regression fixture',neighborhood:'Portland',events:[],pastEvents:[],gigs:[]}:undefined} as any;
  if(family==='board')return <ZaylistCard category="boardz" size={size as any} key={id} style={layout==='flex-rotated'?{rotate:`${i%2?2:-2}deg`,translate:`0 ${i%3*4}px`}:undefined} post={{key:`giftz:${i}`,id:i+1,category:'giftz',intent:'giving',title:`QA Gift ${i+1}`,description:'Production board fixture',area:'Portland',value:'Free',detail:'Pick up',createdAt:'2026-11-01T00:00:00Z'}} small={size==='small'} isSaved={saved.includes(i+1)} onSave={()=>save(i+1)} onOpen={()=>setDetail(`QA Gift ${i+1}`)}/>;
  if(family==='needz')return <ZaylistCard category="needz" size={size as any} row={{category:RESOURCE_CATEGORIES[0],org:{name:`QA Resource ${i+1}`,scope:'Portland',desc:'Production resource fixture'}}} onOpen={row=>setDetail(row.org.name)} key={id}/>;
  if(family==='outz')return <ZaylistCard category="outzide" key={id} location={item} size={size as any}/>;
  if(family==='event')return <ZaylistCard category="eventz" key={id} size={size as any} listing={events[i]} rsvped={saved.includes(events[i].id)} onToggleRsvp={save} onOpen={setSelected}/>;
  return <ZaylistCard category="placez" key={id} size={size as any} place={item.place}/>;
 })}</div>{detail&&<CardDetails key={detail} onClose={()=>setDetail(null)}><section style={{minHeight:500,padding:20,boxSizing:'border-box'}}><button aria-label="Close fixture" onClick={()=>setDetail(null)}>Close</button><h2>{detail}</h2><p>Host-only detail fixture. Category internals are tested on their page routes.</p></section></CardDetails>}{selected&&<EventModal event={selected} onClose={()=>setSelected(null)}/>}<output id="qa-saved-count">{saved.length}</output></>;
}
const app = (<QueryClientProvider client={queryClient}><AuthProvider><ThemeProvider><Fixture/></ThemeProvider></AuthProvider></QueryClientProvider>);
createRoot(document.getElementById('root')!).render(query.get('strict')==='1'?<React.StrictMode>{app}</React.StrictMode>:app);
