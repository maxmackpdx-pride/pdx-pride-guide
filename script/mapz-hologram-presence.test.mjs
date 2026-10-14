import test from 'node:test';
import assert from 'node:assert/strict';
import {hologramPresence,hologramCameraDrift,boundedHologramPosition} from '../client/public/mapz-map/hologram-presence.js';
test('distant events yield smoothly while selected events stay readable',()=>{
 let previous=hologramPresence(0,1000);
 for(let distance=0;distance<=5000;distance+=10){const next=hologramPresence(distance,1000);assert.ok(next.scale<=previous.scale&&next.opacity<=previous.opacity);assert.ok(next.scale>=.62&&next.opacity>=.38);previous=next;}
 assert.deepEqual(hologramPresence(10000,1000,true),hologramPresence(0,1000));
});
test('some heads follow camera gently, settle, and respect calm mode',()=>{
 const anchor={x:100,y:100};assert.deepEqual(hologramCameraDrift({},anchor,0,.016),{x:0,y:0});
 const prior={anchorX:500,anchorY:500,cameraX:0,cameraY:0};
 assert.deepEqual(hologramCameraDrift(prior,anchor,0,.016),{x:12,y:7});
 assert.deepEqual(hologramCameraDrift(prior,anchor,1/7,.016),{x:0,y:0});
 assert.deepEqual(hologramCameraDrift(prior,anchor,0,.016,true),{x:0,y:0});
 let previous={anchorX:100,anchorY:100,cameraX:12,cameraY:7};
 for(let i=0;i<120;i++){const drift=hologramCameraDrift(previous,anchor,0,1/60);previous={...previous,cameraX:drift.x,cameraY:drift.y};}
 assert.ok(Math.abs(previous.cameraX)<.01&&Math.abs(previous.cameraY)<.01);
});
test('dense layouts cannot pull a head away from its venue or above the ceiling',()=>{
 for(const scale of [.3,1,3])for(const x of [-9999,100,9999])for(const y of [-9999,500,9999]){
 const anchor={x:100,y:500},head=boundedHologramPosition(anchor,{x,y},scale,20,100);
 assert.ok(Math.abs(head.x-anchor.x)<=Math.min(72,48*scale)+1e-9);
 const beamHeight=anchor.y-20-(head.y-32*scale);assert.ok(beamHeight>=10-1e-9&&beamHeight<=100+1e-9);
 }
});
