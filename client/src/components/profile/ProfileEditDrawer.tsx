import {lazy, Suspense, useEffect, useRef, useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {X} from 'lucide-react';
import {useLocation} from 'wouter';
import {useAuth, type AuthUser} from '@/context/AuthContext';
import {queryClient, parseApiError} from '@/lib/queryClient';
import {useToast} from '@/hooks/use-toast';
import '@/components/discovery/EventzDetail.css';
import '@/components/discovery/OpenCardContinuity.css';
import './ProfileEditDrawer.css';
const ExistingProfileEditor=lazy(()=>import('@/components/dashboard/DashboardProfileEditor'));
export type ProfileEditDrawerProps={open:boolean; onOpenChange:(open:boolean)=>void; ownerUserId:number};
function OwnerEditor({user,onSaved}:{user:AuthUser;onSaved:()=>void}) {
 const {refreshUser,user:currentUser}=useAuth(); const [,navigate]=useLocation();const {toast}=useToast();
 const [username,setUsername]=useState(user.username),[displayName,setDisplayName]=useState(user.displayName||''),[bio,setBio]=useState(user.bio||''),[avatarChoice,setAvatarChoice]=useState(user.avatarChoice),[saving,setSaving]=useState(false),[saveMsg,setSaveMsg]=useState('');
 const accountId=useRef(currentUser?.id);accountId.current=currentUser?.id;
 useEffect(()=>()=>{accountId.current=undefined;},[]);
 const save=async()=>{
  const startedAs=user.id;if(accountId.current!==startedAs||saving)return;setSaving(true);setSaveMsg('');
  try{
   const response=await fetch('/api/users/me',{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({displayName,bio,avatarChoice,username:username.trim()})});
   if(!response.ok){const error=await response.json().catch(()=>({}));throw new Error(error.error||'Could not save profile');}
   const updated=await response.json();if(accountId.current!==startedAs)return;
   await refreshUser();await queryClient.invalidateQueries({queryKey:['profile']});if(accountId.current!==startedAs)return;
   setSaveMsg('Saved');onSaved();if(updated.username&&updated.username!==user.username)navigate(`/u/${encodeURIComponent(updated.username)}`);
  }catch(error){if(accountId.current===startedAs)toast({title:parseApiError(error,'Could not save profile'),variant:'destructive'});}finally{setSaving(false);}
 };
 return <ExistingProfileEditor user={user} username={username} setUsername={setUsername} displayName={displayName} setDisplayName={setDisplayName} bio={bio} setBio={setBio} avatarChoice={avatarChoice} setAvatarChoice={setAvatarChoice} saving={saving} saveMsg={saveMsg} onSave={()=>{void save();}} onRefresh={()=>{void refreshUser();void queryClient.invalidateQueries({queryKey:['profile']});}}/>;
}
/** Owner-only shell; the existing editor retains all fields, cropping and server validation. */
export default function ProfileEditDrawer({open,onOpenChange,ownerUserId}:ProfileEditDrawerProps){
 const {user}=useAuth();const returnFocus=useRef<HTMLElement|null>(typeof document !== 'undefined' ? document.activeElement as HTMLElement : null);if(!user||user.id!==ownerUserId)return null;
 return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="eb-detail-backdrop"/><Dialog.Content onCloseAutoFocus={event=>{event.preventDefault();if(returnFocus.current?.isConnected)returnFocus.current.focus();}} className="event-modal event-modal--approved event-modal--reference profile-edit-drawer"><header className="event-modal__chrome"><Dialog.Title className="event-modal__title">Edit your profile</Dialog.Title><Dialog.Close className="detail-actions__close" aria-label="Close profile editor"><X size={20}/></Dialog.Close></header><Dialog.Description className="profile-edit-drawer__description">Update your public profile. Photo and cover controls save their changes directly.</Dialog.Description><div className="event-modal__scroll">{open&&<Suspense fallback={<p role="status">Opening profile editor…</p>}><OwnerEditor key={user.id} user={user} onSaved={()=>onOpenChange(false)}/></Suspense>}</div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
