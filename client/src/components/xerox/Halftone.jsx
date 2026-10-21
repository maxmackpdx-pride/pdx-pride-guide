import React from 'react';
// Amplitude-modulated halftone: dots (or lines) grow with the image's light. Two inks only, no colour wash.
// lum + screen - 1 > 0 switches a pixel on; the screen tile is a radial (dot) or linear (line) ramp.
const tile=(cell,shape)=>{
  const g=shape==='anti'
    ?`<linearGradient id='g' x1='1' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#000'/><stop offset='.25' stop-color='#fff'/><stop offset='.5' stop-color='#000'/><stop offset='.75' stop-color='#fff'/><stop offset='1' stop-color='#000'/></linearGradient>`
    :shape==='diag'
    ?`<linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#000'/><stop offset='.25' stop-color='#fff'/><stop offset='.5' stop-color='#000'/><stop offset='.75' stop-color='#fff'/><stop offset='1' stop-color='#000'/></linearGradient>`
    :shape==='line'
    ?`<linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#000'/><stop offset='.5' stop-color='#fff'/><stop offset='1' stop-color='#000'/></linearGradient>`
    :`<radialGradient id='g'><stop offset='0' stop-color='#fff'/><stop offset='1' stop-color='#000'/></radialGradient>`;
  return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${cell}' height='${cell}'><defs>${g}</defs><rect width='${cell}' height='${cell}' fill='url(#g)'/></svg>`);
};
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
export function Halftone({id,cell=5,shape='dot',on='#e6e3da',off='#050506',gain=1,invert=false,color=false,sat=1.5,floor=0,lift=0}){
  const [pr,pg,pb]=rgb(on),[ir,ig,ib]=rgb(off),s=invert?-gain:gain,o=(invert?1:0)+lift;
  return <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
    <feColorMatrix in="SourceGraphic" values={`${.2126*s} ${.7152*s} ${.0722*s} 0 ${o} ${.2126*s} ${.7152*s} ${.0722*s} 0 ${o} ${.2126*s} ${.7152*s} ${.0722*s} 0 ${o} 0 0 0 0 1`} result="lum"/>
    {shape==='hatch'
      ?<><feImage href={tile(cell,'diag')} x="0" y="0" width={cell} height={cell} preserveAspectRatio="none" result="ia"/><feTile in="ia" result="ta"/>
         <feImage href={tile(cell,'anti')} x="0" y="0" width={cell} height={cell} preserveAspectRatio="none" result="ib"/><feTile in="ib" result="tb"/>
         <feBlend in="ta" in2="tb" mode="lighten" result="screen"/></>
      :shape==='grain'
      ?<><feTurbulence type="fractalNoise" baseFrequency={1/cell} numOctaves="1" seed="7" result="n"/><feColorMatrix in="n" values="1.4 0 0 0 -.2 1.4 0 0 0 -.2 1.4 0 0 0 -.2 0 0 0 0 1" result="screen"/></>
      :<><feImage href={tile(cell,shape)} x="0" y="0" width={cell} height={cell} preserveAspectRatio="none" result="cellimg"/><feTile in="cellimg" result="screen"/></>}
    <feComposite in="lum" in2="screen" operator="arithmetic" k1="0" k2="1" k3="1" k4="-1" result="raw"/>
    <feComponentTransfer in="raw" result="bin"><feFuncR type="linear" slope="60"/><feFuncG type="linear" slope="60"/><feFuncB type="linear" slope="60"/><feFuncA type="linear" slope="0" intercept="1"/></feComponentTransfer>
    {color
      ?<><feColorMatrix in="SourceGraphic" type="saturate" values={sat} result="sc"/><feComposite in="sc" in2="bin" operator="arithmetic" k1={1-floor} k2={floor} k3="0" k4="0" result="ink"/></>
      :<feColorMatrix in="bin" values={`${pr-ir} 0 0 0 ${ir} 0 ${pg-ig} 0 0 ${ig} 0 0 ${pb-ib} 0 ${ib} 0 0 0 0 1`} result="ink"/>}
    <feComposite in="ink" in2="SourceGraphic" operator="in"/>
  </filter>;
}
