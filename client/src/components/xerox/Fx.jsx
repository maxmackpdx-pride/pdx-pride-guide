import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';

function rng(seed){let s=seed*9301+49297;return()=>{s=(s*9301+49297)%233280;return s/233280}}

/** First node matching `sel` inside `ref`, once the live card has rendered it. */
export function useSlot(ref,sel){
  const [node,setNode]=useState(null);
  useLayoutEffect(()=>{
    let alive=true;let tries=0;
    const find=()=>{if(!alive)return;const n=ref.current&&ref.current.querySelector(sel);if(n)setNode(n);else if(tries++<120)requestAnimationFrame(find)};
    find();return()=>{alive=false};
  },[ref,sel]);
  return node;
}

// The split copies are decoration only: keep their buttons and links out of the tab order.
const mute=n=>{if(n)n.setAttribute('inert','')};

/** Crisp glitch: two extra passes of the card, cut into hard bands, split red and cyan. No blur. */
export function Glitch({children,delay=0}){
  return <div className="xr-hdg" style={{'--gd':delay+'s'}}>
    {children}
    <div className="xr-hdg-r" aria-hidden="true" ref={mute}>{children}</div>
    <div className="xr-hdg-c" aria-hidden="true" ref={mute}>{children}</div>
  </div>;
}
export const Grain=()=> <i className="xr-grain" aria-hidden="true"/>;

// Mizzed autofocus copy: what you would wonder after a missed connection.
const BUBBLE_LINES=['WAS IT YOU?','SEEN 21:14','WHO WAS THAT','SAY HI?','STILL THINKING','SANCTUARY CLUB'];
export function Autofocus({mode='box',area=[0,0,100,100],seed=1,label='AF'}){
  const [s,set]=useState({x:50,y:50,hunt:false,i:0});
  const R=useRef(rng(seed));
  useEffect(()=>{
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    let t,u;const step=()=>{const r=R.current;
      set(p=>({x:14+r()*72,y:16+r()*68,hunt:true,i:Math.floor(r()*15)}));
      u=setTimeout(()=>set(p=>({...p,hunt:false})),mode==='track'?900:420);
      t=setTimeout(step,1300+r()*2200)};
    t=setTimeout(step,300+R.current()*1200);return()=>{clearTimeout(t);clearTimeout(u)};
  },[mode]);
  const st={'--x':s.x+'%','--y':s.y+'%',left:area[0]+'%',top:area[1]+'%',width:area[2]+'%',height:area[3]+'%'};
  return <div className={'xr-af xr-afm-'+mode+(s.hunt?' hunt':' lock')} style={st} aria-hidden="true">
    {(mode==='dof'||mode==='rack')&&<i className="af-soft"/>}
    {mode==='bubble'
      ?<div className="af-bubble"><svg viewBox="0 0 80 52" aria-hidden="true"><path d="M8 2H72a6 6 0 0 1 6 6V34a6 6 0 0 1 -6 6H30L18 50V40H8a6 6 0 0 1 -6 -6V8a6 6 0 0 1 6 -6Z" fill="rgba(5,5,6,.55)" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke"/></svg>
         <span className="tb-dots"><i/><i/><i/></span><span className="tb-red"/>
         <b>{s.hunt?'? ? ?':BUBBLE_LINES[s.i%BUBBLE_LINES.length]}</b></div>
      :mode==='multi'
      ?<div className="af-grid">{Array.from({length:15},(_,i)=><i key={i} className={i===s.i?'on':''}/>)}</div>
      :<div className="af-box"><i/><i/><i/><i/><b>{s.hunt?'AF ···':label+' ●'}</b></div>}
  </div>;
}

