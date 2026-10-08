import test from 'node:test';
import assert from 'node:assert/strict';
import {createEventProjection,eventProjectionGeometry,eventProjectionSway,eventProjectionColor,eventProjectionFacing,eventLightFrame} from '../client/public/mapz-map/event-projection.js';

test('light film wraps through adjacent frames and Calm Mode holds the same frame',()=>{
  assert.deepEqual(eventLightFrame(7-1/24),{frame:83,next:0,mix:.5});
  assert.deepEqual(eventLightFrame(7),eventLightFrame(0));
  for(const variant of [0,1,2])assert.deepEqual(eventLightFrame(2,variant,true),eventLightFrame(99,variant,true));
});

test('camera-facing artwork follows the projected axis with a bounded shared tilt',()=>{
  const anchor={x:200,y:600};
  const facing=x=>eventProjectionFacing(eventProjectionGeometry(anchor,{x,y:200}));
  assert.equal(facing(200).roll,0);
  assert.ok(facing(100).roll<0);assert.ok(facing(300).roll>0);
  for(const x of [-1000,100,200,300,2000]){
    const {roll,shear}=facing(x);
    assert.ok(Math.abs(roll)<=.065);assert.ok(Math.abs(shear)<=.075);
  }
});

test('the extracted light film has a gradual wrap and no embedded source colors',async()=>{
  const {default:sharp}=await import('sharp');
  for(let variant=0;variant<3;variant++){
    const {data,info}=await sharp(new URL(`../client/public/mapz-map/textures/event-light-${variant}.webp`,import.meta.url).pathname).raw().toBuffer({resolveWithObject:true});
    assert.deepEqual([info.width,info.height,info.channels],[512,2816,4]);
    const delta=(a,b)=>{
      let sum=0;
      for(let y=0;y<256;y++)for(let x=0;x<64;x++){
        const i=((Math.floor(a/8)*256+y)*512+(a%8)*64+x)*4;
        const j=((Math.floor(b/8)*256+y)*512+(b%8)*64+x)*4;
        if(data[i+3])assert.ok(data[i]===data[i+1]&&data[i+1]===data[i+2]);
        sum+=Math.abs(data[i+3]-data[j+3]);
      }
      return sum/(64*256);
    };
    const steps=Array.from({length:83},(_,i)=>delta(i,i+1)).sort((a,b)=>a-b);
    assert.ok(delta(83,0)<steps[Math.floor(steps.length*.95)]*1.5+1,'loop reset must be comparable to adjacent frames');
  }
});

test('projection remains tall and narrow at phone and desktop scales and pins its apex',()=>{
  const anchor={x:170,y:600};
  for(const scale of [.4,1,2.5])for(const height of [60,180,360]){
    const a=eventProjectionGeometry(anchor,{x:160,y:600-height},scale);
    const b=eventProjectionGeometry(anchor,{x:160+eventProjectionSway(8,2,scale),y:600-height},scale);
    assert.ok(a.height/(a.halfWidth*2)>=2.8-1e-9);
    assert.deepEqual(a.anchor,anchor);assert.deepEqual(b.anchor,anchor);
    assert.notEqual(a.x,b.x);assert.equal(a.top,b.top);
  }
  assert.equal(eventProjectionSway(30,4,2,true),0);
  assert.equal(eventProjectionSway(80,4,2,true),0);
  assert.notEqual(eventProjectionSway(8,1),eventProjectionSway(8,2));
});

test('day tokens override venue colors and respect the supplied Portland event night',()=>{
  assert.equal(eventProjectionColor({dayColor:'#0044ff',color:'#FF0000'}),'#0044FF');
  assert.equal(eventProjectionColor({eventNight:'2026-10-06',color:'#FF0000'}),'#0044FF');
  assert.equal(eventProjectionColor({eventNight:'2026-10-05'}),'#8800FF');
  assert.equal(eventProjectionColor({dayColor:'#00FFFF',eventNight:'2026-10-05'}),'#00FFFF');
});

test('cone textures preserve transparency, cache each day token and release all canvases',()=>{
  const canvases=[],noop=()=>{};
  const previous=globalThis.document;
  globalThis.document={createElement:()=>{
    const canvas={width:0,height:0,getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:data=>canvas.pixels=data.data})};canvases.push(canvas);return canvas;
  }};
  const ctx=new Proxy({globalAlpha:1,createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(target,key)=>key in target?target[key]:noop});
  try{
    const material=createEventProjection(),geometry=eventProjectionGeometry({x:150,y:500},{x:155,y:180});
    material.draw(ctx,geometry,0,0,false,'#0044FF');
    material.draw(ctx,geometry,1,0,false,'#0044FF');
    assert.equal(canvases.length,1);
    material.draw(ctx,geometry,1,0,false,'#FF6600');assert.equal(canvases.length,2);
    for(const canvas of canvases){
      const {width,height,pixels}=canvas;
      for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        const v=y/(height-1),u=x/(width-1)*2-1,t=Math.max(0,(v-.04)/.96);
        const body=v>=.04&&Math.abs(u)<=Math.max(.002,1-t),cap=u*u+((v-.04)/.04)**2<=1;
        if(!body&&!cap)assert.equal(pixels[(y*width+x)*4+3],0);
      }
      assert.ok(pixels[(400*width+96)*4+3]>0);
    }
    const i=(400*192+96)*4;
    assert.ok(canvases[0].pixels[i+2]>canvases[0].pixels[i]);
    assert.ok(canvases[1].pixels[i]>canvases[1].pixels[i+2]);
    material.dispose();for(const canvas of canvases){assert.equal(canvas.width,1);assert.equal(canvas.height,1);}
  }finally{globalThis.document=previous;}
});
