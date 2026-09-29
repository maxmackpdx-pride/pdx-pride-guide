// node --import tsx script/mapz-boot-benchmark.mjs --root dist/public --out .local/mapz-boot/after.json
// --map-root supplies an unchanged zaydar-map snapshot for a before run.
// --url measures an existing app route instead of the standalone scene.
import {chromium,devices} from 'playwright';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {mapzPrecompressed} from '../server/mapzStatic.ts';
const args=Object.fromEntries(process.argv.slice(2).reduce((pairs,value,index,list)=>value.startsWith('--')?[...pairs,[value.slice(2),list[index+1]]]:pairs,[]));
const root=path.resolve(args.root||'client/public'),runs=Number(args.runs||3);
const app=express();app.use(mapzPrecompressed(root));
// The baseline's live edge serves gzip text and uncompressed GLBs. Reproduce
// that here so compression gains are not compared against an inflated baseline.
app.use((req,res,next)=>{
 let file=path.resolve(root,'.'+req.path);
 if(!file.startsWith(root+path.sep))return next();
 if(args['map-root']&&req.path.startsWith('/zaydar-map/'))file=path.join(path.resolve(args['map-root']),req.path.slice('/zaydar-map/'.length));
 if(!fs.existsSync(file)||!fs.statSync(file).isFile())return next();
 if(/\.(js|css|html)$/.test(file)&&req.acceptsEncodings('gzip','identity')==='gzip'){
  res.type(path.extname(file)).set('Content-Encoding','gzip').set('Cache-Control',file.endsWith('.html')?'public, max-age=0':'public, max-age=14400').end(gzipSync(fs.readFileSync(file)));
 }else res.sendFile(file,{dotfiles:'allow'});
});
const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
const url=args.url||`http://127.0.0.1:${server.address().port}/zaydar-map/index.html`;
let browser;
try{browser=await chromium.launch({headless:args.headed!=='1',executablePath:args.browser||process.env.MAPZ_CHROME_PATH,args:args.software==='1'?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});}catch(error){server.close();throw error;}
const results=[];
try{
 for(const profile of (args.profile?[args.profile]:['desktop','phone']))for(let run=0;run<runs;run++){
  const context=await browser.newContext(profile==='phone'?{...devices['iPhone 13'],}:{viewport:{width:1280,height:800}});
  const page=await context.newPage(),cdp=await context.newCDPSession(page);
  await cdp.send('Network.enable');
  // Same 10 Mbps / 40 ms network for both profiles; phone CPU emulation is
  // comparative evidence only, never a claim about physical Safari performance.
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:40,downloadThroughput:10*1024*1024/8,uploadThroughput:5*1024*1024/8});
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:profile==='phone'?4:1});
   await page.addInitScript(()=>{
    window.__mapzBench={firstFrame:null,longTasks:[],pending:0,lastActivity:0,failures:[]};
    const stats=window.__mapzBench;
    new PerformanceObserver(()=>{stats.lastActivity=performance.now();}).observe({type:'resource',buffered:true});
    new PerformanceObserver(list=>{for(const e of list.getEntries())stats.longTasks.push({start:e.startTime,duration:e.duration});}).observe({type:'longtask',buffered:true});
    new MutationObserver(()=>{if(document.documentElement?.dataset.mapPhase==='first-frame'&&stats.firstFrame===null)stats.firstFrame=performance.now();}).observe(document,{subtree:true,attributes:true,attributeFilter:['data-map-phase']});
    const send=XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send=function(...params){stats.pending++;stats.lastActivity=performance.now();this.addEventListener('loadend',()=>{stats.pending--;stats.lastActivity=performance.now();if(this.status<200||this.status>=400)stats.failures.push('XHR '+this.status+' '+this.responseURL);},{once:true});return send.apply(this,params);};
   });
  for(const cache of ['cold','warm']){
   if(args.cpu==='1'){await cdp.send('Profiler.enable');await cdp.send('Profiler.start');}
   const errors=[];const onError=e=>errors.push(e.message);const onFailed=r=>errors.push(r.failure()?.errorText+' '+r.url());const onResponse=r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());};page.on('pageerror',onError);page.on('requestfailed',onFailed);page.on('response',onResponse);
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
   if(args.url&&!new URL(url).pathname.includes('/zaydar-map/index.html'))await page.waitForSelector('iframe[src*="/zaydar-map/index.html"]',{timeout:90000});
   const frame=page.frames().find(f=>f.url().includes('/zaydar-map/index.html'))||page.mainFrame();
   let result;
   try{
    await frame.waitForFunction(()=>{
     const map=window.__mapzMap,stats=window.__mapzBench;
     if(!map||!stats?.firstFrame||!map.areTilesLoaded()||stats.pending||performance.now()-stats.lastActivity<500)return false;
     const layers=['intersection-ground-lights','bridge-decks','portland-bridge-models','portland-building-models','portland-hologram-landmarks','city-sparkles'];
     for(const id of layers){const layer=map.getLayer(id);const impl=layer?.implementation||(id==='portland-bridge-models'?map.getLayer('portland-building-models')?.implementation?.bridges:null);if(!layer&&!impl)return false;if(!impl?.models)continue;
      for(const model of impl.models){const p=map.project(model.center),c=map.getCanvas();const visible=impl.visible?impl.visible(model):map.getZoom()>=12&&p.x>-350&&p.y>-350&&p.x<c.clientWidth+350&&p.y<c.clientHeight+350;if(visible&&(!model.count||!model.buffer||model.dirty||model.loading))return false;}
     }
     const overlay=document.getElementById('waypoint-lights');
     return Number(getComputedStyle(overlay).opacity)>=.99&&Number(document.getElementById('map').style.opacity)>=.99;
    },null,{timeout:90000,polling:100});
    result=await frame.evaluate(()=>({firstFrameMs:window.__mapzBench.firstFrame,fullSceneMs:performance.now(),longTasks:window.__mapzBench.longTasks,failures:window.__mapzBench.failures,resources:performance.getEntriesByType('resource').map(r=>({name:r.name,bytes:r.transferSize,duration:r.duration})),layers:window.__mapzMap.getStyle().layers.map(l=>l.id)}));
    const frameOffset=await frame.evaluate(()=>performance.timeOrigin)-await page.evaluate(()=>performance.timeOrigin);
    result.firstFrameMs+=frameOffset;result.fullSceneMs+=frameOffset;
    // Ensure an actual input still reaches the map after readiness.
    await frame.evaluate(()=>{window.__mapzBench.center=window.__mapzMap.getCenter().toArray();});
    if(args.out&&run===0&&cache==='cold'){fs.mkdirSync(path.dirname(args.out),{recursive:true});await page.screenshot({path:args.out.replace(/\.json$/,'')+'-'+profile+'.png'});}
    const bounds=frame===page.mainFrame()?{x:0,y:0,width:page.viewportSize().width,height:page.viewportSize().height}:await (await frame.frameElement()).boundingBox();
    await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.wheel(0,-120);
    try{await frame.waitForFunction(()=>window.__mapzMap.getCenter().toArray().some((v,i)=>Math.abs(v-window.__mapzBench.center[i])>1e-7),null,{timeout:5000});result.panResponded=true;}catch{result.panResponded=false;}
   }catch(error){result={failure:error.message,phase:await frame.evaluate(()=>document.documentElement.dataset.mapPhase)};}
   if(args.cpu==='1'){const cpu=await cdp.send('Profiler.stop');fs.writeFileSync(args.out+'.'+cache+'.cpuprofile',JSON.stringify(cpu.profile));}
   results.push({profile,run,cache,...result,errors});
   console.log(JSON.stringify({profile,run,cache,firstFrameMs:result.firstFrameMs,fullSceneMs:result.fullSceneMs,failure:result.failure,errors}));
   if(args.out){fs.mkdirSync(path.dirname(args.out),{recursive:true});fs.writeFileSync(args.out,JSON.stringify({url,softwareWebGL:args.software==='1',headed:args.headed==='1',network:{mbps:10,latencyMs:40},results},null,2));}
   page.removeListener('pageerror',onError);page.removeListener('requestfailed',onFailed);page.removeListener('response',onResponse);
  }
  await context.close();
 }
}finally{await browser.close();server.close();}

if(results.some(r=>r.failure||r.errors.length||r.failures?.length||r.panResponded===false))process.exitCode=1;
