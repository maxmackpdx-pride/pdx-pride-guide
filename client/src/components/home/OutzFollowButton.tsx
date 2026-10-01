import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
export default function OutzFollowButton({placeId,onRequireAuth}:{placeId:string;onRequireAuth?:()=>void}) {
  const {user}=useAuth(); const {toast}=useToast(); const cache=useQueryClient();
  const queryKey=['/api/outz/follow',placeId];
  const {data,isLoading}=useQuery<{isFollowing:boolean}>({queryKey,enabled:!!user,queryFn:()=>apiRequest('GET',`/api/outz/follow?place=${encodeURIComponent(placeId)}`).then(r=>r.json())});
  const mutation=useMutation({mutationFn:()=>apiRequest(data?.isFollowing?'DELETE':'POST','/api/outz/follow',{placeId}).then(r=>r.json()),onSuccess:value=>{cache.setQueryData(queryKey,value);cache.invalidateQueries({queryKey:['/api/hub/feed']});},onError:()=>toast({title:'Could not update follow',variant:'destructive'})});
  return <button type="button" className="tonight-card__view" aria-pressed={!!data?.isFollowing} disabled={mutation.isPending || (!!user && isLoading)} onClick={()=>user?mutation.mutate():onRequireAuth?.()}>{data?.isFollowing?'Following':'Follow'}</button>;
}
