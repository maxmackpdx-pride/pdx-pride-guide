import {rememberCardOrigin} from '../cards/CardAPI';
import {useEffect,useRef,useState,type ReactNode} from 'react';
const SIZE={small:[136,170],tall:[200,403],wide:[360,216],square:[250,250]} as const;
export default function LockedCardSlot({size,children}:{size:keyof typeof SIZE;children:ReactNode}){
 const ref=useRef<HTMLDivElement>(null);const [scale,setScale]=useState(1);const [width,height]=SIZE[size];
 useEffect(()=>{const el=ref.current;if(!el)return;const update=()=>setScale(Math.min(1,el.clientWidth/width));update();const observer=new ResizeObserver(update);observer.observe(el);return()=>observer.disconnect();},[width]);
 return <div ref={ref} onClickCapture={rememberCardOrigin} className="places-locked-slot" style={{width:'100%',maxWidth:width,height:height*scale}}><div style={{width,height,transform:`scale(${scale})`,transformOrigin:'top left'}}>{children}</div></div>;
}

