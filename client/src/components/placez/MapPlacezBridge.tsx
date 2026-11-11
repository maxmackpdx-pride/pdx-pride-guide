import {useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {useTheme} from '@/context/ThemeContext';
import {CardHeartButton} from '@/components/CardHeartButton';
import {hasPlacezArtwork,nativePlacezModel,requestPlacezPage,selectedPlacezPage,type NativePlace} from './nativeModel';
import {useNativePlacezData,useNearbyPlacezRestaurants} from './nativeData';
import PlacezQuickCard from './PlacezQuickCard';
import './nativePlacez.css';
/** Matches the optional pinned-map DOM bridge; never pass React objects between bundles. */
export type MapPlacezRequest={place:Record<string,unknown>;size:'small'|'wide'|'tall';expanded:boolean;readOnly:true;mountMapTools?:(node:HTMLElement)=>()=>void;onOpen:()=>void;onClose:()=>void};
export type MapPlacezRenderer={canRender:(place:Record<string,unknown>)=>boolean;mount:(element:HTMLElement,request:MapPlacezRequest)=>()=>void};
export function canRenderMapPlacez(place:Record<string,unknown>){return Number.isSafeInteger(Number(place.id))&&hasPlacezArtwork(Number(place.id))&&typeof place.name==='string'&&typeof place.type==='string';}
function MapToolsSlot({mount}:{mount:(node:HTMLElement)=>()=>void}){
 const node=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(node.current)return mount(node.current);},[mount]);
 return <div ref={node} className="placez-map-tools"/>;
}
function MapPlacezPresentation({request}:{request:MapPlacezRequest}){
 const place={...request.place,id:Number(request.place.id)} as NativePlace;
 const {calmMode}=useTheme();const live=useNativePlacezData(place);const nearby=useNearbyPlacezRestaurants(live.place,request.expanded);
 const model=nativePlacezModel(live.place);
 return <div className="placez-map-host" data-placez-read-only="true" onClickCapture={event=>{
  // The standalone map remains read-only: composition/claim/save require native site entry.
  const anchor=(event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
  if(anchor?.getAttribute('href')?.startsWith('/mizzed/new')){event.preventDefault();event.stopPropagation();}
 }}><PlacezQuickCard model={model} size={request.expanded?'expanded':request.size==='wide'?'wide-map':request.size}
  readOnly motion={!calmMode} nextEvent={live.nextEvent} activity={live.activity} calendarFeed={live.calendarFeed} nearbyRestaurants={nearby}
  mapsContent={request.mountMapTools?<MapToolsSlot mount={request.mountMapTools}/>:undefined} activePosts={live.activePosts} people={live.people} initialExpandedPage={selectedPlacezPage(place.id).page}
  onOpen={(_element,page=1)=>{requestPlacezPage(place.id,page);request.onOpen();}} onClose={request.expanded?request.onClose:undefined}
  heart={<CardHeartButton active={Boolean(live.place.isFollowing)} disabled aria-label="Following is available on the native place page"/>}/></div>;
}
/** Portals retain host Query/Auth/Theme context; each external mount receives a disposal lease. */
export function useMapPlacezRenderer():{renderer:MapPlacezRenderer;portals:ReactNode}{
 const [mounts,setMounts]=useState<Array<{key:number;node:HTMLElement;request:MapPlacezRequest}>>([]);
 const renderer=useMemo<MapPlacezRenderer>(()=>{let sequence=0;return {canRender:canRenderMapPlacez,mount(node,request){
  const key=++sequence;setMounts(current=>[...current,{key,node,request}]);let disposed=false;
  return()=>{if(disposed)return;disposed=true;setMounts(current=>current.filter(item=>item.key!==key));};
 }};},[]);
 return {renderer,portals:mounts.map(item=>createPortal(<MapPlacezPresentation request={item.request}/>,item.node,String(item.key)))};
}
