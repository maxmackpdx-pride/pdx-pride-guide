import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {webkit} from 'playwright';
import fs from 'node:fs';
import vm from 'node:vm';


test('owned raster/DEM bitmaps close on cancellation, upload failure and decode failure',async()=>{
 const vendor=fs.readFileSync('client/public/home-flight/vendor/maplibre-gl-5.6.2.js','utf8');
 const demClass=vendor.indexOf('class W extends q{constructor(e,i,o,r){super(e,i,o,r),this.type="raster-dem"');
 const rasterStart=vendor.lastIndexOf('}loadTile(e){',demClass)+1,demStart=vendor.indexOf('}loadTile(e){',demClass)+1;
 const bodies={raster:vendor.slice(rasterStart,vendor.indexOf('abortTile(e){',rasterStart)),dem:vendor.slice(demStart,vendor.indexOf('readImageNow(e){',demStart))};
 const runGenerator=generator=>new Promise((resolve,reject)=>{const g=generator();const advance=(method,value)=>{let next;try{next=g[method](value);}catch(e){reject(e);return;}if(next.done)resolve(next.value);else Promise.resolve(next.value).then(v=>advance('next',v),e=>advance('throw',e));};advance('next');});
 for(const kind of ['raster','dem'])for(const mode of ['success','aborted','failure']){
  class Bitmap{width=256;height=256;closes=0;close(){this.closes++;}}
  const bitmap=new Bitmap(),fail=()=>{if(mode==='failure')throw Error('expected decode/upload failure');};
  const module={_:(_self,_args,_promise,generator)=>runGenerator(generator.bind(_self)),b:value=>value instanceof Bitmap,W:()=>false,T:class{constructor(){fail();}bind(){}}};
  const source=vm.runInNewContext('({'+bodies[kind]+'})',{t:module,p:{getImage:async()=>({data:bitmap})},AbortController});
  Object.assign(source,{tiles:[],scheme:'xyz',id:'test',type:kind,encoding:'terrarium',_getNeighboringTiles:()=>({}),readImageNow:async()=>{fail();return{width:258,height:258,data:new Uint8Array(258*258*4)};},dispatcher:{getActor:()=>({sendAsync:async()=>({})})},map:{getPixelRatio:()=>1,_requestManager:{transformRequest:()=>({})},painter:{context:{gl:{RGBA:1,LINEAR:2,CLAMP_TO_EDGE:3,LINEAR_MIPMAP_NEAREST:4}},getTileTexture:()=>null}}});
  const tile={uid:1,tileID:{canonical:{url:()=> 'fixture://tile'}},aborted:mode==='aborted'};
  if(mode==='failure')await assert.rejects(source.loadTile(tile),/expected decode\/upload failure/);else await source.loadTile(tile);
  assert.equal(bitmap.closes,1,kind+' '+mode);assert.equal(tile.state,mode==='failure'?'errored':mode==='aborted'?'unloaded':'loaded');
 }
});

test('vendored raster and DEM release owned bitmaps while preserving pixels and borrowed images',{timeout:45000},async()=>{
 const app=express();app.get('/fixture',(_q,r)=>r.type('html').send('<style>body{margin:0}#map{width:256px;height:256px}</style><div id="map"></div><script src="/home-flight/vendor/maplibre-gl-5.6.2.js"></script>'));app.use(express.static('client/public'));
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});let browser;
 try{
  browser=await webkit.launch();const page=await browser.newPage(),errors=[],workers=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('worker',w=>{const row={worker:w};workers.push(row);row.ready=w.evaluate(()=>{self.__bitmapCloses=0;const close=ImageBitmap.prototype.close;ImageBitmap.prototype.close=function(...args){self.__bitmapCloses++;return close.apply(this,args);};}).catch(()=>{});});
  await page.goto(`http://127.0.0.1:${server.address().port}/fixture`);
  const result=await page.evaluate(async()=>{
   const check=(v,m)=>{if(!v)throw Error(m);},pause=ms=>new Promise(r=>setTimeout(r,ms));
   const until=async fn=>{for(let i=0;i<400;i++){if(fn())return;await pause(25);}throw Error('Raster fixture did not settle');};
   const records=[],lookup=new WeakMap(),create=window.createImageBitmap,close=ImageBitmap.prototype.close;
   window.createImageBitmap=(...args)=>create(...args).then(bitmap=>{const row={bitmap,closes:0,detachedAtClose:false};records.push(row);lookup.set(bitmap,row);return bitmap;});
   ImageBitmap.prototype.close=function(...args){const row=lookup.get(this);if(row){row.closes++;row.detachedAtClose=this.width===0;}return close.apply(this,args);};
   const png=async color=>{const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle=color;x.fillRect(0,0,256,256);return(await new Promise(r=>c.toBlob(r))).arrayBuffer();};
   const raster=await png('rgb(20,140,90)'),dem=await png('rgb(128,12,64)');
   maplibregl.addProtocol('fixture-raster',async()=>({data:raster.slice(0)}));maplibregl.addProtocol('fixture-dem',async()=>({data:dem.slice(0)}));
   const map=new maplibregl.Map({container:'map',center:[0,0],zoom:0,interactive:false,fadeDuration:0,canvasContextAttributes:{preserveDrawingBuffer:true},style:{version:8,sources:{raster:{type:'raster',tiles:['fixture-raster://tile/{z}/{x}/{y}'],tileSize:256,maxzoom:0},dem:{type:'raster-dem',tiles:['fixture-dem://tile/{z}/{x}/{y}'],tileSize:256,maxzoom:0,encoding:'terrarium'}},layers:[{id:'raster',type:'raster',source:'raster',paint:{'raster-fade-duration':0}},{id:'shade',type:'hillshade',source:'dem',paint:{'hillshade-exaggeration':0}}]}});
   await new Promise(resolve=>map.once('load',resolve));await until(()=>map.areTilesLoaded()&&Object.values(map.style.sourceCaches.dem._tiles).some(t=>t.dem));
   const tile=Object.values(map.style.sourceCaches.dem._tiles).find(t=>t.dem);check(tile,'DEM loaded');check(Math.abs(tile.dem.get(10,10)-12.25)<.001,'DEM values preserved after bitmap release');
   await new Promise(resolve=>{map.once('render',resolve);map.triggerRepaint();});
   const gl=map.painter.context.gl,pixel=new Uint8Array(4);gl.readPixels(128,128,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
   check(Math.abs(pixel[0]-20)<=2&&Math.abs(pixel[1]-140)<=2&&Math.abs(pixel[2]-90)<=2&&pixel[3]===255,'raster pixels preserved: '+pixel);
   check(records.length>=2,'actual raster and DEM bitmap decodes occurred');check(records.every(r=>r.closes===1),'every owned main-thread bitmap closed exactly once');
   const ownedCount=records.length,transferred=records.filter(r=>r.detachedAtClose).length;
   const c=document.createElement('canvas');c.width=c.height=2;const borrowed=await createImageBitmap(c);map.addImage('borrowed-test',borrowed);check(borrowed.width===2&&lookup.get(borrowed).closes===0,'caller-owned addImage bitmap remains usable');borrowed.close();
   window.__bitmapTestMap=map;return{ownedCount,transferred,pixel:[...pixel],elevation:tile.dem.get(10,10)};
  });
  await Promise.all(workers.map(r=>r.ready));let workerCloses=0;for(const row of workers)workerCloses+=await row.worker.evaluate(()=>self.__bitmapCloses||0).catch(()=>0);
  await page.evaluate(()=>window.__bitmapTestMap.remove());
  assert.equal(errors.length,0,errors.join('\n'));assert.ok(result.ownedCount>=2);assert.ok(workerCloses>=result.transferred,`Transferred bitmaps closed in worker (${workerCloses}/${result.transferred})`);
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
});
