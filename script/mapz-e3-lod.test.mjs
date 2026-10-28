import test from 'node:test';
import assert from 'node:assert/strict';
import {e3StageForDepth,e3StageTarget,e3VortexBlend,e3RepresentativeIndex,e3MixHex,E3_LOD_BLEND,eventDepthMeters,e3LodLevel,assignE3Levels,e3MiniScale,e3LodPlan,e3IsSameDay,
  E3_LOD_FULL_MAX_M,E3_LOD_COIN_MAX_M,E3_LOD_COMPRESSED_MAX_M,E3_LOD_BAND,E3_LOD_MAX_FULL,E3_MINI_FULL_ZOOM,E3_MINI_FAR_ZOOM,E3_MINI_SCALE_FAR} from '../client/public/mapz-map/e3-lod.js';
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

test('the mini badge is full size at zoom 15.5, 20% at zoom 12, and shrinks smoothly between', () => {
  assert.equal(E3_MINI_FULL_ZOOM,15.5);assert.equal(E3_MINI_FAR_ZOOM,12);
  assert.ok(Math.abs(e3MiniScale(15.5)-1)<1e-9);
  assert.ok(Math.abs(e3MiniScale(16.5)-1)<1e-9);
  assert.ok(Math.abs(e3MiniScale(12)-E3_MINI_SCALE_FAR)<1e-9);
  assert.ok(Math.abs(e3MiniScale(9)-E3_MINI_SCALE_FAR)<1e-9);
  let last=-Infinity;for(let z=12;z<=15.5;z+=.05){const s=e3MiniScale(z);assert.ok(s>=last-1e-12);last=s;}
  const plan=e3LodPlan('mini',{hasLogo:true,sameDay:true,zoom:13});
  assert.equal(plan.shape,'badge');assert.equal(plan.countdown,false);assert.equal(plan.maxPerVenue,1);
});

test('plans: no 2D card with a countdown banner at any level, the 2D form of a vortex is the round logo coin', () => {
  for (const level of ['vortex','coin','compressed','mini']) for (const sameDay of [true,false]) assert.equal(e3LodPlan(level,{hasLogo:true,sameDay}).countdown,false,`${level} ${sameDay}`);
  assert.equal(e3LodPlan('vortex',{hasLogo:true,sameDay:true}).shape,'coin');
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

test('zoom handoff: the vortex reaches about 2.5 zoom levels farther than the old 4500 m, then hands off to the coin', () => {
  assert.ok(E3_LOD_FULL_MAX_M/4500>=5,'at least 2.3 zoom levels (2^2.3 = 4.9) farther than before');
  assert.ok(E3_LOD_FULL_MAX_M<E3_LOD_COIN_MAX_M&&E3_LOD_COIN_MAX_M<E3_LOD_COMPRESSED_MAX_M);
  // The blends never overlap, so every form has a pure zone.
  assert.ok(E3_LOD_FULL_MAX_M*(1+E3_LOD_BLEND)<E3_LOD_COIN_MAX_M*(1-E3_LOD_BLEND));
  assert.ok(E3_LOD_COIN_MAX_M*(1+E3_LOD_BLEND)<E3_LOD_COMPRESSED_MAX_M*(1-E3_LOD_BLEND));
});

test('stage by distance is continuous and monotonic: vortex 4, coin 3, compressed 2, mini 1, smooth between', () => {
  assert.equal(e3StageForDepth(100),4);
  assert.equal(e3StageForDepth(E3_LOD_FULL_MAX_M*(1-E3_LOD_BLEND)),4);
  assert.ok(Math.abs(e3StageForDepth(E3_LOD_FULL_MAX_M)-3.5)<1e-9,'the boundary is the middle of the blend');
  assert.equal(e3StageForDepth(E3_LOD_FULL_MAX_M*(1+E3_LOD_BLEND)),3);
  assert.equal(e3StageForDepth((E3_LOD_FULL_MAX_M*(1+E3_LOD_BLEND)+E3_LOD_COIN_MAX_M*(1-E3_LOD_BLEND))/2),3,'pure coin between the blends');
  assert.ok(Math.abs(e3StageForDepth(E3_LOD_COIN_MAX_M)-2.5)<1e-9);
  assert.equal(e3StageForDepth(E3_LOD_COMPRESSED_MAX_M*3),1);
  let last=4;
  for (let d=100;d<E3_LOD_COMPRESSED_MAX_M*2;d*=1.01) {
    const s=e3StageForDepth(d);
    assert.ok(s<=last+1e-12,'never rises as the camera moves away');
    assert.ok(last-s<.08,`no pop at ${d.toFixed(0)} m (step ${(last-s).toFixed(3)})`);
    last=s;
  }
});

test('stage target: single events and non-same-day venues stop at the coin, stacks spread 3..5, capped vortex stays a coin', () => {
  const near=E3_LOD_FULL_MAX_M*.3;
  assert.equal(e3StageTarget(near,{sameDay:true,stack:false}),4);
  assert.equal(e3StageTarget(near,{sameDay:true,stack:true}),5);
  assert.equal(e3StageTarget(near,{sameDay:false}),3);
  assert.equal(e3StageTarget(near,{sameDay:true,capped:true}),3);
  const mid=E3_LOD_FULL_MAX_M;
  assert.ok(Math.abs(e3StageTarget(mid,{stack:true})-4)<1e-9,'the stack opens its second half as the coin finishes spinning up');
  assert.equal(e3StageTarget(E3_LOD_FULL_MAX_M*1.5,{sameDay:true,stack:true}),3);
});

test('vortex candidates run for the whole blend, a non-same-day venue never takes a vortex slot', () => {
  const edge=E3_LOD_FULL_MAX_M*(1+E3_LOD_BLEND);
  assert.ok(e3VortexBlend(edge*.99)>0&&e3VortexBlend(edge)===0);
  const levels=assignE3Levels([{key:'in',depthM:E3_LOD_FULL_MAX_M,onScreen:true,sameDay:true},{key:'past',depthM:edge*1.01,onScreen:true,sameDay:true},{key:'plain',depthM:100,onScreen:true,sameDay:false}]);
  assert.equal(levels.get('in'),'vortex');assert.equal(levels.get('past'),'coin');assert.equal(levels.get('plain'),'coin');
});

test('one 2D hologram per venue: the soonest upcoming event stands for it, else the latest begun', () => {
  const now=1e12,H=3600e3;
  assert.equal(e3RepresentativeIndex([{startsAtMs:now+5*H},{startsAtMs:now+2*H},{startsAtMs:now-H}],now),1);
  assert.equal(e3RepresentativeIndex([{startsAtMs:now-3*H},{startsAtMs:now-H}],now),1);
  assert.equal(e3RepresentativeIndex([],now),0);
});

test('color mix eases the coin color into the vortex tint', () => {
  assert.equal(e3MixHex('#FF0000','#00FF00',0),'#FF0000');
  assert.equal(e3MixHex('#FF0000','#00FF00',1),'#00FF00');
  assert.equal(e3MixHex('#000000','#FFFFFF',.5),'#808080');
});
