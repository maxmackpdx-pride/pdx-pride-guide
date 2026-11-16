import {useLayoutEffect,useRef,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import './FullscreenPlacezDetails.css';

/** Native place details use the viewport, not the closed card's grid slot. */
export default function FullscreenPlacezDetails({children,label,onClose}:{children:ReactNode;label:string;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useLayoutEffect(()=>{
  const el=dialog.current;if(!el)return;
  const previous=document.body.style.overflow;
  const trigger=document.activeElement instanceof HTMLElement?document.activeElement:null;
  el.showModal();document.body.style.overflow='hidden';
  return()=>{document.body.style.overflow=previous;el.close();if(trigger?.isConnected)trigger.focus({preventScroll:true});};
 },[]);
 return createPortal(<dialog ref={dialog} className="placez-fullscreen" aria-label={label} onCancel={event=>{event.preventDefault();onClose();}}>{children}</dialog>,document.body);
}
