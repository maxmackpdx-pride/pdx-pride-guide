import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HALLOWEEN_END,homeHalloweenActive} from '../client/src/lib/homeHalloween';
import {vineMesh,hitVines} from '../client/src/components/ui/ponies-globe-vines';
test('Halloween restores the current panel at Portland midnight, including on an open page',()=>{
  assert.equal(homeHalloweenActive(Date.parse('2026-10-10T00:00:00-07:00')),true);
  assert.equal(homeHalloweenActive(HALLOWEEN_END-1),true);
  assert.equal(homeHalloweenActive(HALLOWEEN_END),false);
  assert.equal(homeHalloweenActive(HALLOWEEN_END+1000),false);
});
test('vines grow, extend past the globe and have still-mode geometry',()=>{
  assert.equal(vineMesh(200,200,180,0,false,0).length,0);
  const full=vineMesh(200,200,180,20000,false,0);
  assert(full.length>0);
  assert(full.some(p=>p.triangles.some(t=>t.some(v=>Math.hypot(v.x-200,v.y-200)>180))));
  assert.deepEqual(vineMesh(200,200,180,0,true,0),vineMesh(200,200,180,5000,true,0));
});
test('transparent vine texture does not capture globe taps',()=>{
  const mesh=vineMesh(200,200,180,20000,true,0);
  assert.equal(hitVines(200,200,mesh,{width:1536,height:1024,data:new Uint8ClampedArray(1536*1024*4)} as ImageData,200,200,180),false);
});
test('front-facing vine artwork preserves its texture proportions as the globe turns',()=>{
  for(const yaw of [0,Math.PI/2,Math.PI,3*Math.PI/2]){
    const horizontal:number[]=[],vertical:number[]=[];
    for(const patch of vineMesh(0,0,1,0,true,yaw))for(const triangle of patch.triangles){
      for(let i=0;i<3;i++){
        const a=triangle[i],b=triangle[(i+1)%3];
        if(Math.min(a.z,b.z)<.8)continue;
        const du=Math.abs(b.u-a.u),dv=Math.abs(b.v-a.v);
        const distance=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
        if(du>0&&dv===0)horizontal.push(distance/du);
        if(dv>0&&du===0)vertical.push(distance/dv);
      }
    }
    assert(horizontal.length>0&&vertical.length>0);
    const median=(values:number[])=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)];
    const ratio=median(horizontal)/median(vertical);
    assert(ratio>.85&&ratio<1.15,`Uneven texture scaling at yaw ${yaw}: ${ratio}`);
  }
});
