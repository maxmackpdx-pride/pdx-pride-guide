import { useState } from "react";
import { OpenCardMeta, PausedCard } from "./react19Card";
import { CARD_SLOT_EVENT, openCardTransition } from "./react19CardModel";
import PlaceDiscoveryCard from "../discovery/PlaceDiscoveryCard";
import PlaceModal from "../PlaceModal";
import TodayLocationCard from '../home/TodayLocationCard';
import type { Business } from '@/pages/Directory';
import { placePath } from '@shared/placeSlug';
import type { CardSize } from './cardLayout';
/** Complete Placez card: size changes the face, not the saved place or native tools. */
export function PlaceCard({place,size='tall',onRequireAuth}:{place:Business;size?:CardSize;onRequireAuth?:()=>void}) {
 "use memo";
 const [open,setOpen]=useState(false);
 if(size==='small')return <><PlaceDiscoveryCard place={place} size="small" onOpen={(element)=>{const slot=element.closest<HTMLElement>("[data-card-morph]")||element;openCardTransition(()=>{slot.dispatchEvent(new CustomEvent(CARD_SLOT_EVENT,{detail:"open"}));setOpen(true);});}} onRequireAuth={onRequireAuth}/>{open&&<OpenCardMeta title={place.name} description={place.neighborhood||place.address||""}/>}<PausedCard open={open}><PlaceModal documentMeta={false} place={place} onClose={()=>setOpen(false)} onRequireAuth={onRequireAuth||(()=>{})}/></PausedCard></>;
 return <TodayLocationCard size={size} location={{key:`place:${place.id}`,name:place.name,room:'Placez',detail:place.neighborhood || place.address || '',href:placePath(place.id,place.name),place}} onRequireAuth={onRequireAuth}/>;
}
