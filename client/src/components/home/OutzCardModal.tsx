import {preserveMapDocument} from '@/lib/preserveMapDocument';
import {useEffect,useRef,useState} from 'react';
import {CardDetails} from "@/components/cards/CardAPI";
import {OpenCardMeta} from "@/components/cards/react19Card";
import {closeOpenCard} from "@/components/cards/react19CardModel";
import {X} from 'lucide-react';
import {useLocation} from 'wouter';
import {acquirePinnedMapModule} from '@/lib/pinnedMapModule';
import {useOpenCardClose} from '@/hooks/useOpenCardClose';
import type {TodayLocation} from './TodayLocationCard';
import './OutzCardModal.css';
export default function OutzCardModal({documentMeta=true,...props}:Parameters<typeof OutzCardDetails>[0]&{documentMeta?:boolean}) {
 const close=()=>closeOpenCard(props.onClose);
 return <CardDetails key={props.location.key} onClose={props.onClose}>{documentMeta&&<OpenCardMeta title={props.location.name} description={props.location.detail}/>}<OutzCardDetails {...props} onClose={close}/></CardDetails>;
}
function OutzCardDetails({location,onClose,onRequireAuth}:{location:TodayLocation;onClose:()=>void;onRequireAuth?:()=>void}) {
 const [failed,setFailed]=useState('');
 const node=useRef<HTMLDivElement>(null);const [,navigate]=useLocation();
 const {dialogRef,requestClose}=useOpenCardClose(onClose);const id=location.key.replace(/^outz:/,'');
 const callbacks=useRef({requestClose,navigate});callbacks.current={requestClose,navigate};
 useEffect(()=>{
  let disposed=false;let release:(()=>void)|undefined;let unmount:(()=>void)|undefined;
  const restoreDocument=preserveMapDocument();
  setFailed('');
  void acquirePinnedMapModule().then(acquired=>{
   release=acquired.release;if(disposed||!node.current){release();return;}
   const card=acquired.module.mountDestinationCard(node.current,{placeId:id,loginHref:'/outzide?auth=login',onClose:()=>callbacks.current.requestClose(),onNavigate:href=>callbacks.current.navigate(href)});
   unmount=card.unmount;
  }).catch(error=>{if(!disposed)setFailed(error instanceof Error?error.message:'Destination could not load.');});
  return()=>{disposed=true;unmount?.();release?.();restoreDocument();};
 },[id]);
 return (<div className="home-outz-overlay" onClick={requestClose}><div ref={dialogRef} className="home-outz-modal" role="dialog" aria-modal="false" aria-label={location.name} onClick={e=>e.stopPropagation()}><div ref={node} className="home-outz-native" style={{height:'100%',overflow:'auto'}}/>{failed&&<div className="home-outz-loading" role="alert">{failed} <a href={location.href}>Open destination details</a></div>}<button type="button" className="home-outz-close" aria-label="Close destination" onClick={requestClose}><X size={20} aria-hidden="true" /></button></div></div>);
}
