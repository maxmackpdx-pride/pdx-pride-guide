import {rememberCardOrigin} from "@/components/cards/CardAPI";
import {CardData, CardMorph, CardSkeleton, OpenCardMeta, PausedCard} from "@/components/cards/react19Card";
import {cardMorphName, cardResource, openCardTransition, preinitCardStyle, preloadCardImage, preloadCardModule} from "@/components/cards/react19CardModel";
import OutzCardModal from "@/components/home/OutzCardModal";
import {useEffect,useRef,useState} from 'react';
import type {OutzPhotoData} from './OutzPhoto';
export type OutzDestinationCardData={id:string;name:string;kind:string;region?:string;state?:string;photo?:OutzPhotoData;art?:string;routeMatch?:boolean;routeMiles?:number};
type Engine={mountOutzWideCard:(host:HTMLElement,place:OutzDestinationCardData,options:{variant:string;onOpen:()=>void})=>()=>void};
const WIDE_STYLES=['destination-photos.css','blend-art.css','outz-wide-card.css'];
const WIDE_SCRIPT='/outzide-map/assets/outz-wide-card.js';
let engine:Promise<Engine|null>|undefined;
function load(){
 return engine??=new Promise<Engine|null>((resolve)=>{
  for(const href of WIDE_STYLES)preinitCardStyle('/outzide-map/assets/'+href);
  const script=document.createElement('script');script.type='module';script.src=WIDE_SCRIPT;
  script.onload=()=>resolve((window as unknown as Window&{__outzWideCard?:Engine}).__outzWideCard??null);
  script.onerror=()=>{engine=undefined;resolve(null);};
  document.head.append(script);
 });
}
function wideEngine(){return cardResource('outz-wide-engine',()=>load());}
function photoSrc(photo?:OutzPhotoData){
 const src=photo?.src;
 if(!src)return null;
 if(src.startsWith('/'))return src;
 if(src.startsWith('assets/'))return `/outzide-map/${src}`;
 return null;
}
/** The complete map object, including art, title, labels, waypoint and open action. No map/iframe boots here. */
export default function OutzWideCard({place,variant='wide',onOpen,onRequireAuth}:{place:OutzDestinationCardData;variant?:'wide'|'compressed';onOpen?:()=>void;onRequireAuth?:()=>void}){
 const [open,setOpen]=useState(false);
 const size=variant==='compressed'?'small':'wide';
 preloadCardModule(WIDE_SCRIPT);
 for(const href of WIDE_STYLES)preinitCardStyle('/outzide-map/assets/'+href);
 preloadCardImage(photoSrc(place.photo),variant==='wide'?'high':'auto');
 const openDetail=(slot:HTMLElement|null)=>{
  if(onOpen){onOpen();return;}
  openCardTransition(()=>setOpen(true),slot);
 };
 return <>
  <CardData source={wideEngine()} fallback={<CardSkeleton size={size} label={place.name}/>}>
   {(mod)=>mod?<WideFace place={place} variant={variant} engine={mod} onOpen={openDetail}/>:<div data-card-size={size} data-card-category="outzide" className="outz-wide-card-host"><a href={`/outzide?place=${encodeURIComponent(place.id)}`}>Open {place.name}</a></div>}
  </CardData>
  {open&&<OpenCardMeta title={place.name} description={place.region||place.state||""}/>}
  <PausedCard open={open}><OutzCardModal documentMeta={false} location={{key:`outz:${place.id}`,name:place.name,kind:place.kind,room:"OutZide",detail:place.region||place.state||"",href:`/outzide?place=${encodeURIComponent(place.id)}`,photo:place.photo,art:place.art}} onClose={()=>setOpen(false)} onRequireAuth={onRequireAuth}/></PausedCard>
 </>;
}
function WideFace({place,variant,engine,onOpen}:{place:OutzDestinationCardData;variant:'wide'|'compressed';engine:Engine;onOpen:(slot:HTMLElement|null)=>void}){
 const ref=useRef<HTMLDivElement>(null);
 const action=useRef(onOpen);action.current=onOpen;
 useEffect(()=>{
  const host=ref.current;
  if(!host)return;
  return engine.mountOutzWideCard(host,place,{variant,onOpen:()=>action.current(host)});
 },[engine,place,variant]);
 return <CardMorph name={cardMorphName(["outz-wide",place.id,variant])}><div data-card-size={variant==="compressed"?"small":"wide"} data-card-category="outzide" onClickCapture={rememberCardOrigin} className="outz-wide-card-host" ref={ref}><span role="status">{place.name}</span></div></CardMorph>;
}
