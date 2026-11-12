import {useLayoutEffect,useRef,type ReactNode} from 'react';

/** Keep the card's source slot/React transition, but put its open face in the
 * browser top layer so navigation and the dock cannot cover its controls. */
export default function NativePlacezViewport({children,label,onClose}:{children:ReactNode;label:string;onClose:()=>void}){
  const dialog=useRef<HTMLDialogElement>(null);
  useLayoutEffect(()=>{
    const element=dialog.current;if(!element)return;
    element.showModal();
    return()=>{if(element.open)element.close();};
  },[]);
  return <dialog ref={dialog} className="pz-native-viewport" aria-label={label} onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{
    if(event.target!==event.currentTarget)return;
    const bounds=event.currentTarget.getBoundingClientRect();
    if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)onClose();
  }}>{children}</dialog>;
}
