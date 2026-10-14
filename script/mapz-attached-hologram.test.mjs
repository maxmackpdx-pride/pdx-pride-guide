import test from 'node:test';
import assert from 'node:assert/strict';
import {eventCardGeometry,eventCardPerimeter,eventBeamPoint,createAttachedEventBeam,eventGlitchStage} from '../client/public/mapz-map/event-hologram-card.js';
import {visibleHologramLabels} from '../client/public/mapz-map/label-visibility.js';

test('light remains attached to the full card perimeter through scale and animation',()=>{
 const source={x:180,y:600};
 for(const scale of [.4,.72,1,1.65])for(const seconds of [0,3.5,20]){
  const card=eventCardGeometry(160+seconds,180,scale),points=eventCardPerimeter(card);
  assert.equal(Math.min(...points.map(p=>p.x)),card.left);
  assert.equal(Math.max(...points.map(p=>p.x)),card.right);
  assert.equal(Math.min(...points.map(p=>p.y)),card.top);
  assert.equal(Math.max(...points.map(p=>p.y)),card.bottom);
  for(const end of points){
   assert.deepEqual(eventBeamPoint(source,end,0,1,seconds),source);
   const tip=eventBeamPoint(source,end,1,1,seconds);
   assert.ok(Math.hypot(tip.x-end.x,tip.y-end.y)<1e-9);
   assert.deepEqual(eventBeamPoint(source,end,.4,1,seconds,true),eventBeamPoint(source,end,.4,1,99,true));
  }
 }
});

test('card collision includes its logo and footer and prioritizes the selected event',()=>{
 const card=(key,x,y)=>({...eventCardGeometry(x,y),key,opacity:1});
 const rows=[card('a',180,200),card('b',180,305),card('c',360,200)];
 assert.deepEqual(visibleHologramLabels(rows,'a',500,700).map(c=>c.key).sort(),['a','c']);
 assert.deepEqual(visibleHologramLabels(rows,'b',500,700).map(c=>c.key).sort(),['b','c']);
 assert.equal(visibleHologramLabels([card('offscreen',30,200)],null,393,740).length,0);
});

test('hidden and disposed light never allocates a canvas',()=>{
 const previous=globalThis.document;
 globalThis.document={createElement(){assert.fail('hidden effect allocated canvas');}};
 try{
  const beam=createAttachedEventBeam(),card=eventCardGeometry(160,200);
  beam.draw({globalAlpha:0},card,{x:160,y:600},0,0,false,'#00FFFF');
  beam.dispose();beam.draw({globalAlpha:1},card,{x:160,y:600},0,0,false,'#00FFFF');
 }finally{globalThis.document=previous;}
});

test('card glitches are brief, staggered, and disabled in Calm Mode',()=>{
 assert.equal(eventGlitchStage(5.8),0);
 assert.equal(eventGlitchStage(6.2),1);
 assert.equal(eventGlitchStage(6),-1);
 assert.equal(eventGlitchStage(5.8,1),-1);
 for(let t=0;t<14;t+=.01)assert.equal(eventGlitchStage(t,0,true),-1);
 assert.equal(eventGlitchStage(12.8),eventGlitchStage(5.8));
});
