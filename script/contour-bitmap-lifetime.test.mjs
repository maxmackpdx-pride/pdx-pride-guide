import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import express from 'express';
import {webkit} from 'playwright';
const path='client/public/mapz-map/vendor/maplibre-contour-0.1.0.js';
const source=fs.readFileSync(path,'utf8');
const rgba=new Uint8ClampedArray([128,0,0,255,128,1,128,255,127,255,0,255,129,0,64,255]);
const expected=[0,1.5,-1,256.25];
function decoder({video=false,abort=false,drawError=false,constructorError=false,copyError=false,bitmapError=false}={}){
 const counts={bitmap:0,frame:0,created:0},controller=new AbortController();
 class Canvas{
  constructor(w,h){this.width=w;this.height=h;}
  getContext(){return {fillRect(){},drawImage(){if(drawError)throw Error('draw failure');},getImageData:()=>({data:this.width===5?new Uint8ClampedArray(100):rgba.slice()})};}
 }
 class Frame{
  constructor(){if(constructorError)throw Error('frame constructor failure');this.format='RGBA';}
  allocationSize(){return 16;}
  async copyTo(out){if(copyError)throw Error('copy failure');out.set(rgba);}
  close(){counts.frame++;}
 }
 const context=vm.createContext({OffscreenCanvas:Canvas,...(video?{VideoFrame:Frame}:{}),AbortController,Blob,URL,setTimeout,clearTimeout,
  createImageBitmap:async()=>{if(bitmapError)throw Error('decode failure');counts.created++;if(abort)controller.abort();return {width:2,height:2,close(){counts.bitmap++;}};}
 });
 vm.runInContext(source,context);
 const manager=new context.mlcontour.LocalDemManager({cacheSize:1,demUrlPattern:'fixture/{z}/{x}/{y}',encoding:'terrarium',maxzoom:0,timeoutMs:1000});
 return {run:()=>manager.decodeImage({},'terrarium',controller),counts};
}
for(const video of [false,true])test(`ownership: ${video?'VideoFrame':'OffscreenCanvas'} success, abort and errors`,async()=>{
 const normal=decoder({video}),pixels=await normal.run();assert.deepEqual(Array.from(pixels.data),expected);assert.equal(normal.counts.bitmap,1);assert.equal(normal.counts.frame,video?1:0);
 const cancelled=decoder({video,abort:true});assert.equal(await cancelled.run(),null);assert.equal(cancelled.counts.bitmap,1);assert.equal(cancelled.counts.frame,0);
 const failure=decoder({video,drawError:true,copyError:video});await assert.rejects(failure.run(),/draw failure/);assert.equal(failure.counts.bitmap,1);assert.equal(failure.counts.frame,video?1:0);
 const noOwnership=decoder({video,bitmapError:true});await assert.rejects(noOwnership.run(),/decode failure/);assert.equal(noOwnership.counts.bitmap,0);
 if(video){
  const constructor=decoder({video,constructorError:true});await assert.rejects(constructor.run(),/constructor failure/);assert.equal(constructor.counts.bitmap,1);assert.equal(constructor.counts.frame,0);
  const fallback=decoder({video,copyError:true});assert.deepEqual(Array.from((await fallback.run()).data),expected);assert.equal(fallback.counts.bitmap,1);assert.equal(fallback.counts.frame,1);
 }
});

test('actual WebKit bitmap decode preserves DEM pixels and explicitly closes ownership',{timeout:30000},async()=>{
 const app=express();app.get('/fixture',(_req,res)=>res.type('html').send('<script src="/mapz-map/vendor/maplibre-contour-0.1.0.js"></script>'));app.use(express.static('client/public'));
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});let browser;
 try{
  browser=await webkit.launch();const page=await browser.newPage();
  await page.addInitScript(()=>{
   window.bitmapCounts={created:0,closed:0};const create=window.createImageBitmap.bind(window);
   window.createImageBitmap=async(...args)=>{const bitmap=await create(...args);window.bitmapCounts.created++;const close=bitmap.close.bind(bitmap);bitmap.close=()=>{window.bitmapCounts.closed++;return close();};return bitmap;};
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/fixture`);
  const result=await page.evaluate(async rgba=>{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=2;canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba),2,2),0,0);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve));
   const manager=new mlcontour.LocalDemManager({cacheSize:1,demUrlPattern:'fixture/{z}/{x}/{y}',encoding:'terrarium',maxzoom:0,timeoutMs:1000});
   const pixels=await manager.decodeImage(blob,'terrarium',new AbortController());
   const aborted=new AbortController();aborted.abort();const cancelled=await manager.decodeImage(blob,'terrarium',aborted);
   return {data:Array.from(pixels.data),cancelled,counts:window.bitmapCounts};
  },Array.from(rgba));
  assert.deepEqual(result.data,expected);assert.equal(result.cancelled,null);assert.equal(result.counts.created,2);assert.equal(result.counts.closed,2);
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
});
