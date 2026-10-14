import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, queryClient, parseApiError } from "@/lib/queryClient";
import { boardFeaturePosts,canSaveBoardPost } from "@/lib/boardFeatures";
import type { BoardCategory,BoardPayload,BoardPost } from "@/lib/allBoards";
import BoardBrowseCard from "./BoardBrowseCard";
import OpenBoardCard from "./OpenBoardCard";
import "./MapBoardCards.css";
export type MapBoardCardRow={key:string;category:BoardCategory;row:Record<string,any>};
export default function MapBoardCards({rows,onClose,onOpen,onRequireAuth}: {rows:MapBoardCardRow[];onClose:()=>void;onOpen:(key:string,target:HTMLElement)=>void;onRequireAuth:()=>void}) {
 const {user}=useAuth();
 const saved=useQuery<string[]>({queryKey:["/api/boards/saved",user?.id],enabled:!!user,queryFn:()=>apiRequest("GET","/api/boards/saved").then(r=>r.json())});
 const save=useMutation({mutationFn:(post:BoardPost)=>apiRequest(saved.data?.includes(post.key)?"DELETE":"PUT",`/api/boards/${post.category}/posts/${post.id}/save`),onSuccess:()=>void queryClient.invalidateQueries({queryKey:["/api/boards/saved"]})});
 return <OpenBoardCard floating label={rows.length===1?"Post at this pin":"Posts at this pin"} accent="var(--neon-cyan)" onClose={onClose}><div className="map-board-cards">
  {save.isError && <p role="alert">{parseApiError(save.error,"Couldn’t save this post.")}</p>}
  {rows.map(({key,category,row})=>{
   const post=boardFeaturePosts(category,(category==="housing"?{posts:[row]}:[row]) as BoardPayload,user?.id)[0];if(!post)return null;
   return <BoardBrowseCard key={key} post={post} isSaved={saved.data?.includes(post.key)} saveDisabled={save.isPending || !canSaveBoardPost(post) || (!!user && saved.isPending)} onSave={()=>user?save.mutate(post):onRequireAuth()} onOpen={target=>onOpen(key,target)}/>;
  })}
 </div></OpenBoardCard>;
}
