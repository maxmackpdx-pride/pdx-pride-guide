import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mapFixture,visibility} from './map-browser-helpers.mjs';
test('incidental vector maps load real style and release WebGL contexts on hide/unmount',{timeout:120000},async()=>{
 const f=await mapFixture('script/fixtures/incidental-map-browser.tsx',{webgl:true});const {page}=f;
 try{
  await page.goto(`${f.base}__map-qa?kind=card`,{waitUntil:'domcontentloaded'});await page.locator('#toggle').waitFor();
  assert.ok(await page.evaluate(()=>{const gl=document.createElement('canvas').getContext('webgl2');const ok=!!gl;gl?.getExtension('WEBGL_lose_context')?.loseContext();return ok;}),'WebGL must initialize; raster fallback is not a pass');
  await page.evaluate(()=>{window.vectorEvidence=[];document.querySelector('#toggle').click();});await page.locator('#slot').scrollIntoViewIfNeeded();
  async function capture(){
   await page.waitForFunction(()=>[...window.mapStats.active].some(m=>Object.values(m._layers).some(l=>l.getMaplibreMap?.()?.loaded())));
   const evidence=await page.evaluate(()=>{const m=[...window.mapStats.active][0],engine=Object.values(m._layers).map(l=>l.getMaplibreMap?.()).find(Boolean),canvas=engine.getCanvas(),gl=canvas.getContext('webgl2')||canvas.getContext('webgl');const record={canvas,gl,removed:false};engine.once('remove',()=>{record.removed=true;});window.vectorEvidence.push(record);return {connected:canvas.isConnected,context:!!gl,lost:gl?.isContextLost(),canLose:!!gl?.getExtension('WEBGL_lose_context'),layers:engine.getStyle().layers.map(l=>l.id),count:document.querySelectorAll('canvas.maplibregl-canvas').length};});
   assert.deepEqual(evidence,{connected:true,context:true,lost:false,canLose:true,layers:['background'],count:1});
  }
  // Installed adapter removes its MapLibre map. MapLibre remove() calls loseContext,
  // detaches canvas and fires remove. Test-only references intentionally remain for inspection.
  const released=()=>page.waitForFunction(()=>window.mapStats.active.size===0&&!document.querySelector('canvas.maplibregl-canvas')&&window.vectorEvidence.every(r=>r.removed&&!r.canvas.isConnected&&r.gl.isContextLost()));
  await capture();await page.evaluate(()=>document.querySelector('#toggle').click());await released();await page.evaluate(()=>document.querySelector('#toggle').click());await capture();await page.evaluate(()=>scrollTo(0,0));await released();await page.locator('#slot').scrollIntoViewIfNeeded();await capture();await visibility(page,true);await released();await visibility(page,false);await capture();await page.evaluate(()=>window.setMounted(false));await released();
  const count=await page.evaluate(()=>({n:window.vectorEvidence.length,created:window.mapStats.created,removed:window.mapStats.removed}));assert.equal(count.n,4);assert.equal(count.created,count.removed);assert.deepEqual(f.errors,[]);
 }finally{await f.close();}
});
