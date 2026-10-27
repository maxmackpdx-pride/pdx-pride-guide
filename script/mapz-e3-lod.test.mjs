import test from 'node:test';
import assert from 'node:assert/strict';
import {eventDepthMeters,e3LodLevel,assignE3Levels,e3MiniScale,e3LodPlan,e3IsSameDay,
  E3_LOD_FULL_MAX_M,E3_LOD_COIN_MAX_M,E3_LOD_COMPRESSED_MAX_M,E3_LOD_BAND,E3_LOD_MAX_FULL,E3_MINI_SCALE_NEAR,E3_MINI_SCALE_FAR,E3_MINI_FAR_M} from '../client/public/mapz-map/e3-lod.js';
import {HOLOGRAM_CAMERA_FOLLOW} from '../client/public/mapz-map/hologram-presence.js';

const map=pitch=>({getPitch:()=>pitch,transform:{cameraToCenterDistance:1000}});

test('event depth is the true camera distance: pitch and screen position both change it', () => {
  const center={x:200,y:400},top={x:200,y:40},bottom={x:200,y:760};
  assert.ok(Math.abs(eventDepthMeters(map(0),center,800,1)-1000)<1e-6,'screen center is cameraToCenterDistance away');
  assert.ok(Math.abs(eventDepthMeters(map(60),center,800,1)-1000)<1e-6,'pitch alone does not move the center');
  const flat=eventDepthMeters(map(0),top,800,1),pitched=eventDepthMeters(map(65),top,800,1);
  assert.ok(pitched>flat*1.5,'the top of a pitched view is much farther than the same point flat');
  assert.ok(eventDepthMeters(map(65),top,800,1)>eventDepthMeters(map(65),center,800,1));
  assert.ok(eventDepthMeters(map(65),bottom,800,1)<eventDepthMeters(map(65),center,800,1));
});

test('levels follow distance bands: vortex, coin, compressed, mini', () => {
  assert.equal(e3LodLevel(undefined,E3_LOD_FULL_MAX_M*.5),'vortex');
  assert.equal(e3LodLevel(undefined,(E3_LOD_FULL_MAX_M+E3_LOD_COIN_MAX_M)/2),'coin');
  assert.equal(e3LodLevel(undefined,(E3_LOD_COIN_MAX_M+E3_LOD_COMPRESSED_MAX_M)/2),'compressed');
  assert.equal(e3LodLevel(undefined,E3_LOD_COMPRESSED_MAX_M*2),'mini');
});

test('levels do not flicker on a boundary: they move only past the hysteresis band', () => {
  const edge=E3_LOD_COIN_MAX_M;
  assert.equal(e3LodLevel('coin',edge*(1+E3_LOD_BAND*.5)),'coin');
  assert.equal(e3LodLevel('coin',edge*(1+E3_LOD_BAND*1.5)),'compressed');
  assert.equal(e3LodLevel('compressed',edge*(1-E3_LOD_BAND*.5)),'compressed');
  assert.equal(e3LodLevel('compressed',edge*(1-E3_LOD_BAND*1.5)),'coin');
});

test('only the nearest venues keep the full vortex, and a current vortex keeps its slot', () => {
  const entries=Array.from({length:E3_LOD_MAX_FULL+2},(_,i)=>({key:`v${i}`,depthM:100+i*20,onScreen:true}));
  const levels=assignE3Levels(entries);
  assert.deepEqual(entries.map(e=>levels.get(e.key)),[...Array(E3_LOD_MAX_FULL).fill('vortex'),'coin','coin']);
  const offscreen=assignE3Levels([{key:'a',depthM:50,onScreen:false},{key:'b',depthM:60,onScreen:true}],new Map(),{maxFull:1});
  assert.equal(offscreen.get('b'),'vortex','an off-screen venue never uses up the cap');
  const previous=new Map([['a','vortex']]);
  const kept=assignE3Levels([{key:'a',depthM:110,onScreen:true},{key:'b',depthM:105,onScreen:true}],previous,{maxFull:1});
  assert.equal(kept.get('a'),'vortex');assert.equal(kept.get('b'),'coin');
});

test('the mini badge shrinks smoothly from half size to 20% and the plan is cheap and static', () => {
  assert.ok(Math.abs(e3MiniScale(E3_LOD_COMPRESSED_MAX_M)-E3_MINI_SCALE_NEAR)<1e-9);
  assert.ok(Math.abs(e3MiniScale(E3_MINI_FAR_M)-E3_MINI_SCALE_FAR)<1e-9);
  assert.ok(Math.abs(e3MiniScale(E3_MINI_FAR_M*5)-.2)<1e-9);
  let last=Infinity;for(let d=E3_LOD_COMPRESSED_MAX_M;d<=E3_MINI_FAR_M;d+=300){const s=e3MiniScale(d);assert.ok(s<=last+1e-12);last=s;}
  const plan=e3LodPlan('mini',{hasLogo:true,sameDay:true,depthM:5000});
  assert.equal(plan.shape,'badge');assert.equal(plan.countdown,false);assert.equal(plan.maxPerVenue,1);
});

test('plans: nearest same-day keeps the countdown, others use the E3 coin or compressed puck', () => {
  assert.equal(e3LodPlan('vortex',{hasLogo:true,sameDay:true}).countdown,true);
  assert.equal(e3LodPlan('vortex',{hasLogo:true,sameDay:false}).shape,'coin');
  assert.equal(e3LodPlan('coin',{hasLogo:true,sameDay:true}).shape,'coin');
  assert.equal(e3LodPlan('coin',{hasLogo:false}).step,'compressed');
  assert.equal(e3LodPlan('compressed',{hasLogo:true}).step,'compressed');
  assert.equal(e3IsSameDay(Date.now()+3600e3,Date.now()),true);
  assert.equal(e3IsSameDay(Date.now()+3*86400e3,Date.now()),false);
});

test('camera follow is damped to 20%', () => {
  assert.equal(HOLOGRAM_CAMERA_FOLLOW,.2);
});
