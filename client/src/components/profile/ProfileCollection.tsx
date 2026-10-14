import {Suspense} from 'react';
import {useQuery} from '@tanstack/react-query';
import {apiRequest} from '@/lib/queryClient';
import {useAuth} from '@/context/AuthContext';
import {lazyWithReload} from '@/lib/lazyWithReload';
import type {HubFollowedPlace} from '@shared/peopleHub';
import type {MemberProfileData} from '@/pages/profile/types';
import type {PublicProfileData} from './types';
import type {FlyerStashEvent,StashPlace} from './FlyerStash';
const FlyerStash=lazyWithReload(()=>import('./FlyerStash'));
export default function ProfileCollection({events,data,adventures,isOwner,onEventClick,onPlaceOpen,onRequireAuth}:{events:FlyerStashEvent[];data:PublicProfileData;adventures?:MemberProfileData['outzAdventures'];isOwner:boolean;onEventClick:(id:number)=>void;onPlaceOpen:(place:StashPlace,element:HTMLElement)=>void;onRequireAuth:()=>void}) {
 const {user}=useAuth();
 const owner=isOwner && user?.username.toLowerCase()===data.username.toLowerCase();
 const favorites=useQuery<{places:HubFollowedPlace[]}>({queryKey:['/api/users/me/people/following',user?.id],queryFn:()=>apiRequest('GET','/api/users/me/people/following').then(res=>res.json()),enabled:owner,staleTime:60000,retry:1});
 return <><Suspense fallback={<p role="status">Opening your collection…</p>}><FlyerStash events={events} author={{username:data.username,displayName:data.displayName,photoUrl:data.photoUrl,avatarChoice:data.avatarChoice,avatarRing:data.avatarRing}} boardPosts={data.boardPosts || []} favoritePlaces={owner?favorites.data?.places || []:[]} completedAdventures={owner?adventures?.previous || []:[]} onEventClick={event=>onEventClick(event.id)} onPlaceOpen={onPlaceOpen} onRequireAuth={onRequireAuth}/></Suspense>{owner&&favorites.isError&&<p className="pp-collection-status">Your favorite places could not load. <button type="button" onClick={()=>{void favorites.refetch();}}>Retry</button></p>}{owner&&favorites.isPending&&<p className="pp-collection-status" role="status">Loading your favorite places…</p>}</>;
}
