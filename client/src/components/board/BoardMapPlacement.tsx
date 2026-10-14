import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient, parseApiError } from "@/lib/queryClient";
import BoardMapPicker, {type BoardMapPoint,type BoardMapVenue} from "./BoardMapPicker";
import "./BoardMapPlacement.css";
type Stored=BoardMapPoint&{firstPlacedAt:string;expiresAt:string};
export default function BoardMapPlacement({board,postId}: {board:string;postId:number}) {
 const [expanded,setExpanded]=useState(false),[editing,setEditing]=useState(false);
 const url=`/api/boards/${board==="housing"?"houz":board}/posts/${postId}/map-location`;
 const state=useQuery<{canPlace:boolean;reopensPost:boolean;pending:boolean;placement:Stored|null;maxDays:number;renewal:boolean;venue:BoardMapVenue|null}>({queryKey:[url],enabled:expanded,queryFn:()=>apiRequest("GET",url).then(r=>r.json()),staleTime:0});
 const save=useMutation({mutationFn:(point:BoardMapPoint|null)=>apiRequest("PUT",url,{mapLocation:point}),onSuccess:()=>{setEditing(false);void state.refetch();void queryClient.invalidateQueries({queryKey:["/api/board-map-locations"]});void queryClient.invalidateQueries({queryKey:["map-worlds-mine"]});}});
 const p=state.data?.placement,active=p && Date.parse(p.expiresAt)>Date.now();
 return <details className="board-map-placement" onToggle={e=>setExpanded(e.currentTarget.open)}><summary>Map placement</summary>
   {state.isPending?<p>Loading placement…</p>:state.isError?<p role="alert">Placement couldn’t load. <button type="button" onClick={()=>void state.refetch()}>Retry</button></p>:<>
     <p>{active?`On Mapz until ${new Date(p!.expiresAt).toLocaleDateString()}`:"Not currently on Mapz"}</p>
     {p && <small>{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</small>}
     {state.data?.reopensPost && <p>Placing it again will reopen your expired connection.</p>}
     {state.data?.pending && <p>Your pin appears when the post is approved.</p>}
     {state.data?.canPlace===false && <p>This post is closed, unavailable, or remote. Update the post before placing it.</p>}
     <div><button type="button" disabled={save.isPending || state.data?.canPlace===false} onClick={()=>{save.reset();setEditing(true);}}>{active?"Edit on Mapz":"Place on Mapz"}</button>{active && <button type="button" disabled={save.isPending} onClick={()=>save.mutate(null)}>Remove pin</button>}</div>
     {save.isError && <p role="alert">{parseApiError(save.error,"Couldn’t save placement.")}</p>}
     {editing && state.data && <BoardMapPicker housing={board==="housing" || board==="houz"} saving={save.isPending} error={save.isError?parseApiError(save.error,"Couldn’t save placement."):undefined} value={p?{...p,keepUntil:active?p.expiresAt:undefined,days:Math.min(state.data.maxDays,Math.max(1,Math.ceil((Date.parse(p.expiresAt)-Date.now())/86400000)))}:null} maxDays={state.data.maxDays} renewal={state.data.renewal} venue={state.data.venue} onCancel={()=>setEditing(false)} onConfirm={point=>save.mutate(point)} />}
   </>}
 </details>;
}
