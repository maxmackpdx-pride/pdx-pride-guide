import React,{useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {ransomLetters} from '../board/punk/ransomStyles.mjs';
import '../board/punk/cut-type.css';
import {emphasizeTitle} from '../../../public/map-foundation/title-emphasis.js';
import {Grain,useSlot} from './Fx';
import './xerox.css';

// Animated overlay in the day colour. mode 'bottom' leans into the lower half (flyer events); 'center' wraps the logo.
export function XeroxOverlay({mode='bottom',W=200,H=250,id='x',reticle=true}){
  const cx=mode==='bottom'?W*.72:W/2, cy=mode==='bottom'?H*.78:H/2;
  const ring=(k,ph)=>{const p=[];for(let i=0;i<=48;i++){const t=i/48*Math.PI*2,w=1+.07*Math.sin(3*t+ph)+.04*Math.sin(5*t+ph*1.7);p.push((cx+Math.cos(t)*k*w).toFixed(1)+','+(cy+Math.sin(t)*k*.78*w).toFixed(1))}return 'M'+p.join('L')+'Z'};
  const route=mode==='bottom'?`M6 ${H-8} C ${W*.22} ${H-26} ${W*.38} ${H*.84} ${cx-18} ${cy+8}`:`M6 ${H-10} C ${W*.2} ${H-30} ${W*.3} ${H*.7} ${cx-26} ${cy+12}`;
  const R=mode==='bottom'?[22,38,56,78]:[44,64,86,110];
  return <svg className={'xr-xo xr-xo-'+mode} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
    {reticle&&<><g fill="none" stroke="currentColor" strokeLinejoin="round">
      {R.map((k,i)=><path key={i} d={ring(k,i*1.3)} strokeWidth={i%2?.7:1.1} opacity={i%2?.55:.9} className="xr-xo-cp" style={{animationDelay:`${-i*.9}s`}}/>)}
      <path d={ring(R[1],1.3)} stroke="#fff" strokeWidth="1" pathLength="1000" className="xr-xo-sweep"/>
    </g>
    <path d={route} fill="none" stroke="currentColor" strokeWidth="1.5" className="xr-xo-route"/>
    <circle r="2.6" fill="#fff"><animateMotion dur="4.6s" repeatCount="indefinite" path={route}/></circle>
    <g transform={`translate(${cx} ${cy})`}><circle r="13" fill="none" stroke="#fff" strokeWidth=".9" strokeDasharray="4 3" className="xr-xo-spin"/>
      <path d="M-20 -8V-20H-8M20 -8V-20H8M-20 8V20H-8M20 8V20H8" fill="none" stroke="#fff" strokeWidth="1.3"/></g>
    </>}
    <rect className="xr-xo-scan" x="0" y="-30" width={W} height="30" fill="currentColor" opacity=".16"/>
  </svg>;
}

export function PlacezRadar(){
  return <svg className="xr-radar" viewBox="0 0 200 200" aria-hidden="true">
    {[.34,.58,.82].map((k,i)=><circle key={i} cx="100" cy="100" r={100*k} fill="none" stroke="currentColor" strokeWidth=".8" opacity={.7-i*.15}/>)}
    <g className="xr-radar-sweep" style={{transformOrigin:'100px 100px'}}><path d="M100 100 L100 0 A100 100 0 0 1 170 29 Z" fill="currentColor" opacity=".22"/><line x1="100" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="1"/></g>
    <g className="xr-radar-pin"><path d="M100 84 C 91 84 86 90 86 96 C 86 104 100 118 100 118 C 100 118 114 104 114 96 C 114 90 109 84 100 84 Z" fill="currentColor"/><circle cx="100" cy="96" r="4" fill="var(--z-black)"/></g>
    <circle className="xr-radar-ping" cx="100" cy="118" r="6" fill="none" stroke="currentColor" strokeWidth="1"/>
  </svg>;
}

/** Cut-out title: base treatment (white on black) with EXACTLY ONE whole word inverted onto paper tiles (black on white).
 *  Which word is a pure function of `seed` (the place id) - see map-foundation/title-emphasis.js. The inverted word keeps the
 *  per-letter Cut Type look; every letter uses its resolved palette so the word has one polarity. Other words stay plain. */
export function RansomTitle({text,seed}){
  return <>{emphasizeTitle(text,seed??text).map(({text:word,emphasis},wi)=>emphasis
    ? <span key={wi} className="xr-rw xr-rw--inv" data-emphasis="true">{ransomLetters(word,`${seed??text}:${word}`,'dark').map((l,i)=>
        <span key={i} className="xr-rl" style={{fontFamily:`CutMix${l.style}`,fontPalette:`--cut-mix-${l.style.toLowerCase()}-${l.palette}`}}>{l.char}</span>)}</span>
    : <span key={wi} className="xr-rw xr-pw">{word}</span>)}</>;
}

/** Cinema Xerox layer for a live Outzide card (TodayLocationCard): channel-split glitch of the photo, overlay, grain. */
export function OutzXerox({children,photo=false,blend=false,delay=0}){
  const ref=useRef(null);
  const art=useSlot(ref,'.today-location__art');
  const [src,setSrc]=useState(null);
  useLayoutEffect(()=>{if(!art||!photo)return;const i=art.querySelector('img:not(.xr-copy)');if(i)setSrc(i.currentSrc||i.getAttribute('src'))},[art,photo]);
  return <div ref={ref} className={'xr-oz'+(photo?' xr-oz--photo':'')} style={{'--gd':delay+'s'}}>
    {children}
    {art&&createPortal(<>
      {photo&&src&&<><img className="xr-copy xr-copy-r" src={src} alt="" aria-hidden="true"/><img className="xr-copy xr-copy-c" src={src} alt="" aria-hidden="true"/></>}
      {!blend&&<XeroxOverlay mode="bottom" W={200} H={230} reticle={false}/>}
      <Grain/>
    </>,art)}
  </div>;
}

/** Placez: the radar over the logo well and a light Boardz scratch texture. Works on PlaceDiscoveryCard and the Placez TodayLocationCard. */
export function PlacezXerox({children,slot='.pdxPlace__media',accent}){
  const ref=useRef(null);
  const media=useSlot(ref,slot);
  return <div ref={ref} className="xr-pz" style={accent?{'--c':accent}:undefined}>
    {children}
    {media&&createPortal(<><PlacezRadar/><Grain/></>,media)}
  </div>;
}
