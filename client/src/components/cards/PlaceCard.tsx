import TodayLocationCard from '../home/TodayLocationCard';
import type { Business } from '@/pages/Directory';
import { placePath } from '@shared/placeSlug';
import type { CardSize } from './cardLayout';
/** Complete Placez card: size changes the face, not the saved place or native tools. */
export function PlaceCard({place,size='tall',onRequireAuth}:{place:Business;size?:CardSize;onRequireAuth?:()=>void}) {
 return <TodayLocationCard size={size} location={{key:`place:${place.id}`,name:place.name,room:'Placez',detail:place.neighborhood || place.address || '',href:placePath(place.id,place.name),place}} onRequireAuth={onRequireAuth}/>;
}
