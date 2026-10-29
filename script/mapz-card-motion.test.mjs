import test from 'node:test';
import assert from 'node:assert/strict';
import {smoothCardVisibility,createEventCardLock} from '../client/public/mapz-map/event-card-motion.js';
import {visibleHologramLabels} from '../client/public/mapz-map/label-visibility.js';
test('camera visibility changes fade rather than snap and converge independently of frame rate',()=>{
 const first=smoothCardVisibility(1,false,1/60);assert.ok(first>0&&first<1);
 const run=hz=>{let n=1;for(let i=0;i<hz;i++)n=smoothCardVisibility(n,false,1/hz);return n;};
 assert.ok(Math.abs(run(30)-run(60))<1e-8);assert.ok(run(60)<.001);
 assert.equal(smoothCardVisibility(1,false,.016,true),0);
});
test('retained card wins collisions as the camera center changes and may partially leave screen',()=>{
 const card=(key,x)=>({key,x,y:100,left:x-50,right:x+50,top:100,bottom:200,cardHeight:100,opacity:1});
 assert.deepEqual(visibleHologramLabels([card('a',100),card('b',150)],null,400,400,new Set(['a']),120).map(v=>v.key),['a']);
 assert.equal(visibleHologramLabels([card('a',-10)],null,400,400,new Set(['a']),120).length,1);
});

const lockedItem=(key,x,y,anchorX=x,anchorY=500)=>({feature:{properties:{key}},x,y,p:{x:anchorX,y:anchorY},offset:{scale:1,cardVisible:true},halfWidth:61,halfHeight:87});
test('settled cards hold their relative positions and scale through pan, zoom and settling',()=>{
 const lock=createEventCardLock();
 lock.apply([lockedItem('a',100,150),lockedItem('b',230,150)],0,false);
 assert.deepEqual([...lock.retained(10,true)],['a','b']);
 const items=[lockedItem('a',400,600,200),lockedItem('b',600,700,330)];
 items[0].offset.scale=2;lock.apply(items,10,true);
 assert.equal(items[0].x,122);assert.equal(items[1].x-items[0].x,130);
 assert.equal(items[0].y,150);assert.equal(items[0].offset.scale,1);
 assert.ok(items.every(item=>item.cardLocked));
 const settled=[lockedItem('a',900,900,200),lockedItem('b',950,900,330)];
 lock.apply(settled,2000,false);assert.equal(settled[0].x,122);
 assert.equal(lock.retained(2511,false).size,0);
 const released=[lockedItem('a',170,220)];lock.apply(released,2511,false);
 assert.equal(released[0].cardLocked,undefined);assert.equal(released[0].x,170);
});
test('locked cards have bounded drift, respect removal, and do not drift in Calm Mode',()=>{
 for(const calm of [false,true]){
  const lock=createEventCardLock();lock.apply([lockedItem('a',100,150),lockedItem('removed',230,150)],0,false);
  const items=[lockedItem('a',9999,9999,9999,9999)];lock.apply(items,1,true,calm);
  assert.equal(items[0].x,calm?100:190);assert.equal(items[0].y,calm?150:220);
  assert.equal(items.length,1);
 }
});
test('raised clock occupies collision space above the card',()=>{
 const card=(key,top)=>({key,x:150,y:top,left:94,right:206,top,bottom:top+112,cardHeight:112,scale:1,opacity:1});
 assert.equal(visibleHologramLabels([card('a',100),card('b',235)],null,400,700).length,1);
});
