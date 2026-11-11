import {useQuery} from '@tanstack/react-query';
import {useEffect} from 'react';
import {apiRequest} from '@/lib/queryClient';
import type {Business} from '@/pages/Directory';
import type {NativePlace} from './nativeModel';
import {nativePlacezData,nearbyPlacezRestaurants} from './nativeDataModel';
import {refreshPlacezClock,usePlacezClock} from './usePlacezClock';
export function useNativePlacezData(place:NativePlace,previewNow?:number){
 const now=usePlacezClock(previewNow);
 const detail=useQuery<Business>({queryKey:['/api/directory',place.id],queryFn:async()=>{
  const response=await apiRequest('GET',`/api/directory/${place.id}`);const data=await response.json();
  if(!data||data.id!==place.id||typeof data.name!=='string')throw new Error('Place details unavailable');return data;
 },staleTime:60_000});
 useEffect(()=>{
  if(previewNow===undefined&&detail.dataUpdatedAt>0)refreshPlacezClock(detail.dataUpdatedAt);
 },[detail.dataUpdatedAt,previewNow]);
 const current=detail.data??place;
 const data=nativePlacezData(current,detail.dataUpdatedAt,typeof window==='undefined'?'':window.location.origin,now);
 return {...data,place:current,updatedAt:detail.dataUpdatedAt};
}
export function useNearbyPlacezRestaurants(place:NativePlace,enabled=true){
 const query=useQuery<Business[]>({queryKey:['/api/directory'],enabled,queryFn:async()=>{const r=await apiRequest('GET','/api/directory');const data=await r.json();if(!Array.isArray(data))throw new Error('Nearby places unavailable');return data;},staleTime:60_000});
 return query.data?nearbyPlacezRestaurants(place,query.data):undefined;
}
