import React from 'react';
import {Halftone} from './Halftone';
import {boardPalette} from '../board/punk/BoardzCollage';

const rooms=['mizzed','sellz','gigz','giftz'];
/** SVG defs for the Xerox layer: cross hatch, red and cyan channel split, and the motif edge and fill tints per room. */
export function XeroxFilters(){
  return <svg width="0" height="0" style={{position:'absolute',pointerEvents:'none'}} aria-hidden="true" focusable="false"><defs>
    <Halftone id="xr-ht-hatch" cell={3} shape="hatch" color sat={1.6}/>
    <Halftone id="xr-ht-hatch-oz" cell={3} shape="hatch" color sat={1.4} floor={.45} lift={.12}/>
    {rooms.flatMap(room=>{const k=boardPalette[room].color.slice(1).toLowerCase(),[R,G,B]=[1,3,5].map(i=>parseInt(k.slice(i-1,i+1),16)/255);return [
      <filter key={'e'+room} id={'mo-edge-'+k} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
        <feColorMatrix values=".2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 0 0 0 1 0" result="l"/>
        <feConvolveMatrix in="l" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" result="e"/>
        <feColorMatrix in="e" values={`0 0 0 0 ${R} 0 0 0 0 ${G} 0 0 0 0 ${B} 7 0 0 0 -.35`} result="ln"/>
        <feComposite in="ln" in2="SourceAlpha" operator="in" result="c"/>
        <feGaussianBlur in="c" stdDeviation="1.6" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="c"/><feMergeNode in="c"/></feMerge>
      </filter>,
      <filter key={'f'+room} id={'mo-fill-'+k} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
        <feColorMatrix values={`${R*.2126} ${R*.7152} ${R*.0722} 0 0 ${G*.2126} ${G*.7152} ${G*.0722} 0 0 ${B*.2126} ${B*.7152} ${B*.0722} 0 0 0 0 0 1 0`}/>
      </filter>];})}
    <filter id="xr-ch-red" colorInterpolationFilters="sRGB"><feColorMatrix values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/></filter>
    <filter id="xr-ch-cyan" colorInterpolationFilters="sRGB"><feColorMatrix values="0 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"/></filter>
  </defs></svg>;
}
