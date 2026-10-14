import test from 'node:test';
import assert from 'node:assert/strict';
import {smoothCardVisibility} from '../client/public/mapz-map/event-card-motion.js';
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
