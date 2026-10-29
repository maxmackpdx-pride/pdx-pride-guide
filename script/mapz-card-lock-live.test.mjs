import test from 'node:test';
import assert from 'node:assert/strict';
import {createEventCardLock,CARD_LOCK_HOLD_MS,CARD_LOCK_OFFSCREEN_PX,cardAnchorOffscreen} from '../client/public/mapz-map/event-card-motion.js';
import {e3AnchorInFront,e3CountdownText,e3CountdownParts,E3_BLENDER_MAX_SCREEN_FRACTION} from '../client/public/mapz-map/e3-lod.js';
import {appendEventCountdown} from '../client/public/mapz-map/event-countdown.js';
import {signRise,createSignLift} from '../client/public/mapz-map/screen-neighbors.js';

const item=(key,x,y,px=x,py=y)=>({feature:{properties:{key}},x,y,p:{x:px,y:py},offset:{scale:1,cardVisible:true},halfWidth:61,halfHeight:87});
const view={width:400,height:800};

test('card lock: hold is 2.5 s, starts once and is never restarted by later moves', () => {
  assert.equal(CARD_LOCK_HOLD_MS,2500);
  const lock=createEventCardLock();
  lock.apply([item('a',100,100)],0,false,false,view);
  // Pan in short bursts: move, pause, move, pause... The old lock re-armed on every new move and never let go.
  let t=0;
  for(let burst=0;burst<10;burst++){
    for(let i=0;i<10;i++,t+=16)lock.apply([item('a',100,100,120,110)],t,true,false,view);
    for(let i=0;i<20;i++,t+=16)lock.apply([item('a',100,100,120,110)],t,false,false,view);
  }
  assert.ok(t>CARD_LOCK_HOLD_MS);
  assert.equal(lock.retained(t,true).size,0,'hold ended on schedule despite the bursts');
  const it=item('a',300,300,300,300);lock.apply([it],t+16,true,false,view);
  assert.equal(it.cardLocked,undefined,'card follows its venue again');
});

test('card lock: a held card is dropped once its venue is more than 300 px off screen', () => {
  assert.equal(CARD_LOCK_OFFSCREEN_PX,300);
  assert.equal(cardAnchorOffscreen({x:-299,y:10},view),false);
  assert.equal(cardAnchorOffscreen({x:-301,y:10},view),true);
  assert.equal(cardAnchorOffscreen({x:10,y:view.height+301},view),true);
  const lock=createEventCardLock();
  lock.apply([item('a',100,100),item('b',200,100)],0,false,false,view);
  const near=item('a',0,0,150,120),far=item('b',0,0,-500,100);
  lock.apply([near,far],16,true,false,view);
  assert.equal(far.cardLocked,undefined,'off-screen venue lets go');
  assert.equal(near.cardLocked,true);
  assert.deepEqual([...lock.retained(32,true)],['a']);
  // Coming back during the hold does not snap it back to the old spot.
  const back=item('b',0,0,200,100);lock.apply([back],48,true,false,view);
  assert.equal(back.cardLocked,undefined);
});

test('3D hologram is culled when its venue point is behind the camera (w <= 0)', () => {
  assert.equal(e3AnchorInFront(.5),true);
  assert.equal(e3AnchorInFront(0),false);
  assert.equal(e3AnchorInFront(-3),false);
  assert.equal(e3AnchorInFront(NaN),false);
  assert.equal(E3_BLENDER_MAX_SCREEN_FRACTION,.30,'screen-height cap stays at 30%');
});

test('no LIVE label anywhere once an event starts; the time stays', () => {
  const now=1e12;
  assert.equal(e3CountdownText(now-1,now),'');
  const parts=e3CountdownParts(now-1,now,'9 PM');
  assert.equal(parts.length,1);assert.equal(parts[0].live,true);assert.equal(parts[0].value,'9 PM');
  assert.ok(!/live/i.test(JSON.stringify(parts.map(p=>p.value))));
  const made=[];
  globalThis.document={createElement:()=>{const n={className:'',textContent:''};made.push(n);return n;}};
  const el={dataset:{},setAttribute(){},appendChild(){}};
  appendEventCountdown(el,'STARTED');
  delete globalThis.document;
  assert.equal(el.dataset.state,'live');
  assert.ok(made.every(n=>!/live/i.test(n.textContent)),'the coin and card show only the dot');
});

test('cluster stagger survives the sky-ceiling cap and the smoothing', () => {
  // Three crowded neighbors with different stagger lifts (0, 25, 50 px), sky rise already near the ceiling.
  const ceiling=200,lifts=[0,25,50],sky=190;
  const rises=lifts.map(l=>signRise(sky,l,ceiling,50));
  assert.equal(new Set(rises).size,3,'heights stay different, never locked to one value');
  assert.ok(Math.max(...rises)<=ceiling);
  const smooth=createSignLift();let out=[];
  for(let t=0;t<4000;t+=16)out=lifts.map((l,i)=>smooth.step('k'+i,1,1,l,t,.016));
  assert.deepEqual(out.map(v=>Math.round(v)),lifts);
});
