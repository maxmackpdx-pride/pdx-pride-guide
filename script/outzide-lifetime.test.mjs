import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const app=fs.readFileSync(new URL('../client/public/outzide-map/app.js',import.meta.url),'utf8');
test('OutZide suspends in page cache, releases resources once on exit, and cannot resume after disposal',()=>{
 const listeners={},calls=[];const hit=name=>()=>calls.push(name);
 const scope={window:{addEventListener:(type,fn)=>listeners[type]=fn},sceneDisposed:false,sceneIntervals:new Set([1,2]),clearInterval:hit('interval'),clearTimeout:hit('timeout'),steamFrame:3,toast:{timer:4},stopLocation:hit('location'),disposeCardMap:hit('detail'),mapActivity:{dispose:hit('activity')},materials:{dispose:hit('materials')},waterBloom:{dispose:hit('water')},markers:[{remove:hit('marker')}],userMarker:{remove:hit('user')},map:{stop:hit('stop'),remove:hit('map'),resize:hit('resize')},cardMap:{stop:hit('detail-stop'),resize:hit('detail-resize')},canvas:{width:500,height:500},motionPreference:{dispose:hit('motion')},renderMarkers:hit('markers'),drawHolograms:hit('draw')};
 vm.runInNewContext(app.slice(app.indexOf('// Explicit release is essential')),scope);
 listeners.pagehide({persisted:true});assert.deepEqual(calls,['stop','detail-stop']);
 listeners.pageshow({persisted:true});assert.ok(calls.includes('resize'));assert.equal(scope.sceneDisposed,false);
 calls.length=0;listeners.pagehide({persisted:false});assert.equal(scope.sceneDisposed,true);assert.equal(scope.map,null);assert.equal(scope.window.__zaylistMap,null);assert.equal(scope.canvas.width,1);assert.equal(scope.sceneIntervals.size,0);
 for(const resource of ['detail','activity','materials','water','marker','user','map','motion'])assert.equal(calls.filter(x=>x===resource).length,1,resource);
 const completed=[...calls];listeners.pagehide({persisted:false});listeners.pageshow({persisted:true});assert.deepEqual(calls,completed);
});
