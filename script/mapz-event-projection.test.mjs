import test from 'node:test';
import assert from 'node:assert/strict';
import {createEventProjection,eventProjectionGeometry,eventProjectionSway} from '../client/public/mapz-map/event-projection.js';

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

test('cached optical texture contains no rectangular light outside the taper and releases on dispose',()=>{
  let painted;
  const canvas={width:0,height:0,getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:data=>painted=data})};
  const previous=globalThis.document;globalThis.document={createElement:()=>canvas};
  try{
    const material=createEventProjection();
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
      const across=Math.abs(x/(canvas.width-1)*2-1);
      if(across>Math.max(.002,1-y/(canvas.height-1)))assert.equal(painted.data[(y*canvas.width+x)*4+3],0);
    }
    assert.ok(painted.data[(400*canvas.width+96)*4+3]>0);
    material.dispose();assert.equal(canvas.width,1);assert.equal(canvas.height,1);
  }finally{globalThis.document=previous;}
});
