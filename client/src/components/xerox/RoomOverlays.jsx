import React,{useLayoutEffect,useRef} from 'react';
import {ZineCard,ZineSmallCard} from '../board/punk/ZineCard';
import {boardPalette} from '../board/punk/BoardzCollage';
import {Glitch,Grain,Autofocus} from './Fx';
import './xerox.css';

export const SIZES={large:[360,240],small:[136,150]};
/* Each room gets overlays for its own purpose, laid out in the card's own size.
   Positions are fractions of the card; strokes and type scale with it (k). Small cards keep the core motion only. */
const T=(k,x)=>({fontFamily:'var(--font-mono)',fontSize:6.5*Math.max(k,.75),letterSpacing:.9*k,...x});
function Svg({W,H,children}){return <svg className="xr-room" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">{children}</svg>}

// Mizzed: a missed connection. Two signals, a sightline with a message travelling it, a heartbeat.
function Mizzed({W,H,k,big,c}){
  const you=[W*.82,H*.47],me=[W*.42,H*.86],S=`M${me[0]} ${me[1]} Q ${W*.66} ${H*.82} ${you[0]} ${you[1]}`;
  const y=H*.95,step=W/360*96;
  const beat=x=>`H${x} l${6*k} ${-2*k} l${5*k} ${4*k} l${6*k} ${-16*k} l${7*k} ${26*k} l${6*k} ${-14*k} l${5*k} ${2*k}`;
  const ecg=`M${W*.02} ${y} ${beat(W*.27)} ${big?beat(W*.53):''} H${W*.98}`;
  return <Svg W={W} H={H}>
    <g fill="none" stroke={c}>{[0,1,2,3].slice(0,big?4:3).map(i=><circle key={i} cx={you[0]} cy={you[1]} r={24*k} strokeWidth={1.2*k} className="ring" style={{animationDelay:`${i*.6}s`}}/>)}
      {big&&[0,1].map(i=><circle key={'m'+i} cx={me[0]} cy={me[1]} r={10*k} strokeWidth={k} className="ring" style={{animationDelay:`${.3+i*1.2}s`}}/>)}</g>
    <path d={S} fill="none" stroke="#fff" strokeWidth={k} className="pk2"/>
    <circle r={2.6*k} fill={c}><animateMotion dur="3.2s" repeatCount="indefinite" path={S}/></circle>
    <circle cx={me[0]} cy={me[1]} r={2.4*k} fill="#fff"/><circle cx={you[0]} cy={you[1]} r={3.2*k} fill={c}/>
    {big&&<g transform={`translate(${W*.69} ${H*.64})`} style={T(k)}><text fill="#e6e3da">SIG</text>{[0,1,2,3].map(i=><rect key={i} x={18+i*5} y={-5-i*1.6} width="3.4" height={5+i*1.6} fill={i<3?c:'none'} stroke={c} strokeWidth=".6"/>)}<text y="10" fill="#e6e3da">DIST 4.2 M</text></g>}
    <path d={ecg} fill="none" stroke={c} strokeWidth={1.3*k} pathLength="1000" className="ecg"/>
  </Svg>;
}
// Sellz: an item for sale. A product scan.
function Sellz({W,H,k,big,c,id}){
  const f=[W*.54,H*.24,W*.95,H*.92],L=18*k;
  return <Svg W={W} H={H}>
    <path d={`M${f[0]} ${f[1]+L}V${f[1]}H${f[0]+L}M${f[2]-L} ${f[1]}H${f[2]}V${f[1]+L}M${f[0]} ${f[3]-L}V${f[3]}H${f[0]+L}M${f[2]-L} ${f[3]}H${f[2]}V${f[3]-L}`} fill="none" stroke="#fff" strokeWidth={1.5*k}/>
    <clipPath id={id}><rect x={f[0]} y={f[1]} width={f[2]-f[0]} height={f[3]-f[1]}/></clipPath>
    <g clipPath={`url(#${id})`}><g className="scanline" style={{'--scan':`${f[3]-f[1]}px`}}><rect x={f[0]} y={f[1]} width={f[2]-f[0]} height={2*k} fill={c}/><rect x={f[0]} y={f[1]-26*k} width={f[2]-f[0]} height={26*k} fill={c} opacity=".14"/></g>
      {Array.from({length:big?40:14},(_,i)=><circle key={i} cx={f[0]+(.08+((i*37)%90)/100)*(f[2]-f[0])} cy={f[1]+(.08+((i*53)%90)/100)*(f[3]-f[1])} r={.9*k} fill={c} opacity=".8"/>)}</g>
    {big&&<><g stroke="#e6e3da" strokeWidth=".7"><path d={`M${f[0]} ${f[1]-8}H${f[2]}M${f[0]} ${f[1]-11}V${f[1]-5}M${f[2]} ${f[1]-11}V${f[1]-5}`}/>{Array.from({length:15},(_,i)=><path key={i} d={`M${f[0]+i*((f[2]-f[0])/14)} ${f[1]-8}V${f[1]-(i%7?10:12)}`}/>)}</g>
      <text x={(f[0]+f[2])/2-14} y={f[1]-13} fill="#e6e3da" style={T(k)}>34 CM</text>
      <g transform={`translate(${f[0]+8} ${f[3]-10})`} style={T(k)}><text fill="#e6e3da">COND</text>{Array.from({length:10},(_,i)=><rect key={i} x={26+i*5} y="-6" width="3.6" height="6" fill={i<9?c:'none'} stroke={c} strokeWidth=".5"/>)}</g></>}
    <g transform={`translate(${f[0]+(f[2]-f[0])*.48} ${f[1]+(f[3]-f[1])*.48})`}><circle r={16*k} fill="none" stroke={c} strokeWidth={k} strokeDasharray={`${4*k} ${3*k}`} className="spin"/><circle r={2.4*k} fill="#fff"/></g>
  </Svg>;
}
// Gigz: a DJ available for work. A turning record, tonearm, a live waveform and levels, the tempo.
function Gigz({W,H,k,big,c}){
  const v=[W*.85,H*.46],R=(big?34:26)*k;
  const wave=Array.from({length:61},(_,i)=>{const x=W*.04+i*(W*.92/60),a=Math.sin(i*.55)*Math.sin(i*.13+1)*(big?12:8)*k;return `${i?'L':'M'}${x.toFixed(1)} ${(H*.93-Math.abs(a)).toFixed(1)}L${x.toFixed(1)} ${(H*.93+Math.abs(a)*.4).toFixed(1)}`}).join('');
  return <Svg W={W} H={H}>
    <g transform={`translate(${v[0]} ${v[1]})`}><g className="spin vinyl">{[1,.82,.66,.5].map((f,i)=><circle key={i} r={R*f} fill="none" stroke={i?'#e6e3da':c} strokeWidth={i?.6*k:1.4*k} opacity={i?.55:1}/>)}<path d={`M0 ${-R*.5}V${-R}`} stroke="#fff" strokeWidth={1.4*k}/><circle r={R*.18} fill={c}/></g>
      <path d={`M${R*1.05} ${-R*1.05} L${R*.92} ${-R*.2} L${R*.36} ${R*.16}`} fill="none" stroke="#fff" strokeWidth={1.3*k} className="arm"/></g>
    <path d={wave} stroke={c} strokeWidth={1.1*k} className="wave"/>
    {big&&<><g className="eq">{Array.from({length:12},(_,i)=><rect key={i} x={W*.05+i*7*k} y={H*.7} width={4*k} height={22*k} fill={i%4?c:'#fff'} style={{animationDelay:`${-i*.13}s`}}/>)}</g>
      <text x={W*.05} y={H*.68} fill="#e6e3da" style={T(k)}>124 BPM · HOUSE</text></>}
  </Svg>;
}
// Giftz: something given away. A handoff route ending at the object, a claim box marching around it.
function Giftz({W,H,k,big,c,id}){
  const o=[W*.76,H*.5],P=`M${W*.06} ${H*.92} C ${W*.3} ${H*.9} ${W*.42} ${H*.62} ${o[0]-34*k} ${o[1]+10*k}`;
  const bw=(big?78:52)*k,bh=(big?64:46)*k;
  return <Svg W={W} H={H}>
    <path d={P} fill="none" stroke={c} strokeWidth={1.6*k} className="pk"/>
    <circle r={3*k} fill="#fff"><animateMotion dur="4s" repeatCount="indefinite" path={P}/></circle>
    <rect x={o[0]-bw/2} y={o[1]-bh/2} width={bw} height={bh} fill="none" stroke="#fff" strokeWidth={1.3*k} strokeDasharray={`${6*k} ${4*k}`} className="claim"/>
    <path d={`M${o[0]} ${o[1]-bh/2}V${o[1]+bh/2}M${o[0]-bw/2} ${o[1]}H${o[0]+bw/2}`} stroke={c} strokeWidth={1.2*k} opacity=".8"/>
    <g transform={`translate(${o[0]} ${o[1]-bh/2})`}><path d={`M0 0 C ${-10*k} ${-12*k} ${-18*k} ${-2*k} 0 0 C ${10*k} ${-12*k} ${18*k} ${-2*k} 0 0`} fill="none" stroke={c} strokeWidth={1.3*k} className="bow"/></g>
    {big&&<text x={o[0]-bw/2} y={o[1]+bh/2+11*k} fill="#e6e3da" style={T(k)}>FREE · CLAIM · PORCH</text>}
  </Svg>;
}
const ROOM={mizzed:Mizzed,sellz:Sellz,gigz:Gigz,giftz:Giftz};

/* The card's own motif artwork, restyled for the overlay: a neon edge trace that pulses, a scan band that
   reveals it, motif-shaped pings that ripple out of it, and the wire companion flickering. Clones sit exactly
   where the live card places the art. */
function useMotifLayers(ref,cat){
  useLayoutEffect(()=>{
    let done=false;const k=cat.slice(1).toLowerCase();
    const run=()=>{
      if(done||!ref.current)return;const card=ref.current.querySelector('.xr-hdg>.zine');if(!card)return;
      const hero=card.querySelector('.zine-hero.zine-sticker'),wire=card.querySelector('.zine-hero.zine-wire');
      if(!hero||!hero.complete||!hero.naturalWidth)return;done=true;
      const add=(src,cls,i=0)=>{const n=src.cloneNode(true);n.removeAttribute('loading');n.classList.add('mo',cls);n.style.setProperty('--mo-edge',`url(#mo-edge-${k})`);n.style.setProperty('--mo-fill',`url(#mo-fill-${k})`);n.style.animationDelay=`${-i*0.9}s`;src.parentNode.insertBefore(n,src.nextSibling);};
      [0,1,2].forEach(i=>add(hero,'mo-echo',i));add(hero,'mo-scan');add(hero,'mo-edge');
      if(wire)add(wire,'mo-wire');
    };
    run();const t=setInterval(run,200),s=setTimeout(()=>clearInterval(t),8000);return()=>{clearInterval(t);clearTimeout(s)};
  },[cat]);
}

const BOARD_ROOMS=['mizzed','sellz','gigz','giftz'];
export const hasXerox=r=>BOARD_ROOMS.includes(r.category);
// Seed from the post key so each card keeps its own rhythm.
const seedOf=key=>Array.from(String(key)).reduce((n,c)=>(n*31+c.charCodeAt(0))%997,3);

/** Wraps the live Boardz zine card (large or small) in the Cinema Xerox layer: glitch bands, room overlay, grain, autofocus. */
export function BoardzXerox({r,size='large',children}){
  const ref=useRef(null);
  const c=boardPalette[r.category].color,[W,H]=SIZES[size],big=size==='large',k=W/360*(big?1:1.25),seed=seedOf(r.key||r.id);
  useMotifLayers(ref,c);
  const Ov=ROOM[r.category];
  return <div ref={ref} className={'xr-rz xr-sz-'+size} style={{'--cat':c,width:W,height:H}}>
    <Glitch delay={-seed*1.7}>{children}</Glitch>
    {Ov&&<Ov W={W} H={H} k={k} big={big} c={c} id={`xr-clip-${r.key}-${size}`.replace(/[^a-z0-9-]/gi,'-')}/>}
    <Grain/>
    <Autofocus mode={r.category==='mizzed'?'bubble':'box'} seed={seed} area={!big?[44,56,52,38]:r.category==='mizzed'?[54,10,44,78]:[4,8,92,84]}/>
  </div>;
}
