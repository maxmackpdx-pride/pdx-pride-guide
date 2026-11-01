import { useState } from "react";
import PlaceDiscoveryCard from "../discovery/PlaceDiscoveryCard";
import PlaceModal from "../PlaceModal";
import TodayLocationCard from '../home/TodayLocationCard';
import type { Business } from '@/pages/Directory';
import { placePath } from '@shared/placeSlug';
import type { CardSize } from './cardLayout';
/** Complete Placez card: size changes the face, not the saved place or native tools. */
export function PlaceCard({place,size='tall',onRequireAuth}:{place:Business;size?:CardSize;onRequireAuth?:()=>void}) {
 const [open,setOpen]=useState(false);
 if(size==='small')return <><PlaceDiscoveryCard place={place} size="small" onOpen={()=>setOpen(true)} onRequireAuth={onRequireAuth}/>{open&&<PlaceModal place={place} onClose={()=>setOpen(false)} onRequireAuth={onRequireAuth||(()=>{})}/>}</>;
 return <TodayLocationCard size={size} location={{key:`place:${place.id}`,name:place.name,room:'Placez',detail:place.neighborhood || place.address || '',href:placePath(place.id,place.name),place}} onRequireAuth={onRequireAuth}/>;
}
