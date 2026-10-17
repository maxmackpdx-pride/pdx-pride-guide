import React from 'react';
import { housingTypes } from './houz-model';
export function InkFilters(){return <svg width="0" height="0" aria-hidden="true" focusable="false" style={{position:'absolute',pointerEvents:'none'}}><defs>
{Object.entries(housingTypes).map(([intent,t])=>{const c=t.color.replace('#','');const [r,g,b]=[0,2,4].map(i=>parseInt(c.slice(i,i+2),16)/255);return <filter key={intent} id={'hz-ink-'+intent} colorInterpolationFilters="sRGB"><feComponentTransfer><feFuncG type="linear" slope="1.35" intercept="-.12"/></feComponentTransfer><feColorMatrix values={`0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 0 0 0 1 0`}/></filter>})}
<filter id="hz-ink-white" colorInterpolationFilters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="1.6" intercept="-.15"/><feFuncG type="linear" slope="1.6" intercept="-.15"/><feFuncB type="linear" slope="1.6" intercept="-.15"/></feComponentTransfer></filter>
<filter id="hz-ink-frame" colorInterpolationFilters="sRGB"><feColorMatrix values="1.6 0 0 0 -.12 0 .8 .8 0 -.12 0 .8 .8 0 -.12 0 0 0 1 0"/></filter>
{/* Remove black stock over photos without screen-blending and bleaching cyan ink. */}
<filter id="hz-photo-paper" colorInterpolationFilters="sRGB"><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 1 0 0 0"/><feComposite in2="SourceAlpha" operator="in"/></filter>
{/* Split the existing scan into cyan rim, neutral grain, and black paper stock. */}
<filter id="hz-rim-only" colorInterpolationFilters="sRGB"><feColorMatrix values="0 0 0 0 0 0 0 0 0 1 0 0 0 0 1 -1 1 0 0 0"/><feComposite in2="SourceAlpha" operator="in"/></filter>
<filter id="hz-grain-only" colorInterpolationFilters="sRGB"><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1 0 0 0 0"/><feComposite in2="SourceAlpha" operator="in"/></filter>
<filter id="hz-stock-only" colorInterpolationFilters="sRGB"><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 1 -1 0 1 0"/><feComposite in2="SourceAlpha" operator="in"/></filter>
<filter id="hz-ink-cyan" colorInterpolationFilters="sRGB"><feComponentTransfer><feFuncG type="linear" slope="1.35" intercept="-.12"/></feComponentTransfer><feColorMatrix values="0 0 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 1 0"/></filter>
</defs></svg>}
