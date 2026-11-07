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
 // RTL discovery rails can align an expanded inline slot a few pixels beyond
 // the phone edge. Clamp this native card only; shared CardAPI stays untouched.
 useEffect(()=>{
  const card=dialogRef.current;if(!card)return;
  let shift=0,frame=0;const previous=card.style.translate;
  const measure=()=>{frame=0;const rect=card.getBoundingClientRect();const edge=12;
   const delta=rect.left<edge?edge-rect.left:rect.right>innerWidth-edge?innerWidth-edge-rect.right:0;
   if(Math.abs(delta)>.5){shift+=delta;card.style.translate=`${shift}px 0`;}
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(measure);};
  const observer=new ResizeObserver(schedule);observer.observe(card);
  const slot=card.closest('.zay-card-expanded-slot');if(slot)observer.observe(slot);
  window.addEventListener('resize',schedule);document.addEventListener('scroll',schedule,true);schedule();
  return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',schedule);document.removeEventListener('scroll',schedule,true);card.style.translate=previous;};
 },[id]);

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
