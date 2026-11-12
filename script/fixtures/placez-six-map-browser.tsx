/** Isolated host + immutable map integration. Runner intercepts all API reads and blocks writes. */
import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@/lib/queryClient';
import {AuthProvider} from '@/context/AuthContext';
import {ThemeProvider} from '@/context/ThemeContext';
import {useMapPlacezRenderer} from '@/components/placez/MapPlacezBridge';
import release from '@shared/mapReleaseLock.json';
import './placez-production.css';
import '@/components/ds/tokens/index.css';
import '@/components/ds/styles.css';
import '@/components/cards/CardAPI.css';
import '@/components/cards/CategoryCardAPI.css';
document.documentElement.dataset.zaylistCards='fluent2-m3';
function Integration(){
 const node=useRef<HTMLDivElement>(null),{renderer,portals}=useMapPlacezRenderer();const [error,setError]=useState('');
 useEffect(()=>{let active=true,dispose:(()=>void)|undefined;
  const entry=release.base+release.entry;
  import(/* @vite-ignore */ entry).then(module=>{if(!active||!node.current)return;if('v'+module.MAP_RELEASE_VERSION!==release.tag)throw Error('Map bundle does not match pinned release');const [major,minor,patch]=String(module.MAP_RELEASE_VERSION).split('.').map(Number);if(!(major>1||(major===1&&(minor>0||patch>=21))))throw Error('Map release does not support PlaceZ integration');dispose=module.mount(node.current,{initialMode:'mapz',placezRenderer:renderer,assetBase:release.base,hostContract:'zaylist-map-host/v1',apiContract:'zaylist-map-api/v1'}).unmount;}).catch(e=>setError(String(e)));
  return()=>{active=false;dispose?.();};
 },[renderer]);
 return <><output id="map-fixture-error">{error}</output><button id="reopen-map-place" onClick={()=>{const url=new URL(location.href);url.searchParams.set('item','venue-'+(url.searchParams.get('id')||'30'));history.pushState({},'',url);dispatchEvent(new PopStateEvent('popstate'));}}>Reopen selected venue</button><div ref={node}/>{portals}</>;
}
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={queryClient}><AuthProvider><ThemeProvider><Integration/></ThemeProvider></AuthProvider></QueryClientProvider>);
