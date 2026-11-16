import type {Business} from '@/pages/Directory';
import {resolveBusinessLocations} from '@shared/businessLocations';
import {placePath} from '@shared/placeSlug';
import {resolveDirectoryLogo} from '@shared/directoryLogos';
import {adaptDirectoryRecord,type PlaceCardModel} from './placezAdapter';
import {presentationFor} from './presentation';
import {recoveredPresentation} from './recoveredPresentation';
const artwork={...presentationFor('/placez-six'),...recoveredPresentation};
export type NativePlace = Pick<Business,'id'|'name'|'type'> & Partial<Business>;
export const hasPlacezArtwork=(id:number)=>Object.prototype.hasOwnProperty.call(artwork,id);
/** Only presentation is adapted. Callers retain the full Business for native tools. */
export function nativePlacezModel(place:NativePlace):PlaceCardModel {
 const locations=resolveBusinessLocations(place);
 const primary=locations.length===1?locations[0]:undefined;
 const presentation=artwork[place.id];
 const model=adaptDirectoryRecord({...place,locations},presentation);
 // Approved treatments already embed their wordmark or provide an independent logo.
 // Generic directory records must still use the same reviewed logo resolver as MapZ.
 if(!presentation) model.logoUrl=resolveDirectoryLogo(place.name,place.imageUrl)||undefined;
 return {...model,href:placePath(place.id,place.name),phone:place.phone||primary?.phone||null,
  latitude:place.lat??primary?.lat??null,longitude:place.lng??primary?.lng??null};
}
export const PLACEZ_PAGE_EVENT='placez:open-page';
export type PlacezPageRequest={page:number;request:number};
const requests=new Map<number,PlacezPageRequest>();
const defaultRequest:PlacezPageRequest={page:1,request:0};
let sequence=0;
export const selectedPlacezPage=(id:number):PlacezPageRequest=>requests.get(id)||defaultRequest;
export function requestPlacezPage(id:number,page=1){
 const next={page:Math.max(0,Math.min(4,Math.trunc(page))),request:++sequence};
 requests.set(id,next);
 if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent(PLACEZ_PAGE_EVENT,{detail:{id,...next}}));
}
