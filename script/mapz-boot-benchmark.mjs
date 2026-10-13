// node --import tsx script/mapz-boot-benchmark.mjs --root dist/public --out .local/mapz-boot/after.json
// --map-root supplies an unchanged mapz-map snapshot for a before run.
// --url measures an existing app route instead of the standalone scene.
import {chromium,devices} from 'playwright';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {mapzPrecompressed} from '../server/mapzStatic.ts';
const args=Object.fromEntries(process.argv.slice(2).reduce((pairs,value,index,list)=>value.startsWith('--')?[...pairs,[value.slice(2),list[index+1]]]:pairs,[]));
const root=path.resolve(args.root||'client/public'),runs=Number(args.runs||3);
const network={mbps:Number(args['network-mbps']||10),latencyMs:Number(args['latency-ms']||40)};
const phoneDevice=args.device||'iPhone 13',phoneCpuThrottle=Number(args['phone-cpu']||4);
if(!devices[phoneDevice]||!Number.isFinite(network.mbps)||network.mbps<=0||!Number.isFinite(network.latencyMs)||network.latencyMs<0||!Number.isFinite(phoneCpuThrottle)||phoneCpuThrottle<1)throw new Error('Invalid benchmark device or connection profile');
const app=express();app.use(mapzPrecompressed(root));
// The baseline's live edge serves gzip text and uncompressed GLBs. Reproduce
// that here so compression gains are not compared against an inflated baseline.
app.use((req,res,next)=>{
 let file=path.resolve(root,'.'+req.path);
 if(!file.startsWith(root+path.sep))return next();
 if(args['map-root']&&req.path.startsWith('/mapz-map/'))file=path.join(path.resolve(args['map-root']),req.path.slice('/mapz-map/'.length));
 if(!fs.existsSync(file)||!fs.statSync(file).isFile())return next();
 if(/\.(js|css|html)$/.test(file)&&req.acceptsEncodings('gzip','identity')==='gzip'){
  res.type(path.extname(file)).set('Content-Encoding','gzip').set('Cache-Control',file.endsWith('.html')?'public, max-age=0':'public, max-age=14400').end(gzipSync(fs.readFileSync(file)));
 }else res.sendFile(file,{dotfiles:'allow'});
});
const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
const url=args.url||`http://127.0.0.1:${server.address().port}/mapz-map/index.html`;
let browser;
try{browser=await chromium.launch({headless:args.headed!=='1',executablePath:args.browser||process.env.MAPZ_CHROME_PATH,args:args.software==='1'?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});}catch(error){server.close();throw error;}
const results=[];
try{
 for(const profile of (args.profile?[args.profile]:['desktop','phone']))for(let run=0;run<runs;run++){
  const context=await browser.newContext(profile==='phone'?{...devices[phoneDevice],}:{viewport:{width:1280,height:800}});
  const page=await context.newPage(),cdp=await context.newCDPSession(page);
  await cdp.send('Network.enable');
  // Explicitly defined network for both profiles; phone CPU emulation is
  // comparative evidence only, never a claim about physical Safari performance.
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:network.latencyMs,downloadThroughput:network.mbps*1024*1024/8,uploadThroughput:5*1024*1024/8});
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:profile==='phone'?phoneCpuThrottle:1});
   await page.addInitScript(()=>{
    window.__mapzBench={firstFrame:null,firstPins:null,controlsReady:null,layouts:0,draws:0,longTasks:[],pending:0,lastActivity:0,failures:[]};
    const stats=window.__mapzBench;
    window.addEventListener('message',event=>{if(event.origin!==location.origin||event.data?.source!=='mapz-demo')return;if(event.data.type==='first-frame'&&stats.firstFrame===null)stats.firstFrame=performance.now();if(event.data.type==='pins-painted'&&stats.firstPins===null)stats.firstPins=performance.now();});
    new MutationObserver(()=>{if(stats.controlsReady===null&&document.querySelector('.mapz-demo-navigation button[aria-label="Zoom in"]'))stats.controlsReady=performance.now();}).observe(document,{subtree:true,childList:true});
    const rect=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=function(...args){stats.layouts++;return rect.apply(this,args);};
    const clear=CanvasRenderingContext2D.prototype.clearRect;CanvasRenderingContext2D.prototype.clearRect=function(...args){if(this.canvas.id==='waypoint-lights')stats.draws++;return clear.apply(this,args);};
    new PerformanceObserver(()=>{stats.lastActivity=performance.now();}).observe({type:'resource',buffered:true});
    new PerformanceObserver(list=>{for(const e of list.getEntries())stats.longTasks.push({start:e.startTime,duration:e.duration});}).observe({type:'longtask',buffered:true});
    new MutationObserver(()=>{if(document.documentElement?.dataset.mapPhase==='first-frame'&&stats.firstFrame===null)stats.firstFrame=performance.now();}).observe(document,{subtree:true,attributes:true,attributeFilter:['data-map-phase']});
    const send=XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send=function(...params){stats.pending++;stats.lastActivity=performance.now();this.addEventListener('loadend',()=>{stats.pending--;stats.lastActivity=performance.now();if(this.status<200||this.status>=400)stats.failures.push('XHR '+this.status+' '+this.responseURL);},{once:true});return send.apply(this,params);};
   });
  for(const cache of (args.cache?[args.cache]:['cold','warm'])){
   if(args.cpu==='1'){await cdp.send('Profiler.enable');await cdp.send('Profiler.start');}
   const errors=[],cancellations=[];const onError=e=>errors.push(e.message);const onFailed=r=>(r.failure()?.errorText==='net::ERR_ABORTED'?cancellations:errors).push(r.failure()?.errorText+' '+r.url());const onResponse=r=>{if(r.status()>=400&&!(r.status()===401&&new URL(r.url()).pathname==='/api/auth/me'))errors.push(r.status()+' '+r.url());};page.on('pageerror',onError);page.on('requestfailed',onFailed);page.on('response',onResponse);
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
   if(args.url&&!new URL(url).pathname.includes('/mapz-map/index.html'))await page.waitForSelector('iframe[src*="/mapz-map/index.html"]',{timeout:90000});
   const frame=page.frames().find(f=>f.url().includes('/mapz-map/index.html'))||page.mainFrame();
   let result;
   try{
    await frame.waitForFunction(()=>{
     const map=window.__mapzMap,stats=window.__mapzBench;
     if(!map||(!stats?.firstFrame&&document.documentElement.dataset.mapPhase!=='first-frame')||!map.areTilesLoaded()||stats.pending||performance.now()-stats.lastActivity<500)return false;
     const layers=['intersection-ground-lights','bridge-decks','portland-bridge-models','portland-building-models','portland-hologram-landmarks','city-sparkles'];
     for(const id of layers){const layer=map.getLayer(id);const impl=layer?.implementation||(id==='portland-bridge-models'?map.getLayer('portland-building-models')?.implementation?.bridges:null);if(!layer&&!impl)return false;if(!impl?.models)continue;
      for(const model of impl.models){const p=map.project(model.center),c=map.getCanvas();const visible=impl.visible?impl.visible(model):map.getZoom()>=12&&p.x>-350&&p.y>-350&&p.x<c.clientWidth+350&&p.y<c.clientHeight+350;if(visible&&(!model.count||!model.buffer||model.dirty||model.loading))return false;}
     }
     const overlay=document.getElementById('waypoint-lights');
     return Number(getComputedStyle(overlay).opacity)>=.99&&Number(document.getElementById('map').style.opacity)>=.99;
    },null,{timeout:Number(args['full-timeout']||90000),polling:100});
    result=await frame.evaluate(()=>({firstFrameMs:window.__mapzBench.firstFrame,fullSceneMs:performance.now(),longTasks:window.__mapzBench.longTasks,failures:window.__mapzBench.failures,resources:performance.getEntriesByType('resource').map(r=>({name:r.name,bytes:r.transferSize,duration:r.duration})),layers:window.__mapzMap.getStyle().layers.map(l=>l.id)}));
    result.performance=await frame.evaluate(async({soakMs})=>{
     const stats=window.__mapzBench,map=window.__mapzMap;
     const sample=()=>({time:performance.now(),layouts:stats.layouts,draws:stats.draws,heap:performance.memory?.usedJSHeapSize});
     const ready=sample();await new Promise(resolve=>setTimeout(resolve,3000));const stationary=sample();
     const frames=[];let last=performance.now(),animation;
     const tick=now=>{frames.push(now-last);last=now;animation=requestAnimationFrame(tick);};animation=requestAnimationFrame(tick);
     await Promise.race([new Promise(resolve=>{map.once('moveend',resolve);map.easeTo({center:[-122.675,45.524],zoom:15.5,duration:1500});}),new Promise(resolve=>setTimeout(resolve,5000))]);
     cancelAnimationFrame(animation);const interaction=sample();
     let soak=null;
     if(soakMs>0){
      const started=performance.now(),origin=performance.timeOrigin,samples=[],gestureIntervals=[];
      let previous=performance.now(),soakFrame,lastSample=started,index=0;
      const measure=now=>{if(map.isMoving())gestureIntervals.push(now-previous);previous=now;soakFrame=requestAnimationFrame(measure);};
      soakFrame=requestAnimationFrame(measure);
      const views=[{center:[-122.675,45.524],zoom:15.5},{center:[-122.65,45.52],zoom:14.5},{center:[-122.68,45.51],zoom:16}];
      try{
       while(performance.now()-started<soakMs){
        map.easeTo({...views[index++%views.length],duration:1500});
        await new Promise(resolve=>setTimeout(resolve,3000));
        if(performance.now()-lastSample>=60000){samples.push(sample());lastSample=performance.now();}
       }
      }finally{cancelAnimationFrame(soakFrame);map.stop();}
      const measuredMs=gestureIntervals.reduce((sum,value)=>sum+value,0);
      soak={method:'controlled repeated camera gestures; software GPU is not physical-phone evidence',durationMs:performance.now()-started,timeOriginUnchanged:performance.timeOrigin===origin,samples,gestureIntervals,gestureTimeMs:measuredMs,at60fpsTimeFraction:measuredMs?gestureIntervals.filter(value=>value<=1000/60).reduce((sum,value)=>sum+value,0)/measuredMs:null,freezesOver100ms:gestureIntervals.filter(value=>value>100).length};
     }
     const element=map.getContainer(),display=element.style.display;element.style.display='none';
     await new Promise(resolve=>setTimeout(resolve,300));const hiddenStart=sample();
     await new Promise(resolve=>setTimeout(resolve,2000));const hiddenEnd=sample();element.style.display=display;
     return {ready,stationary,interaction,frameIntervals:frames,soak,hidden:{method:'map container display:none with document still visible',start:hiddenStart,end:hiddenEnd}};
    },{soakMs:Number(args['soak-minutes']||0)*60000});
    const frameOffset=await frame.evaluate(()=>performance.timeOrigin)-await page.evaluate(()=>performance.timeOrigin);
    if(frame!==page.mainFrame()){const hostFirstFrame=await page.evaluate(()=>window.__mapzBench.firstFrame);result.firstFrameMs=hostFirstFrame??(result.firstFrameMs===null?null:result.firstFrameMs+frameOffset);}else if(result.firstFrameMs!==null)result.firstFrameMs+=frameOffset;result.fullSceneMs+=frameOffset;
    const hostReadiness=await page.evaluate(()=>({pinsMs:window.__mapzBench.firstPins,controlsMs:window.__mapzBench.controlsReady}));
    result.initialUsableMs=hostReadiness.pinsMs!==null&&hostReadiness.controlsMs!==null?Math.max(result.firstFrameMs,hostReadiness.pinsMs,hostReadiness.controlsMs):null;result.publicPinsMs=hostReadiness.pinsMs;result.controlsMs=hostReadiness.controlsMs;
    // Ensure an actual input still reaches the map after readiness.
    await frame.evaluate(()=>{window.__mapzBench.center=window.__mapzMap.getCenter().toArray();window.__mapzBench.zoom=window.__mapzMap.getZoom();});
    if(args.out&&run===0&&cache==='cold'){fs.mkdirSync(path.dirname(args.out),{recursive:true});await page.screenshot({path:args.out.replace(/\.json$/,'')+'-'+profile+'.png'});}
    const bounds=frame===page.mainFrame()?{x:0,y:0,width:page.viewportSize().width,height:page.viewportSize().height}:await (await frame.frameElement()).boundingBox();
    await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.wheel(0,-120);
    try{await frame.waitForFunction(()=>window.__mapzMap.getCenter().toArray().some((v,i)=>Math.abs(v-window.__mapzBench.center[i])>1e-7)||Math.abs(window.__mapzMap.getZoom()-window.__mapzBench.zoom)>1e-7,null,{timeout:5000});result.panResponded=true;}catch{result.panResponded=false;}
    if(args.retention==='1'&&frame!==page.mainFrame()){
     const before=await frame.evaluate(()=>({origin:performance.timeOrigin,camera:{center:window.__mapzMap.getCenter().toArray(),zoom:window.__mapzMap.getZoom(),pitch:window.__mapzMap.getPitch(),bearing:window.__mapzMap.getBearing()},layouts:window.__mapzBench.layouts,draws:window.__mapzBench.draws}));
     await page.evaluate(()=>{history.pushState(null,'','/boards');dispatchEvent(new PopStateEvent('popstate'));});
     await page.waitForSelector('[data-mapz-retained="paused"]',{state:'attached'});
     await page.waitForTimeout(1100);const hidden=await frame.evaluate(()=>({layouts:window.__mapzBench.layouts,draws:window.__mapzBench.draws}));
     const started=Date.now();await page.evaluate(()=>{history.pushState(null,'','/map');dispatchEvent(new PopStateEvent('popstate'));});
     await page.waitForSelector('[data-mapz-retained="active"] iframe',{state:'visible'});
     const after=await frame.evaluate(()=>({origin:performance.timeOrigin,camera:{center:window.__mapzMap.getCenter().toArray(),zoom:window.__mapzMap.getZoom(),pitch:window.__mapzMap.getPitch(),bearing:window.__mapzMap.getBearing()}}));
     result.retention={method:'programmatic SPA route away and return; includes driver overhead',restoreMs:Date.now()-started,sameIframeTimeOrigin:before.origin===after.origin,before:before.camera,after:after.camera,hiddenWork:{layouts:hidden.layouts-before.layouts,draws:hidden.draws-before.draws}};
    }
   }catch(error){
    const partial=await frame.evaluate(()=>({firstFrameMs:window.__mapzBench?.firstFrame,frameOrigin:performance.timeOrigin,phase:document.documentElement.dataset.mapPhase})).catch(()=>({firstFrameMs:null,phase:'frame-replaced'}));
    if(frame!==page.mainFrame())partial.firstFrameMs=await page.evaluate(()=>window.__mapzBench.firstFrame);else if(partial.firstFrameMs!==null&&partial.firstFrameMs!==undefined)partial.firstFrameMs+=partial.frameOrigin-await page.evaluate(()=>performance.timeOrigin);
    delete partial.frameOrigin;
    result={failure:error.message,...partial};
   }
   if(args.cpu==='1'){const cpu=await cdp.send('Profiler.stop');fs.writeFileSync(args.out+'.'+cache+'.cpuprofile',JSON.stringify(cpu.profile));}
   results.push({profile,run,cache,...result,errors,cancellations});
   console.log(JSON.stringify({profile,run,cache,firstFrameMs:result.firstFrameMs,fullSceneMs:result.fullSceneMs,failure:result.failure,errors}));
   if(args.out){fs.mkdirSync(path.dirname(args.out),{recursive:true});fs.writeFileSync(args.out,JSON.stringify({url,softwareWebGL:args.software==='1',headed:args.headed==='1',network,phoneDevice,phoneCpuThrottle,physicalPhone:false,results},null,2));}
   page.removeListener('pageerror',onError);page.removeListener('requestfailed',onFailed);page.removeListener('response',onResponse);
  }
  await context.close();
 }
}finally{await browser.close();server.close();}

if(results.some(r=>r.failure||r.errors.length||r.failures?.length||r.panResponded===false))process.exitCode=1;
