/** Fixed six-ID cohort; uncompiled parent, no production records or API writes. */
import React,{Profiler,useState,type ProfilerOnRenderCallback} from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@/lib/queryClient';
import {AuthProvider} from '@/context/AuthContext';
import {ThemeProvider} from '@/context/ThemeContext';
import {PlaceCard} from '@/components/cards/PlaceCard';
import type {Business} from '@/pages/Directory';
import type {CardSize} from '@/components/cards/CardAPI';
import './placez-production.css';
import '@/components/ds/tokens/index.css';
import '@/components/ds/styles.css';
import '@/components/cards/CardAPI.css';
import '@/components/cards/CategoryCardAPI.css';
document.documentElement.dataset.zaylistCards='fluent2-m3';
const names=['Holocene','Stag PDX','Alberta Rose Theatre','Eagle Portland','Darcelle XV','Pizza Thief'];
const records=[30,3,31,5,2,23].map((id,index)=>({id,name:names[index],type:id===23?'restaurant':id===3||id===5?'bar':'venue',description:'Isolated compiler comparison',address:'Portland, Oregon',neighborhood:'Portland',phone:'503-555-0100',website:null,instagram:null,donateUrl:null,hours:'Fixture hours',queerOwned:false,queerFriendly:true,imageUrl:null,lat:45.52,lng:-122.67,isNew:false,isFollowing:false,upcomingEvents:[],pastEvents:[],gigs:[],spotted:[],promoters:[]} as Business));
type DetailReadiness={id:number;status:string;fetchStatus:string;dataUpdatedAt:number;dataId:number|null;hasVerifiedEmptyCounts:boolean};
declare global {interface Window {__placezProfile:{phase:string;actualDurationMs:number;tick:number}[];__placezDetailReadiness:()=>DetailReadiness[]}}
// Read-only handshake: does not prime the cache, create observers or cause parent renders.
window.__placezDetailReadiness=()=>records.map(place=>{
 const state=queryClient.getQueryState<Business>(['/api/directory',place.id]);
 return {id:place.id,status:state?.status??'missing',fetchStatus:state?.fetchStatus??'missing',dataUpdatedAt:state?.dataUpdatedAt??0,dataId:state?.data?.id??null,hasVerifiedEmptyCounts:Array.isArray(state?.data?.gigs)&&state.data.gigs.length===0&&Array.isArray(state?.data?.spotted)&&state.data.spotted.length===0};
});
window.__placezProfile=[];
const size=(new URLSearchParams(location.search).get('size')||'small') as CardSize;
function Fixture(){
 const [tick,setTick]=useState(0);
 const record:ProfilerOnRenderCallback=(_id,phase,actualDuration)=>window.__placezProfile.push({phase,actualDurationMs:actualDuration,tick});
 return <><button id="profile-tick" onClick={()=>setTick(value=>value+1)}>Parent update</button><output id="tick">{tick}</output><Profiler id="six-native-placez" onRender={record}><main id="compiler-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,max-content)',gap:16}}>{records.map(place=><div data-fixture-id={place.id} key={place.id}><PlaceCard place={place} size={size}/></div>)}</main></Profiler></>;
}
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={queryClient}><AuthProvider><ThemeProvider><Fixture/></ThemeProvider></AuthProvider></QueryClientProvider>);
