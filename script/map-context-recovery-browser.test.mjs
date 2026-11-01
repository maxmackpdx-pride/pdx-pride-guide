import test from 'node:test';
import assert from 'node:assert/strict';
import {webkit,devices} from 'playwright';
import {startMapStabilityFixture} from './map-stability-fixture.mjs';

// Inspect actual WebGL pixels: a context-restored event and loaded() can both
// succeed while every tile still points at an invalid GPU buffer.
async function pixels(frame){return frame.evaluate(()=>{
 const map=window.__zaylistMap,canvas=map.getCanvas(),gl=canvas.getContext('webgl2');
 map.redraw();const data=new Uint8Array(canvas.width*canvas.height*4);
 gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,data);
 const colors=new Set();for(let i=0;i<data.length;i+=32)colors.add((data[i]<<16)|(data[i+1]<<8)|data[i+2]);
 return {colors:colors.size,zoom:map.getZoom(),center:map.getCenter().toArray()};
 });}
for(const route of ['/map','/outzide'])test(`${route}: graphics recovery restores visible pixels and camera`,{timeout:120000},async()=>{
 const server=process.env.MAP_RECOVERY_BASE_URL?null:await startMapStabilityFixture({sourceMaps:true}),browser=await webkit.launch();
 const base=process.env.MAP_RECOVERY_BASE_URL||'http://127.0.0.1:'+server.address().port;
 try{
 const context=await browser.newContext({...devices['iPhone 14 Pro Max']}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+route,{waitUntil:'domcontentloaded'});
 const path=route==='/map'?'/mapz-map/':'/outzide-map/';
 const current=()=>page.frames().find(f=>f.url().includes(path));
 await page.waitForFunction(path=>{const f=[...document.querySelectorAll('iframe')].find(f=>f.src.includes(path));return !!f?.contentWindow?.__zaylistMap?.loaded();},path,{timeout:60000});
 let frame=current();await page.waitForTimeout(4000);
 await frame.evaluate(route=>window.__zaylistMap.jumpTo({center:[-122.69,45.53],zoom:route==='/map'?14.2:8.3}),route);
 await page.waitForTimeout(500);const before=await pixels(frame);assert.ok(before.colors>16,'basemap rendered before loss');
 if(process.env.MAP_RECOVERY_SCREENSHOTS)await page.screenshot({path:process.env.MAP_RECOVERY_SCREENSHOTS+'/'+route.slice(1)+'-recovery-before.png'});
 if(route==='/outzide')await frame.evaluate(()=>window.__zaylistMap.addImage('recovery-pin-art',{width:2,height:2,data:new Uint8Array(16).fill(255)},{pixelRatio:2}));
 const oldUrl=frame.url();await frame.evaluate(()=>{
 const gl=window.__zaylistMap.getCanvas().getContext('webgl2'),ext=gl.getExtension('WEBGL_lose_context');
 window.__restoreForTest=()=>ext.restoreContext();ext.loseContext();
 });
 await page.waitForTimeout(500);await frame.evaluate(()=>window.__restoreForTest());
 if(route==='/map'){
  await page.waitForFunction(old=>{const f=document.querySelector('iframe[src*="/mapz-map/"]');return f&&f.src!==old&&f.contentWindow?.__zaylistMap?.loaded();},oldUrl,{timeout:60000});frame=current();
 }else assert.equal(current(),frame,'standard map retains its renderer');
 let after;for(let i=0;i<30;i++){await page.waitForTimeout(500);after=await pixels(frame);if(after.colors>16)break;}
 assert.ok(after.colors>16,`basemap has ${after.colors} colors after recovery`);
 assert.ok(Math.abs(after.zoom-before.zoom)<.05,'zoom preserved');
 assert.ok(after.center.every((v,i)=>Math.abs(v-before.center[i])<.005),'center preserved');
 if(route==='/outzide')assert.equal(await frame.evaluate(()=>window.__zaylistMap.getImage('recovery-pin-art')?.pixelRatio),2,'custom pin art survives style recovery');
 assert.deepEqual(errors,[]);
 if(process.env.MAP_RECOVERY_SCREENSHOTS)await page.screenshot({path:process.env.MAP_RECOVERY_SCREENSHOTS+'/'+route.slice(1)+'-recovery-after.png'});
 }finally{await browser.close();if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}}
});
