import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {useLocation} from 'wouter';
import {useAuth} from '@/context/AuthContext';
import {useOpenCardClose} from '@/hooks/useOpenCardClose';
import type {TodayLocation} from './TodayLocationCard';
import './OutzCardModal.css';
export default function OutzCardModal({location,onClose,onRequireAuth}:{location:TodayLocation;onClose:()=>void;onRequireAuth?:()=>void}) {
 const [ready,setReady]=useState(false);
 const [failed,setFailed]=useState(false);
 const frame=useRef<HTMLIFrameElement>(null); const {user,loading}=useAuth(); const [,navigate]=useLocation();
 const {dialogRef,requestClose}=useOpenCardClose(onClose); const id=location.key.replace(/^outz:/,'');
 useEffect(()=>{
  const publish=()=>frame.current?.contentWindow?.postMessage({source:'outzide-host',type:'auth-state',allowed:!!user&&!loading},window.location.origin);
  const receive=(event:MessageEvent)=>{
   if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow||event.data?.source!=='outzide-map')return;
   if(event.data.type==='ready')publish();
   if(event.data.type==='card-ready')setReady(true);
   if(event.data.type==='browse-error')setFailed(true);
   if(event.data.type==='require-auth'&&!user&&!loading)onRequireAuth?.();
   if(event.data.type==='close-card')requestClose();
   if(event.data.type==='view-mapz'){onClose();navigate(`${location.href}?mapOnly=1`);}
  };
  window.addEventListener('message',receive);publish();return()=>window.removeEventListener('message',receive);
 },[user,loading,id,location.href,navigate,onClose,onRequireAuth,requestClose]);
 return createPortal(<div className="home-outz-overlay" onClick={requestClose}><div ref={dialogRef} className="home-outz-modal" role="dialog" aria-modal="true" aria-label={location.name} onClick={e=>e.stopPropagation()}><div className="home-outz-loading" role="status" hidden={ready}>{failed ? <a href={location.href}>Open destination details</a> : "Loading destination…"}</div><iframe ref={frame} title={`${location.name} details`} src={`/outzide-map/index.html?card=1&place=${encodeURIComponent(id)}&guestPlace=${encodeURIComponent(id)}`} /><button className="home-outz-close" aria-label="Close destination" onClick={requestClose}>×</button></div></div>,document.body);
}
