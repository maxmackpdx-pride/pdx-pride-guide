import {CardShell,type CardSize} from '@/components/cards/CardAPI';
import {CardMorph} from '@/components/cards/react19Card';
import {cardMorphName,CARD_SLOT_EVENT,openCardTransition} from '@/components/cards/react19CardModel';
import VenueFollowButton from '@/components/VenueFollowButton';
import {useTheme} from '@/context/ThemeContext';
import PlacezQuickCard from './PlacezQuickCard';
import {nativePlacezModel,requestPlacezPage,type NativePlace} from './nativeModel';
import './nativePlacez.css';
import {useCardBoardUpdate} from '@/components/places/CardBoardUpdates';
import {Bell} from 'lucide-react';
import {useNativePlacezData} from './nativeData';
/** Internal shared face. Public PlaceCard props and backend contracts are unchanged. */
export default function NativePlacezFace({place,size='tall',onOpen,onRequireAuth}:{
 place:NativePlace;size?:CardSize|'square';onOpen:(element:HTMLElement)=>void;onRequireAuth?:()=>void;
}){
 const {calmMode}=useTheme();
 const live=useNativePlacezData(place);
 const model=nativePlacezModel(live.place);
 const update=useCardBoardUpdate('placez',place.id);
 return <CardMorph name={cardMorphName(['placez-six',place.id,size])}><CardShell category="placez" size={size==='square'?'tall':size} className={`placez-native-shell${size==='square'?' placez-native-shell--square':''}`}>
  <PlacezQuickCard model={model} size={size==='wide'?'wide-map':size} motion={!calmMode} nextEvent={live.nextEvent} activity={live.activity} calendarFeed={live.calendarFeed}
   onOpen={(element,page=1)=>{requestPlacezPage(place.id,page);const slot=element.closest<HTMLElement>("[data-card-morph]")||element;openCardTransition(()=>{slot.dispatchEvent(new CustomEvent(CARD_SLOT_EVENT,{detail:"open"}));onOpen(element);});}}
   heart={<VenueFollowButton key={`${place.id}:${Boolean(live.place.isFollowing)}`} businessId={place.id} initialFollowing={live.place.isFollowing} variant="small-card" accent={model.accent} onRequireAuth={onRequireAuth}/>}/>
 {!!update?.unreadCount&&<button className="placez-card-notification" aria-label={`${update.unreadCount} new posts for ${place.name}`} onClick={event=>{event.stopPropagation();requestPlacezPage(place.id,0);onOpen(event.currentTarget);}}><Bell size={12}/><span>{update.unreadCount}</span></button>}
 </CardShell></CardMorph>;
}
