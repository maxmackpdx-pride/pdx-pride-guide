import {useEffect,useState,type CSSProperties,type ReactNode} from 'react';
import {Link} from 'wouter';
import {useTheme} from '@/context/ThemeContext';
import type {Business} from '@/pages/Directory';
import {Artwork} from './PlacezQuickCard';
import ExpandedPager from './ExpandedPager';
import {useArtworkMotion} from './artworkMotion';
import {nativePlacezModel,selectedPlacezPage} from './nativeModel';
import './nativePlacez.css';
import './NativePlacezExpanded.css';
import {useNativePlacezData,useNearbyPlacezRestaurants} from './nativeData';
import SevenDayEvents from './SevenDayEvents';
import PlaceLocation from './PlaceLocation';

type Props = {
  place:Business; contacts:ReactNode; info:ReactNode; feed:ReactNode; events:ReactNode;
  maps:ReactNode; people:ReactNode; follow:ReactNode;
  onClose:()=>void; onShare:()=>void; sharing:boolean; onPageChange:(page:number)=>void;
};
/** Presentation only: PlaceModal retains every operation and its permission checks. */
export default function NativePlacezExpanded({place,contacts,info,feed,events,maps,people,follow,onClose,onShare,sharing,onPageChange}:Props){
  const {calmMode}=useTheme();
  const artworkRef=useArtworkMotion(!calmMode);
  const [selection,setSelection]=useState(()=>selectedPlacezPage(place.id));
  useEffect(()=>{
    // Activity/PausedCard restarts effects on reveal. Re-read even if the open
    // request occurred while this preserved instance was hidden.
    const sync=()=>setSelection(selectedPlacezPage(place.id));
    const receive=(event:Event)=>{if((event as CustomEvent<{id:number}>).detail.id===place.id)sync();};
    sync();window.addEventListener('placez:open-page',receive);
    return()=>window.removeEventListener('placez:open-page',receive);
  },[place.id]);
  const live=useNativePlacezData(place);
  const nearby=useNearbyPlacezRestaurants(place);
  const model=nativePlacezModel(place);
  return <article ref={artworkRef} className="pdx-glass-rebind pz-card pz-card--expanded pz-native-expanded" data-calm={calmMode?'true':'false'} data-motion="paused" style={{'--pz-accent':model.accent,'--c':model.accent,'--_c':model.accent,'--event-accent':model.accent,backgroundImage:model.glassUrl('expanded')?`url("${model.glassUrl('expanded')}")`:undefined} as CSSProperties}>
    <Artwork model={model} wide={false}/>
    <button type="button" className="pz-close" aria-label={`Close ${place.name}`} onClick={onClose}><span aria-hidden="true">×</span></button>
    <button type="button" className="pz-share" aria-label={`Share ${place.name}`} onClick={onShare} disabled={sharing}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="6" cy="12" r="3"/><circle cx="18" cy="5" r="3"/><circle cx="18" cy="19" r="3"/><path d="m9 10 6-4M9 14l6 4"/></svg></button>
    <header className="pz-native-header">
      <h2>{place.name}</h2><span className="pz-category">{model.category}</span>
    </header>
    <ExpandedPager motion={!calmMode} initialPage={selection.page} resetKey={selection.request} onPageChange={onPageChange} pages={[
      <div key="feed" className="pz-native-page">{feed}<section><h3>Venue news</h3><p>Public venue news is unavailable.</p></section></div>,
      <div key="info" className="pz-native-page">{contacts}<Link className="pz-native-compose" href={model.composeHref} onClick={onClose}>Post a MIZZED CONNECTION <span aria-hidden="true">↗</span></Link>{info}{place.id===23&&<p className="pz-native-credit">Artwork adapted from <a href="https://commons.wikimedia.org/wiki/File:Pizza_Thief,_Portland,_Oregon,_2022_-_6.jpg" target="_blank" rel="noopener noreferrer">Another Believer’s January 31, 2022 photograph</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>. Generated interpretation; signs and interior details were redrawn.</p>}</div>,
      <div key="events" className="pz-native-page"><SevenDayEvents feed={live.calendarFeed} venueId={place.id}/>{events}<section><h3>Current and upcoming talent</h3><p>Public event-to-talent profiles are unavailable.</p></section><PlaceLocation mode="nearby" model={model} restaurants={nearby}/></div>,
      <div key="maps" className="pz-native-page">{maps}</div>,
      <div key="people" className="pz-native-page">{people}</div>
    ]}/>
    <footer className="pz-native-footer"><span>Save this place</span></footer>
    <div className="pz-heart" data-corner-control="heart" onClick={event=>event.stopPropagation()}>{follow}</div>
  </article>;
}

