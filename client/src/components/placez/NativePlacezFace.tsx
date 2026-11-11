import {CardShell,type CardSize} from '@/components/cards/CardAPI';
import {CardMorph} from '@/components/cards/react19Card';
import {cardMorphName,CARD_SLOT_EVENT,openCardTransition} from '@/components/cards/react19CardModel';
import VenueFollowButton from '@/components/VenueFollowButton';
import {useTheme} from '@/context/ThemeContext';
import PlacezQuickCard from './PlacezQuickCard';
import {nativePlacezModel,requestPlacezPage,type NativePlace} from './nativeModel';
import './nativePlacez.css';
import {useNativePlacezData} from './nativeData';
/** Internal shared face. Public PlaceCard props and backend contracts are unchanged. */
export default function NativePlacezFace({place,size='tall',onOpen,onRequireAuth}:{
 place:NativePlace;size?:CardSize;onOpen:(element:HTMLElement)=>void;onRequireAuth?:()=>void;
}){
 const {calmMode}=useTheme();
 const live=useNativePlacezData(place);
 const model=nativePlacezModel(live.place);
 return <CardMorph name={cardMorphName(['placez-six',place.id,size])}><CardShell category="placez" size={size} className="placez-native-shell">
  <PlacezQuickCard model={model} size={size==='wide'?'wide-map':size} motion={!calmMode} nextEvent={live.nextEvent} activity={live.activity} calendarFeed={live.calendarFeed}
   onOpen={(element,page=1)=>{requestPlacezPage(place.id,page);const slot=element.closest<HTMLElement>("[data-card-morph]")||element;openCardTransition(()=>{slot.dispatchEvent(new CustomEvent(CARD_SLOT_EVENT,{detail:"open"}));onOpen(element);});}}
   heart={<VenueFollowButton key={`${place.id}:${Boolean(live.place.isFollowing)}`} businessId={place.id} initialFollowing={live.place.isFollowing} variant="small-card" accent={model.accent} onRequireAuth={onRequireAuth}/>}/>
 </CardShell></CardMorph>;
}
