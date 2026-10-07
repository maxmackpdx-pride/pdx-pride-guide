import test from 'node:test';
import assert from 'node:assert/strict';
import {createEventProjection,eventProjectionGeometry,eventProjectionSway,eventProjectionColor} from '../client/public/mapz-map/event-projection.js';

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
