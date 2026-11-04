/** Production Places faces, not reconstructed artwork. All API traffic is isolated by the runner. */
import React from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@/lib/queryClient';
import {AuthProvider} from '@/context/AuthContext';
import {ThemeProvider} from '@/context/ThemeContext';
import PlaceDiscoveryCard from '@/components/discovery/PlaceDiscoveryCard';
import TodayLocationCard from '@/components/home/TodayLocationCard';
import type {CardSize} from '@/components/cards/CardAPI';
import '@/index.css';
import '@/components/ds/tokens/index.css';
import '@/components/ds/styles.css';
import '@/components/cards/CardAPI.css';
import '@/components/cards/CategoryCardAPI.css';

const query = new URLSearchParams(location.search);
const size = (query.get('size') || 'tall') as CardSize;
const family = query.get('family') || 'discovery';
const place = {id:89001,name:size==='wide'?'Badlands':size==='tall'?'Camp Bar':'QA Place artwork',type:'bar',description:'Isolated browser regression fixture',neighborhood:'Portland',events:[],pastEvents:[],gigs:[],imageUrl:null,isFollowing:false};
const width = size === 'wide' ? 360 : size === 'small' ? 136 : 200;
createRoot(document.getElementById('root')!).render(
 <QueryClientProvider client={queryClient}><AuthProvider><ThemeProvider>
  <h1>Places artwork: {family}, {size}</h1>
  <main id="qa-card" style={{width}}>
   {family === 'discovery' ? <PlaceDiscoveryCard size={size} place={place as any} onOpen={()=>{}} /> :
    <TodayLocationCard size={size} location={{key:'place:89001',name:place.name,room:'Placez',detail:'Portland',href:'/directory',place:place as any}} />}
  </main>
 </ThemeProvider></AuthProvider></QueryClientProvider>
);
