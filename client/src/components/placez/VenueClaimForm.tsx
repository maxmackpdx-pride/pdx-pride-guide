import {useState} from "react";
import {useMutation,useQueryClient} from "@tanstack/react-query";
import {apiRequest,parseApiError} from "@/lib/queryClient";

type ClaimReceipt = {autoApproved:boolean;claimId?:number;claim?:{id:number}};

type Props={placeId:number;claimed:boolean;locations:number;userId?:number;onRequireAuth:()=>void};
export default function VenueClaimForm(props: Props) {
  const [open,setOpen]=useState(false);
  if (!open) return props.claimed ? null : <button type="button" className="btn-neon pdx-glass-rebind" onClick={()=>setOpen(true)}>{props.locations>1?"Claim this brand listing":"Claim this business"}</button>;
  return <ClaimFields key={props.userId??'guest'} {...props} close={()=>setOpen(false)}/>;
}
function ClaimFields({placeId,claimed,locations,userId,onRequireAuth,close}:Props&{close:()=>void}){
  const signedIn=userId!=null;
  const [reason,setReason]=useState("");
  const client=useQueryClient();
  const claim=useMutation({
    mutationFn:async():Promise<ClaimReceipt> => (await apiRequest("POST",`/api/directory/${placeId}/claim`,{claimReason:reason.trim()})).json(),
    onSuccess:()=>{for (const queryKey of [["/api/directory"],["/api/placez",placeId],[`/api/placez/${placeId}`]]) void client.invalidateQueries({queryKey});},
  });
  if (claim.isSuccess) {
    const id=claim.data.claimId??claim.data.claim?.id;
    return <p role="status">{claim.data.autoApproved?"Ownership confirmed. You can manage this listing.":"Ownership claim submitted for review."}{id ? ` Claim #${id}.` : ""}</p>;
  }
  if (claimed) return null;
  return <form className="gifting-form-grid" onSubmit={e=>{
    e.preventDefault();
    if (!signedIn){onRequireAuth();return;}
    if (reason.trim().length>=10 && !claim.isPending) claim.mutate();
  }}>
    <p>{locations>1?`This claim covers the brand and all ${locations} listed locations.`:"This claim grants management of this business listing."} Ownership lets you edit the listed contact and venue information.</p>
    {signedIn && <label>How do you represent this business?
      <textarea required minLength={10} value={reason} onChange={e=>setReason(e.target.value)} className="board-text-field" />
    </label>}
    {claim.isError&&<p role="alert">{parseApiError(claim.error,"Could not submit the claim. Try again.")}</p>}
    <button type="submit" className="btn-neon pdx-glass-rebind" disabled={claim.isPending||(signedIn&&reason.trim().length<10)}>{!signedIn?"Sign in to claim":claim.isPending?"Submitting…":"Submit ownership claim"}</button>
    <button type="button" disabled={claim.isPending} onClick={close}>Cancel</button>
  </form>;
}
