import {canSaveBoardPost} from '@/lib/boardFeatures';
import {useState} from 'react';
import {useQuery,useMutation} from '@tanstack/react-query';
import {useAuth} from '@/context/AuthContext';
import {apiRequest,queryClient} from '@/lib/queryClient';
import {useToast} from '@/hooks/use-toast';
import AuthModal from '@/components/AuthModal';
import {toBoardPosts,type BoardCategory,type BoardPayload} from '@/lib/allBoards';
import PunkBoardCard from './punk/PunkBoardCard';
export default function BoardPostFace({category,post,onOpen,small=false,hero=false}:{category:BoardCategory;post:unknown;onOpen?:()=>void;small?:boolean;hero?:boolean}){
 const {user}=useAuth();const {toast}=useToast();const [auth,setAuth]=useState(false);
 const data=toBoardPosts(category,(category==='housing'?{posts:[post]}:[post]) as BoardPayload,true)[0];
 const saved=useQuery<string[]>({queryKey:['/api/boards/saved',user?.id],queryFn:()=>apiRequest('GET','/api/boards/saved').then(r=>r.json()),enabled:!!user});
 const isSaved=saved.data?saved.data.includes(data.key):!!data.saved;
 const save=useMutation({mutationFn:()=>apiRequest(isSaved?'DELETE':'PUT',`/api/boards/${category}/posts/${data.id}/save`),onSuccess:()=>{void queryClient.invalidateQueries({queryKey:['/api/boards/saved']});void queryClient.invalidateQueries({queryKey:['/api/housing']});void queryClient.invalidateQueries({queryKey:['/api/sellz/saved/ids']});},onError:()=>toast({title:'Could not update saved posts',variant:'destructive'})});
 return <><div className={hero?'boardz-open-hero':'boardz-production-card'}><PunkBoardCard post={data} small={small} saved={isSaved} saveDisabled={!canSaveBoardPost(data)||save.isPending} onSave={()=>user?save.mutate():setAuth(true)} onOpen={onOpen}/></div>{auth&&<AuthModal onClose={()=>setAuth(false)}/>}</>;
}
