// Controlled scene measurements. --baseline-app can supply the same production
// app with only a syntax repair, explicitly recorded separately from production.
import {chromium,devices} from 'playwright';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
const args=Object.fromEntries(process.argv.slice(2).reduce((out,arg,i,list)=>arg.startsWith('--')?[...out,[arg.slice(2),list[i+1]]]:out,[]));
const root=path.resolve(args.root||'client/public'),out=args.out||'.local/map-foundation-benchmark.json';
const app=express();
if(args['baseline-app'])app.get('/outzide-map/app.js',(_req,res)=>res.type('js').sendFile(path.resolve(args['baseline-app']),{dotfiles:'allow'}));
// Optional online feeds are deliberately unavailable in both local fixtures.
app.use('/api',(_req,res)=>res.status(503).json({error:'Controlled offline optional-feed fixture'}));
app.use(express.static(root));
const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
const browser=await chromium.launch({executablePath:args.browser,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
try{
 for(const profile of ['desktop','phone']){
  const context=await browser.newContext(profile==='phone'?devices['iPhone 13']:{viewport:{width:1280,height:800}});
  const page=await context.newPage(),cdp=await context.newCDPSession(page),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:40,downloadThroughput:10*1024*1024/8,uploadThroughput:5*1024*1024/8});
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:profile==='phone'?4:1});
  await page.addInitScript(()=>{
   const stats=window.__mapBench={layouts:0,draws:0,longTasks:[],frames:[],firstMap:null,content:null};
   const rect=Element.prototype.getBoundingClientRect;
   Element.prototype.getBoundingClientRect=function(...args){stats.layouts++;return rect.apply(this,args);};
   const clear=CanvasRenderingContext2D.prototype.clearRect;
   CanvasRenderingContext2D.prototype.clearRect=function(...args){if(this.canvas.classList.contains('hologram-canvas'))stats.draws++;return clear.apply(this,args);};
   new PerformanceObserver(list=>stats.longTasks.push(...list.getEntries().map(row=>({start:row.startTime,duration:row.duration})))).observe({type:'longtask',buffered:true});
   let library;
   Object.defineProperty(window,'maplibregl',{configurable:true,get:()=>library,set(value){
    library=value;let Constructor;const Original=value.Map;
    Object.defineProperty(value,'Map',{configurable:true,get:()=>Constructor,set(MapClass){Constructor=class extends MapClass{constructor(options){super(options);if(options.container==='map'){
     window.__benchMap=this;
     let tileReady=false;this.on('sourcedata',event=>{if(event.sourceId==='terrain'&&event.tile?.state==='loaded')tileReady=true;});
     this.on('render',()=>{if(stats.firstMap===null&&(tileReady||this.isSourceLoaded('terrain')))stats.firstMap=performance.now();});
    }}};}});if(Original)value.Map=Original;
   }});
   new MutationObserver(()=>{if(stats.content===null&&document.querySelector('.maplibregl-marker.waypoint-icon'))stats.content=performance.now();}).observe(document,{subtree:true,childList:true});
  });
  const url=`http://127.0.0.1:${server.address().port}/outzide-map/index.html`;
  await page.goto(url,{waitUntil:'domcontentloaded'});
  let failure;
  try{await page.waitForFunction(()=>window.__mapBench.firstMap!==null&&window.__mapBench.content!==null,null,{timeout:60000});}catch(error){failure=error.message;}
  const snapshot=()=>page.evaluate(()=>({time:performance.now(),layouts:window.__mapBench.layouts,draws:window.__mapBench.draws,heap:performance.memory?.usedJSHeapSize}));
  // Measure stationary work at the same camera after the product's later phase,
  // rather than accidentally comparing two different boot/cluster states.
  try{
   await page.waitForFunction(()=>window.__benchMap?.getLayer('i5-spectrum-0-core')&&document.querySelector('.hologram-canvas'),null,{timeout:30000});
   await page.evaluate(()=>window.__benchMap.jumpTo({center:[-122.67,45.52],zoom:9,pitch:35,bearing:0}));
   await page.waitForTimeout(3000);
  }catch(error){failure??='steady scene: '+error.message;}
  const ready=await snapshot();
  await page.screenshot({path:out.replace('.json','-'+profile+'.png')});
  await page.waitForTimeout(3000);const stationary=await snapshot();
  const motion=await page.evaluate(async()=>{
   const map=window.__benchMap;if(!map)return null;
   const deltas=[];let last=performance.now(),frame;
   const sample=now=>{deltas.push(now-last);last=now;frame=requestAnimationFrame(sample);};frame=requestAnimationFrame(sample);
   await Promise.race([new Promise(resolve=>{map.once('moveend',resolve);map.easeTo({center:[-122.62,45.56],zoom:9.5,duration:1500});}),new Promise(resolve=>setTimeout(resolve,5000))]);
   cancelAnimationFrame(frame);return {frameIntervals:deltas,center:map.getCenter().toArray(),zoom:map.getZoom()};
  });
  const beforeHidden=await snapshot();
  await page.evaluate(()=>{document.getElementById('map').style.display='none';});
  await page.waitForTimeout(2300);
  const afterHidden=await snapshot();await page.evaluate(()=>{document.getElementById('map').style.display='';});
  const stats=await page.evaluate(()=>({...window.__mapBench,diagnostic:{map:!!window.__benchMap,markers:document.querySelectorAll('.waypoint-icon').length,count:document.querySelector('#result-count').textContent}}));
  const result={profile,failure,errors,diagnostic:stats.diagnostic,firstMapMs:stats.firstMap,contentMs:stats.content,longTasks:stats.longTasks,ready,stationary,motion,hidden:{method:'map container display:none with document still visible',before:beforeHidden,after:afterHidden}};
  results.push(result);console.log(JSON.stringify({profile,failure,errors,firstMapMs:stats.firstMap,contentMs:stats.content,stationaryLayouts:stationary.layouts-ready.layouts,stationaryDraws:stationary.draws-ready.draws}));
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({root,baselineApp:args['baseline-app']||null,softwareWebGL:true,network:{mbps:10,latencyMs:40},optionalFeeds:'503 offline fixture',results},null,2));
  await context.close();
 }
}finally{await browser.close();server.close();}
if(results.some(row=>row.failure||row.errors.length))process.exitCode=1;
