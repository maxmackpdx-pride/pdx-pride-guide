import {useEffect,useRef,useState} from 'react';
import type {OutzPhotoData} from './OutzPhoto';
export type OutzDestinationCardData={id:string;name:string;kind:string;region?:string;state?:string;photo?:OutzPhotoData;art?:string;routeMatch?:boolean;routeMiles?:number};
type Engine={mountOutzWideCard:(host:HTMLElement,place:OutzDestinationCardData,options:{variant:string;onOpen:()=>void})=>()=>void};
let engine:Promise<Engine>|undefined;
function load(){return engine??=new Promise<Engine>((resolve,reject)=>{for(const href of ['destination-photos.css','blend-art.css','outz-wide-card.css']){if(!document.querySelector(`link[data-outz-shared="${href}"]`)){const l=document.createElement('link');l.rel='stylesheet';l.href='/outzide-map/assets/'+href;l.dataset.outzShared=href;document.head.append(l);}}const script=document.createElement('script');script.type='module';script.src='/outzide-map/assets/outz-wide-card.js';script.onload=()=>resolve((window as unknown as Window&{__outzWideCard:Engine}).__outzWideCard);script.onerror=()=>{engine=undefined;reject(Error('Destination card unavailable'));};document.head.append(script);});}
/** The complete map object, including art, title, labels, waypoint and open action. No map/iframe boots here. */
export default function OutzWideCard({place,variant='wide',onOpen}:{place:OutzDestinationCardData;variant?:'wide'|'compressed';onOpen?:()=>void}){
 const ref=useRef<HTMLDivElement>(null),action=useRef(onOpen);action.current=onOpen;const [error,setError]=useState(false);
 useEffect(()=>{let disposed=false,off:(()=>void)|undefined;load().then(m=>{if(disposed||!ref.current)return;off=m.mountOutzWideCard(ref.current,place,{variant,onOpen:()=>action.current? action.current():window.location.assign(`/outzide?place=${encodeURIComponent(place.id)}`)});}).catch(()=>setError(true));return()=>{disposed=true;off?.();};},[place,variant]);
 return <div className="outz-wide-card-host" ref={ref}>{error?<a href={`/outzide?place=${encodeURIComponent(place.id)}`}>Open {place.name}</a>:<span role="status">{place.name}</span>}</div>;
}
