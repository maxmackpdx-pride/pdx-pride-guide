import {webkit} from 'playwright';
import {test} from 'node:test';
import express from 'express';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
test('shared waypoint batches preserve peer resources and opaque hologram clipping', async()=>{
const compiled=await build({entryPoints:[fileURLToPath(new URL('../client/public/map-foundation/waypoint-objects.js',import.meta.url))],bundle:true,format:'esm',platform:'browser',write:false});
const app=express();app.get('/assets/waypoint-test/renderer.js',(_req,res)=>res.type('js').send(compiled.outputFiles[0].text));app.use(express.static(fileURLToPath(new URL('../client/public/',import.meta.url))));
const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;let browser;
try {
browser=await webkit.launch();const page=await browser.newPage({viewport:{width:430,height:932}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
await page.route('**/waypoint-test.html',r=>r.fulfill({contentType:'text/html',body:'<script type="importmap">{"imports":{"three":"/mapz-map/vendor/three/three.module.js","three/addons/":"/mapz-map/vendor/three/addons/"}}</script><canvas width="400" height="300" style="width:400px;height:300px"></canvas>'}));await page.goto(`${origin}/waypoint-test.html`);
const result=await page.evaluate(async()=>{
 const {createWaypointLayer}=await import('/assets/waypoint-test/renderer.js');const canvas=document.querySelector('canvas'),gl=canvas.getContext('webgl2',{alpha:true,preserveDrawingBuffer:true});let masks=[];
 const map={getCanvas:()=>canvas,triggerRepaint(){}};const layer=createWaypointLayer({}, {occluders:()=>masks});layer.onAdd(map,gl);
 layer.setRows([{key:'one',asset:'placez-bar',x:150,y:150,size:65,depth:0,lod:'near'},{key:'two',asset:'placez-bar',x:250,y:150,size:65,depth:0,lod:'near'}]);
 const until=Date.now()+25000;while(layer.stats().modelsLoaded<2&&Date.now()<until)await new Promise(r=>setTimeout(r,50));
 const args={defaultProjectionData:{mainMatrix:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}};
 const render=()=>{gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);layer.render(gl,args);const px=new Uint8Array(400*300*4);gl.readPixels(0,0,400,300,gl.RGBA,gl.UNSIGNED_BYTE,px);let ink=0;for(let i=3;i<px.length;i+=4)if(px[i])ink++;return ink;};
 const visiblePixels=render(),two=layer.stats();masks=[...Array.from({length:47},()=>({points:[{x:-100,y:-100},{x:-80,y:-100},{x:-80,y:-80},{x:-100,y:-80}]})),{points:[{x:0,y:0},{x:400,y:0},{x:400,y:300},{x:0,y:300}]}];const coveredPixels=render();
 masks=[];layer.setRows([{key:'two',asset:'placez-bar',x:250,y:150,size:65,depth:0,lod:'near'}]);const remainingPixels=render(),one=layer.stats();layer.onRemove();await new Promise(r=>setTimeout(r,250));return {visiblePixels,coveredPixels,remainingPixels,two,one,after:layer.stats(),canvases:document.querySelectorAll('canvas').length};
});assert.equal(result.two.loaded,2);assert.equal(result.one.loaded,1);assert.equal(result.two.drawBatches,result.one.drawBatches);assert.ok(result.visiblePixels>100);assert.equal(result.coveredPixels,0);assert.ok(result.remainingPixels>100);assert.equal(result.after.instances,0);assert.equal(result.canvases,1);assert.deepEqual(errors,[]);
}finally{await browser.close();}

} finally { await new Promise(resolve=>server.close(resolve)); }
});
