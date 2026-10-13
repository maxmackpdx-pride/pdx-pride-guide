import test from 'node:test';
import assert from 'node:assert/strict';
import {screenNeighborCounts} from '../client/public/mapz-map/screen-neighbors.js';
const oldCounts=(items,radius=220)=>items.map(item=>items.filter(other=>other!==item&&Math.hypot(other.p.x-item.p.x,other.p.y-item.p.y)<radius).length);
const rows=points=>points.map(([x,y])=>({p:{x,y}}));
const compare=(items,radius)=>assert.deepEqual([...screenNeighborCounts(items,radius).counts],oldCounts(items,radius));

test('strict 220px threshold includes near edges and excludes exact radius',()=>{
 const items=rows([[0,0],[220,0],[220-1e-8,0],[220+1e-8,0],[-220,0],[-220+1e-8,0],[132,176],[132-1e-8,176],[0,0]]);
 compare(items,220);
 const result=screenNeighborCounts(rows([[0,0],[220,0]]));assert.deepEqual([...result.counts],[0,0]);
});
test('negative bins, diagonal boundaries and varying radii match original geometry',()=>{
 for(const radius of [1,10,220,650])compare(rows([[-radius-.1,-.1],[-.1,-.1],[.1,.1],[radius-.1,radius-.1],[radius,radius],[radius*2,0]]),radius);
 compare([],220);compare(rows([[NaN,0],[Infinity,0],[0,0]]),220);
});
test('2000 overlapping pins keep every neighbor and halve symmetric work',()=>{
 const items=rows(Array.from({length:2000},()=>[50,50]));const result=screenNeighborCounts(items);
 assert.equal(result.counts.every(count=>count===1999),true);assert.equal(result.checks,2000*1999/2);
});
test('2000 seeded crowded phone points and wide crowds match every original count',()=>{
 let seed=42017;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(const [width,height] of [[390,844],[1280,800],[4000,3000]]){
  const items=rows(Array.from({length:2000},()=>[random()*width-220,random()*height-220]));
  compare(items,220);const result=screenNeighborCounts(items);
  assert.ok(result.checks<2000*1999/2);
  console.log(JSON.stringify({crowd:2000,width,height,oldDistanceChecks:2000*1999,newDistanceChecks:result.checks}));
 }
});
