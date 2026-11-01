import test from 'node:test';
import assert from 'node:assert/strict';
import {logoCoverage,logoTone,maskLogoPixels} from '../client/public/mapz-map/logo-mask.js';

test('cooperative masking retains exact pixels and crop bounds for every authored ink mode',async()=>{
 for(const mode of ['alpha','grayscale','light','dark','chroma','light-clean','light-faint','white-ink']){
  const width=19,height=13,actual=Uint8ClampedArray.from({length:width*height*4},(_,i)=>(i*37+i%5*17)%256),expected=actual.slice();
  // Independent reference: original two-pass algorithm.
  for(let i=0;i<expected.length;i+=4){const a=logoCoverage(...expected.slice(i,i+4),mode),tone=logoTone(...expected.slice(i,i+3),mode);expected[i]=expected[i+1]=expected[i+2]=tone;expected[i+3]=Math.round(a*255);}
  let left=width,top=height,right=0,bottom=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(expected[(y*width+x)*4+3]>32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  let clock=0,yields=0;
  const bounds=await maskLogoPixels(actual,width,height,mode,{now:()=>clock+=3,yieldTask:async()=>{yields++;}});
  assert.deepEqual(actual,expected,mode);assert.deepEqual(bounds,{left,top,right,bottom},mode);assert.ok(yields>0);
 }
});
test('disposed scenes stop processing after yielding',async()=>{
 let stopped=false,clock=0;const pixels=new Uint8ClampedArray(4*8*8);pixels.fill(200);
 assert.equal(await maskLogoPixels(pixels,8,8,'light',{now:()=>clock+=5,shouldStop:()=>stopped,yieldTask:async()=>{stopped=true;}}),null);
 assert.equal(pixels.at(-1),200);
});
test('transparent artwork retains empty crop bounds',async()=>{
 assert.deepEqual(await maskLogoPixels(new Uint8ClampedArray(16),2,2,'alpha'),{left:2,top:2,right:0,bottom:0});
});
