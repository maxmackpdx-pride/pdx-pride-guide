import PlaceDiscoveryCard from '@/components/discovery/PlaceDiscoveryCard';
import type {Business} from '@/pages/Directory';
import './ProfileTop8Current.css';
export default function ProfilePlacePreview({place,onOpen,onRequireAuth}:{place:Pick<Business,'id'|'name'> & Partial<Business>;onOpen:(element:HTMLElement)=>void;onRequireAuth?:()=>void}) {
 return <div className="pp-place-preview"><PlaceDiscoveryCard place={{...place,type:place.type || 'venue'}} onOpen={onOpen} onRequireAuth={onRequireAuth}/></div>;
}
