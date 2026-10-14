import { useEffect, useRef, useState } from "react";

/** Authored profile ticker; no renderer, hidden-tab or offscreen work. */
export default function ProfileMarquee({items, speed=30, color}: {items:string[];speed?:number;color?:string}) {
  const root=useRef<HTMLDivElement>(null);
  const [active,setActive]=useState(false);
  useEffect(()=>{
    let visible=false;
    const sync=()=>setActive(visible && !document.hidden);
    if (typeof IntersectionObserver === "undefined") visible=true;
    const observer=typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting);sync();});
    if(root.current) observer?.observe(root.current);
    document.addEventListener("visibilitychange",sync);sync();
    return()=>{observer?.disconnect();document.removeEventListener("visibilitychange",sync);};
  },[]);
  const safeColors=new Set(["pink","cyan","lime","orange","purple","green","blue","rainbow"]);
  const chosen=color && safeColors.has(color)?color:undefined;
  return <div ref={root} className={`pp-profile-ticker${active?" is-active":""}${chosen==="rainbow"?" is-rainbow":""}`} style={{"--ticker-speed":`${Math.max(10,Math.min(120,speed))}s`,...(chosen && chosen!=="rainbow"?{"--ticker-accent":`var(--${chosen})`}:{})} as React.CSSProperties}>
    <div className="pp-profile-ticker__track">{[0,1].map(copy=><span key={copy} aria-hidden={copy===1 || undefined} className="pp-profile-ticker__set">{items.map((item,index)=><span key={index}>{item}<span aria-hidden="true">✦</span></span>)}</span>)}</div>
  </div>;
}
