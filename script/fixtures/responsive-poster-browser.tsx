/** Local fixture: actual Home cards, EventModal and fallback callback; no production writes. */
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClientProvider, onlineManager} from '@tanstack/react-query';
import {queryClient} from '@/lib/queryClient';
import {AuthProvider} from '@/context/AuthContext';
import {ThemeProvider} from '@/context/ThemeContext';
import TonightEventCard from '@/components/home/TonightEventCard';
import EventModal from '@/components/EventModal';
import EventFlyerArt from '@/components/events/EventFlyerArt';
import '@/index.css';
import '@/components/cards/CardAPI.css';
import '@/components/ds/tokens/index.css';
import '@/components/ds/styles.css';
const query=new URLSearchParams(location.search);
if(query.has('offline')) onlineManager.setOnline(false);
const source=query.get('source')||'/event-posters/audit-2026-09-28/steam-events-3.png';
const initial = (window as any).__POSTER_MANIFEST__;
if (initial) queryClient.setQueryData(['/api/poster-variants'], initial);
const event={id:990001,title:'Responsive poster QA',venueName:'QA venue',dateStart:'2026-12-04T20:00:00-08:00',dateEnd:'2026-12-04T23:00:00-08:00',dayOfWeek:'Friday',admission:'FREE',ageRequirement:'21_PLUS',description:'Local fixture; no writes',eventTypes:'[]',status:'LIVE',isPublic:true,isPrivate:false,posterImageUrl:source+(query.has('original')?'?qa-original=1':'')} as any;
function FallbackFixture(){const [terminal,setTerminal]=useState(0);return <><div id="qa-fallback" style={{width:200,height:260}}><EventFlyerArt src={source} day="Friday" backdrop={false} sizes="200px" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={()=>setTerminal(n=>n+1)}/></div><output id="qa-terminal-errors">{terminal}</output></>}
function Fixture(){const [open,setOpen]=useState(false);return <><div id="qa-card"><TonightEventCard listing={event} rsvped={false} onToggleRsvp={()=>{}} onOpen={()=>setOpen(true)}/></div><div id="qa-row"><TonightEventCard listing={event} layout="row" rsvped={false} onToggleRsvp={()=>{}} onOpen={()=>setOpen(true)}/></div><button id="qa-open" onClick={()=>setOpen(true)}>Open details</button>{open&&<EventModal event={event} onClose={()=>setOpen(false)}/>}</>}
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={queryClient}><AuthProvider><ThemeProvider>{query.has('fallback')?<FallbackFixture/>:<Fixture/>}</ThemeProvider></AuthProvider></QueryClientProvider>);
