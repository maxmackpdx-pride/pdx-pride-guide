import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {mapRetryHref} from '../client/public/map-foundation/camera.js';
const scene=fs.readFileSync(new URL('../client/public/mapz-map/river-flight.js',import.meta.url),'utf8');

test('retry carries the live camera without dropping destination or display options',()=>{
 const map={getCenter:()=>({lng:-123.5,lat:48.75}),getZoom:()=>7.25,getPitch:()=>0,getBearing:()=>-28};
 const url=new URL(mapRetryHref('/outzide-map/index.html?place=forest-park&guestPlace=forest-park&mapOnly=1&zoom=6#detail',map),'https://test.invalid');
 assert.equal(url.searchParams.get('lng'),'-123.5');
 assert.equal(url.searchParams.get('lat'),'48.75');
 assert.equal(url.searchParams.get('zoom'),'7.25');
 assert.equal(url.searchParams.get('pitch'),'0');
 assert.equal(url.searchParams.get('bearing'),'-28');
 assert.equal(url.searchParams.get('place'),'forest-park');
 assert.equal(url.searchParams.get('guestPlace'),'forest-park');
 assert.equal(url.searchParams.get('mapOnly'),'1');
 assert.equal(url.hash,'#detail');
 assert.equal(mapRetryHref('/outzide-map/index.html?place=forest-park'),'/outzide-map/index.html?place=forest-park');
});

test('BFCache pagehide retains the scene and pageshow resumes without navigation',()=>{
 const handlers=new Map();let stopped=0,resized=0,resumed=0,scheduled=0;
 const block=scene.slice(scene.indexOf("window.addEventListener('pagehide'"),scene.indexOf('// Interactive adapter:'));
 vm.runInNewContext(block,{
  window:{addEventListener:(event,fn)=>handlers.set(event,fn)},
  map:{stop:()=>stopped++,resize:()=>resized++},
  onVisibilityChange:()=>resumed++,scheduleFrame:()=>scheduled++,
 });
 handlers.get('pagehide')({persisted:true});
 assert.equal(stopped,1);
 handlers.get('pageshow')({persisted:true});
 assert.deepEqual([resized,resumed,scheduled],[1,1,1]);
 handlers.get('pageshow')({persisted:false});
 assert.deepEqual([resized,resumed,scheduled],[1,1,1]);
});
