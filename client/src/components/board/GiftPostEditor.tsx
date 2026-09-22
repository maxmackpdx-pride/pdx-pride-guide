import {useState} from "react";
import {useMutation} from "@tanstack/react-query";
import {apiRequest,queryClient} from "@/lib/queryClient";
import {useToast} from "@/hooks/use-toast";
import type {GiftingPost} from "./GiftListingCard";

export default function GiftPostEditor({post,onClose}:{post:GiftingPost;onClose:()=>void}) {
  const {toast}=useToast();
  const [form,setForm]=useState({title:post.title,description:post.description,category:post.category,neighborhood:post.neighborhood,pickupPreference:post.pickupPreference});
  const [photos,setPhotos]=useState<FileList|null>(null);
  const save=useMutation({mutationFn:async()=>{
    let photoUrls=post.photoUrls;
    if(photos?.length){const data=new FormData();Array.from(photos).slice(0,2).forEach(file=>data.append("photos",file));const res=await fetch("/api/upload/gifting",{method:"POST",credentials:"include",body:data});if(!res.ok)throw new Error("Photos could not upload");photoUrls=(await res.json()).urls;}
    return apiRequest("PUT",`/api/gifting/${post.id}`,{...form,photoUrls});
  },onSuccess:()=>{void queryClient.invalidateQueries({queryKey:["/api/gifting"]});void queryClient.invalidateQueries({queryKey:["/api/gifting/mine"]});toast({title:"Gift updated"});onClose();},onError:(e:Error)=>toast({title:"Could not save",description:e.message,variant:"destructive"})});
  return <form className="gifting-form-grid" onSubmit={e=>{e.preventDefault();save.mutate();}}>
    {(Object.keys(form) as Array<keyof typeof form>).map(key=><label className={key==="description"?"span":""} key={key}>{({title:"Title",description:"Description",category:"Category",neighborhood:"Neighborhood",pickupPreference:"Pickup preference"})[key]}{key==="description"?<textarea className="board-text-field" rows={4} required value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/>:<input className="board-text-field" required={key==="title"} maxLength={key==="title"?90:200} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/>}</label>)}
    <label>Replace photos (up to two)<input type="file" accept="image/*" multiple onChange={e=>setPhotos(e.target.files)}/></label>
    <div className="span"><button type="submit" disabled={save.isPending||!form.title.trim()||!form.description.trim()}>{save.isPending?"Saving…":"Save changes"}</button><button type="button" onClick={onClose}>Cancel</button></div>
  </form>;
}
