import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HALLOWEEN_END,homeHalloweenActive,HALLOWEEN_GLYPHS,HALLOWEEN_COLORS,pumpkinCarved,pumpkinDots} from '../client/src/lib/homeHalloween';
import {vineMesh,hitVines} from '../client/src/components/ui/ponies-globe-vines';
test('Halloween restores the current panel at Portland midnight, including on an open page',()=>{
  assert.equal(homeHalloweenActive(Date.parse('2026-10-10T00:00:00-07:00')),true);
  assert.equal(homeHalloweenActive(HALLOWEEN_END-1),true);
  assert.equal(homeHalloweenActive(HALLOWEEN_END),false);
  assert.equal(homeHalloweenActive(HALLOWEEN_END+1000),false);
});
test('two opposite pumpkin carvings share white dots and no other faces',()=>{
  for(let lon=-Math.PI;lon<=Math.PI;lon+=.07)for(let lat=-1;lat<=1;lat+=.07)
    assert.equal(pumpkinCarved(lon,lat,.37),pumpkinCarved(lon+Math.PI,lat,.37));
  assert.equal(pumpkinCarved(.37,.03,.37),true);
  assert.equal(pumpkinCarved(.37+Math.PI,.03,.37),true);
  assert.equal(pumpkinCarved(.37+Math.PI/2,.03,.37),false);
  assert(pumpkinDots(.37).length>20000);
  assert(pumpkinDots(.37).every(p=>p.tone===0));
});
test('ten distinct Halloween symbols use the three requested colors',()=>{
  assert.equal(Object.keys(HALLOWEEN_GLYPHS).length,10);
  assert.deepEqual(HALLOWEEN_COLORS,['#ab75ff','#ff6600','#39ff14']);
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
