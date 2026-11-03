import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {root,mapFixture,installListenerEvidence,visibility} from './map-browser-helpers.mjs';
test('entry shell imports leaf primitives, not map-bearing barrel',async()=>{
 for(const [file,leaf] of [['PageRecovery.tsx','Button'],['ui/nav-shell.tsx','Divider']]){const source=await readFile(path.join(root,'client/src/components',file),'utf8');assert.ok(source.includes(`from "@/components/ds/${leaf}"`));assert.ok(!source.includes('from "@/components/ds"'));}
});
test('incidental maps release hidden renderers, preserve geometry/camera and listeners',{timeout:150000},async()=>{
 const f=await mapFixture('script/fixtures/incidental-map-browser.tsx');const {page,context}=f;
 try{
  await installListenerEvidence(context);await context.route('**/client/src/components/ds/PlaceCardMapCanvas.tsx*',async route=>{await new Promise(r=>setTimeout(r,400));await route.continue();});
  const active=n=>page.waitForFunction(n=>window.mapStats?.active.size===n,n);
  for(const kind of ['directory','card','outz']){
   await page.goto(`${f.base}__map-qa?kind=${kind}`,{waitUntil:'domcontentloaded'});await page.locator('#toggle').waitFor();await active(0);
   await page.locator('#toggle').click();if(kind!=='card')await page.locator('#slide').click();await page.waitForTimeout(100);await active(0);
   await page.locator('#slot').scrollIntoViewIfNeeded();
   if(kind==='card'){await page.waitForTimeout(50);await page.evaluate(()=>document.querySelector('#toggle').click());await page.waitForTimeout(500);await active(0);await page.evaluate(()=>document.querySelector('#toggle').click());}
   await active(1);const height=await page.locator('#slot').evaluate(el=>el.getBoundingClientRect().height);if(kind==='card')assert.ok(height>=230);else assert.equal(height,260);
   if(kind!=='card')await page.evaluate(()=>{[...window.mapStats.active][0].setView([45.61,-122.71],13,{animate:false});});
   for(let i=0;i<3;i++){await page.evaluate(()=>scrollTo(0,0));await active(0);await page.locator('#slot').scrollIntoViewIfNeeded();await active(1);assert.equal(await page.locator('#slot').evaluate(el=>el.getBoundingClientRect().height),height);}
   if(kind!=='card'){const view=await page.evaluate(()=>{const m=[...window.mapStats.active][0];return {lat:m.getCenter().lat,zoom:m.getZoom()};});assert.ok(Math.abs(view.lat-45.61)<.001);assert.equal(view.zoom,13);await page.evaluate(()=>document.querySelector('#slide').click());await active(0);await page.evaluate(()=>document.querySelector('#slide').click());await active(1);}
   await visibility(page,true);await active(0);await visibility(page,false);await active(1);if(kind!=='card')assert.equal(await page.evaluate(()=>[...window.mapStats.active][0].getZoom()),13);
   await page.evaluate(()=>window.setMounted(false));await active(0);const counts=await page.evaluate(()=>({created:window.mapStats.created,removed:window.mapStats.removed}));assert.equal(counts.created,counts.removed);assert.deepEqual(await page.evaluate(()=>({resize:window.mapListeners.resize.size,visibility:window.mapListeners.visibilitychange.size})),{resize:0,visibility:0});
   await page.evaluate(()=>window.setMounted(true));await page.locator('#toggle').waitFor();await active(0);
  }
  assert.deepEqual(f.errors,[]);
 }finally{await f.close();}
});
