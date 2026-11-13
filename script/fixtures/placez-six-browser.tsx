/** Isolated test records, never imported by production. API writes are blocked by runner. */
import React from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@/lib/queryClient';
import {AuthProvider,useAuth} from '@/context/AuthContext';
import {ThemeProvider} from '@/context/ThemeContext';
import Directory from '@/pages/Directory';
import {PlaceCard} from '@/components/cards/PlaceCard';
import PlacezQuickCard from '@/components/placez/PlacezQuickCard';
import {nativePlacezModel} from '@/components/placez/nativeModel';
import type {Business} from '@/pages/Directory';
import type {CardSize} from '@/components/cards/CardAPI';
import './placez-production.css';
import '@/components/ds/tokens/index.css';
import '@/components/ds/styles.css';
import '@/components/cards/CardAPI.css';
import '@/components/cards/CategoryCardAPI.css';
document.documentElement.dataset.zaylistCards='fluent2-m3';
const params=new URLSearchParams(location.search),id=Number(params.get('id')||30),size=params.get('size')||'tall';
const names:Record<number,string>={30:'Holocene',3:'Stag PDX',31:'Alberta Rose Theatre',5:'Eagle Portland',2:'Darcelle XV',23:'Pizza Thief',8:'Kann',9:'The Sports Bra'};
const place:Business={id,name:names[id]||'Other venue',type:[23,8,9].includes(id)?'restaurant':id===3||id===5?'bar':'venue',description:'Isolated native integration test. Real venue details are supplied by the unchanged directory API.',address:'Portland, Oregon',neighborhood:'Portland',phone:'503-555-0100',website:null,instagram:null,donateUrl:null,hours:'Hours supplied by venue',queerOwned:false,queerFriendly:true,imageUrl:null,lat:45.52,lng:-122.67,isNew:false,isFollowing:false,upcomingEvents:[],pastEvents:[],gigs:[],spotted:[],promoters:[]};
function AuthProbe(){const {user}=useAuth();return <output id="auth-probe">{user?'authenticated':'anonymous'}</output>;}
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={queryClient}><AuthProvider><ThemeProvider><AuthProbe/>{location.pathname.startsWith('/directory')?<Directory/>:<main id="qa-card"><button id="before">Before card</button><div id="card-stage">{size==='square'?<PlacezQuickCard model={nativePlacezModel(place)} size="square" motion={false} onOpen={()=>{}} heart={<button type="button" aria-label="Fixture heart">♡</button>}/>:<PlaceCard size={size as CardSize} place={place} onRequireAuth={()=>{document.getElementById('auth-status')!.textContent='Authentication requested';}}/>}</div><output id="auth-status"/><button id="after">After card</button></main>}</ThemeProvider></AuthProvider></QueryClientProvider>);

