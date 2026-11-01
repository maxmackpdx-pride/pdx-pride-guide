import test from 'node:test';
import assert from 'node:assert/strict';
import {projectedHologramQuad,pointBehindHologram,clipBehindHolograms} from '../client/public/mapz-map/hologram-occlusion.js';
const matrix=[.8,0,0,0,.4,.8,0,0,0,0,1,0,0,0,-.2,1];
test('projected screen follows camera shear and masks only points behind its actual polygon',()=>{
 const region=projectedHologramQuad(matrix,100,100);
 assert.deepEqual(region.points.map(p=>[Math.round(p.x),Math.round(p.y)]),[[20,70],[60,70],[80,30],[40,30]]);
 assert.equal(pointBehindHologram({x:50,y:50},.4,[region]),true);
 assert.equal(pointBehindHologram({x:50,y:50},-.4,[region]),false);
 assert.equal(pointBehindHologram({x:23,y:32},.4,[region]),false,'transparent corner outside the projected screen stays visible');
 assert.equal(pointBehindHologram({x:50,y:50},null,[region]),false);
 assert.equal(projectedHologramQuad(matrix.map((n,i)=>i===15?-1:n),100,100),null);
});
test('clipping is bounded and overlapping surfaces use independent clips',()=>{
 const region=projectedHologramQuad(matrix,100,100),calls=[];
 const ctx=Object.fromEntries(['beginPath','rect','lineTo','moveTo','closePath','clip'].map(k=>[k,(...args)=>calls.push([k,...args])]));
 clipBehindHolograms(ctx,-.4,[region],100,100);assert.equal(calls.length,0);
 clipBehindHolograms(ctx,.4,[region],100,100,{left:90,right:100,top:0,bottom:100});assert.equal(calls.length,0);
 clipBehindHolograms(ctx,.4,[region,region],100,100);assert.equal(calls.filter(c=>c[0]==='clip').length,2);
 assert.ok(calls.filter(c=>c[0]==='clip').every(c=>c[1]==='evenodd'));
});
