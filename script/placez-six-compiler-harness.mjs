/** Shared development and production-optimized React Profiler experiment.
 * Four balanced off/on pairs; correctness gates fail, timings are reported honestly.
 */
import assert from 'node:assert/strict';
import {assertCompiledFunction} from './react-compiler-function-proof.mjs';
import path from 'node:path';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {createServer,build,preview} from 'vite';
import react,{reactCompilerPreset} from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import {chromium} from 'playwright';
import sharp from 'sharp';
import {cardSourcePatterns,cardCompilerExcludedPatterns,placezCompilerModules} from './react-compiler-card-scope.mjs';
const root=path.resolve(import.meta.dirname,'..'),fixture='script/fixtures/placez-six-compiler.tsx';
const ids=[30,3,31,5,2,23],names=['Holocene','Stag PDX','Alberta Rose Theatre','Eagle Portland','Darcelle XV','Pizza Thief'];
const marker=/react(?:\/|_)compiler-runtime|useMemoCache|memo_cache_sentinel/;
const excluded=['cards/CardAPI.tsx','cards/react19Card.tsx','PlaceModal.tsx','VenueFollowButton.tsx','placez/nativeData.ts','placez/nativeModel.ts'];
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
async function fingerprint(page){return page.locator('#compiler-grid > [data-fixture-id]').evaluateAll(els=>els.map(slot=>{const el=slot.querySelector('.pz-card:not(.pz-native-expanded)');return {id:slot.getAttribute('data-fixture-id'),text:el.textContent.replace(/\s+/g,' ').trim(),images:[...el.querySelectorAll('img')].map(img=>({src:new URL(img.src).pathname,alt:img.alt})),buttons:[...el.querySelectorAll('button')].map(button=>({label:button.getAttribute('aria-label'),text:button.textContent,selected:button.getAttribute('aria-selected')}))};}));}
async function pixels(page,selector){
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode()));});
 return sharp(await page.locator(selector).screenshot({animations:'disabled',caret:'hide',scale:'css'})).ensureAlpha().raw().toBuffer({resolveWithObject:true});
}
const fixtureHtml='script/fixtures/placez-six-compiler.html';
async function prepare(mode,production){
 const cacheDir=await mkdtemp(path.join(tmpdir(),'six-compiler-'));let server;
 try{
  const config={configFile:false,root,cacheDir,publicDir:path.join(root,'client/public'),plugins:[react(),...(mode==='on'?[babel({presets:[reactCompilerPreset({compilationMode:'infer'})],include:cardSourcePatterns,exclude:cardCompilerExcludedPatterns})]:[]),{name:'six-compiler-fixture',configureServer(s){s.middlewares.use(async(req,res,next)=>{if(!req.url?.startsWith('/__six-compiler'))return next();res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml(req.url,`<!doctype html><html data-zaylist-cards="true"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/${fixture}"></script></body></html>`));});}}],resolve:{alias:{'@':path.join(root,'client/src'),'@shared':path.join(root,'shared'),'@assets':path.join(root,'attached_assets')}},server:{host:'127.0.0.1',port:0,hmr:false,watch:null},define:{__OUTZIDE_ASSETS__:JSON.stringify({script:'/outzide-map/app.js',maplibre:'/home-flight/vendor/maplibre-gl-5.6.2.js',maplibreCss:'/home-flight/vendor/maplibre-gl-5.6.2.css'}),__MAPZ_ASSETS__:'{}',__HOME_FLIGHT_BASE__:JSON.stringify('/home-flight')}};
  const expectedScope=[[`/${fixture}`,false],...placezCompilerModules.map(module=>[`/client/src/components/${module}.tsx`,mode==='on']),...excluded.map(module=>[`/client/src/components/${module}`,false])];
  const scope=[];
  if(production){
   // Same optimized Vite build + profiling renderer mechanism as the existing
   // react-production-like-card-profile-browser comparison. No app config edits.
   config.resolve.alias=[{find:'react-dom/client',replacement:'react-dom/profiling'},...Object.entries(config.resolve.alias).map(([find,replacement])=>({find,replacement}))];
   const seen=new Map();
   config.plugins.push({name:'verify-six-production-transforms',enforce:'post',transform:{order:'post',handler(code,id){
    const url='/'+path.relative(root,id.split('?')[0]).split(path.sep).join('/');
    const entry=expectedScope.find(([file])=>file===url);
    if(entry){const target=placezCompilerModules.find(module=>url===`/client/src/components/${module}.tsx`);const functionProof=target?assertCompiledFunction(code,target.split('/').pop(),mode==='on'):null;seen.set(url,{compiled:marker.test(code),functionProof});}
    return null;
   }},generateBundle(){
    for(const [url,expected] of expectedScope){assert.ok(seen.has(url),`Build did not inspect ${url}`);assert.equal(seen.get(url).compiled,expected,`Incorrect optimized build transform ${url}, mode ${mode}`);scope.push({url,...seen.get(url)});}
   }});
   config.mode='production';config.logLevel='error';
   config.build={target:['chrome107','edge107','firefox104','safari16','ios16'],outDir:path.join(cacheDir,'dist'),emptyOutDir:true,rollupOptions:{input:path.join(root,fixtureHtml)}};
   await build(config);
   server=await preview({...config,preview:{host:'127.0.0.1',port:0,strictPort:false}});
   const address=server.httpServer.address();assert.ok(address&&typeof address!=='string');
   return {url:'http://127.0.0.1:'+address.port+'/'+fixtureHtml,scope,close:async()=>{await new Promise(resolve=>server.httpServer.close(resolve));await rm(cacheDir,{recursive:true,force:true});}};
  }
  server=await createServer(config);await server.listen();
  for(const [url,expected] of expectedScope){const result=await server.transformRequest(url);assert.ok(result?.code,`Missing transform: ${url}`);const compiled=marker.test(result.code);assert.equal(compiled,expected,`Unexpected compiler transform: ${url}, mode ${mode}`);const target=placezCompilerModules.find(module=>url===`/client/src/components/${module}.tsx`);const functionProof=target?assertCompiledFunction(result.code,target.split('/').pop(),mode==='on'):null;scope.push({url,compiled,functionProof});}
  return {url:server.resolvedUrls.local[0]+'__six-compiler',scope,close:async()=>{await server.close();await rm(cacheDir,{recursive:true,force:true});}};
 }catch(error){if(server?.httpServer)await new Promise(resolve=>server.httpServer.close(resolve));else await server?.close();await rm(cacheDir,{recursive:true,force:true});throw error;}
}
async function sample(browser,mode,round,prepared){
 const {scope}=prepared;
  const results=[],visuals=[];
  for(const size of ['small','tall','wide']){
   const context=await browser.newContext({viewport:{width:1280,height:1100},reducedMotion:'reduce',serviceWorkers:'block'}),errors=[],writes=[];
   try{
    const mockPlace=id=>({id,name:names[ids.indexOf(id)],type:id===23?'restaurant':id===3||id===5?'bar':'venue',description:'Isolated compiler comparison',address:'Portland, Oregon',neighborhood:'Portland',phone:'503-555-0100',website:null,instagram:null,donateUrl:null,hours:'Fixture hours',queerOwned:false,queerFriendly:true,imageUrl:null,lat:45.52,lng:-122.67,isNew:false,isFollowing:false,upcomingEvents:[],pastEvents:[],gigs:[],spotted:[],promoters:[]});
    await context.route('**/api/**',route=>{const req=route.request();if(!['GET','HEAD'].includes(req.method())){writes.push(req.method()+' '+req.url());return route.abort();}const pathname=new URL(req.url()).pathname;return route.fulfill(pathname==='/api/auth/me'?{status:401,json:{}}:pathname==='/api/directory'?{json:ids.map(mockPlace)}:/^\/api\/directory\/\d+$/.test(pathname)?{json:mockPlace(Number(pathname.split('/').pop()))}:{json:[]});});
    const page=await context.newPage();page.setDefaultTimeout(30000);page.on('pageerror',error=>errors.push(error.message));
    // Controlled wall-clock only: real timers and performance.now are untouched.
    await page.clock.setFixedTime(new Date('2026-11-12T12:00:00.000Z'));
    await page.goto(prepared.url+`?size=${size}`,{waitUntil:'networkidle'});
    assert.equal(await page.locator('#compiler-grid .pz-card:not(.pz-native-expanded)').count(),6,'The exact six-ID cohort must render native artwork, not legacy fallback faces');
    assert.deepEqual(await page.locator('[data-fixture-id]').evaluateAll(els=>els.map(el=>Number(el.getAttribute('data-fixture-id')))),ids);
    // networkidle is not proof that query observers committed their ready data.
    await page.waitForFunction(expected=>{
     const states=window.__placezDetailReadiness?.();
     return states?.length===expected.length&&states.every((state,index)=>state.id===expected[index]&&state.status==='success'&&state.fetchStatus==='idle'&&state.dataUpdatedAt>0&&state.dataId===state.id&&state.hasVerifiedEmptyCounts);
    },ids);
    // Allow React's observer notifications to commit, then assert visible source state.
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    if(size==='wide')await page.waitForFunction(()=>{
     const counts=[...document.querySelectorAll('#compiler-grid .pz-card:not(.pz-native-expanded) .pz-activity-count strong')];
     return counts.length===12&&counts.every(count=>count.textContent==='00');
    });
    const detailReadiness=await page.evaluate(()=>window.__placezDetailReadiness());
    assert.deepEqual(detailReadiness.map(state=>state.id),ids,'All six detail sources must be observed');
    assert.ok(detailReadiness.every(state=>state.status==='success'&&state.fetchStatus==='idle'&&state.dataUpdatedAt>0&&state.dataId===state.id&&state.hasVerifiedEmptyCounts),'Every detail source must be successfully settled before measurement');
    const before=await fingerprint(page);visuals.push({size,state:'closed',...(await pixels(page,'#compiler-grid'))});
    await page.evaluate(()=>{window.__placezProfile=[];});
    for(let tick=1;tick<=10;tick++){await page.locator('#profile-tick').click();await page.waitForFunction(n=>document.querySelector('#tick')?.textContent===String(n),tick);}
    const parentCommits=await page.evaluate(()=>window.__placezProfile.slice());
    for(let tick=1;tick<=10;tick++)assert.ok(parentCommits.some(c=>c.tick===tick&&c.phase!=='mount'),`Missing update ${tick}`);
    assert.deepEqual(await fingerprint(page),before,'Parent updates changed card output');
    await page.evaluate(()=>{window.__placezProfile=[];});
    const interactionContent=[];
    for(let index=0;index<ids.length;index++){
     const slot=page.locator(`[data-fixture-id="${ids[index]}"]`),trigger=slot.getByRole('button',{name:`View details for ${names[index]}`,exact:true});
     for(let cycle=0;cycle<2;cycle++){
      await trigger.click();const expanded=page.locator('.pz-native-expanded:visible');await expanded.waitFor();
      for(const tab of ['Feed','People','Maps','Info']){await expanded.getByRole('tab',{name:tab,exact:true}).click();await expanded.getByRole('tab',{name:tab,exact:true,selected:true}).waitFor();interactionContent.push({id:ids[index],cycle,tab,text:(await expanded.innerText()).replace(/\s+/g,' ').trim()});}
      if(cycle===0)visuals.push({size,state:`expanded-${ids[index]}`,...(await pixels(page,'.pz-native-expanded:visible'))});
      await expanded.getByRole('button',{name:`Close ${names[index]}`,exact:true}).click();await expanded.waitFor({state:'hidden'});
     }
    }
    const interactionCommits=await page.evaluate(()=>window.__placezProfile.slice());
    assert.ok(interactionCommits.length>0,'Interaction profiler must record commits');
    assert.deepEqual(await fingerprint(page),before,'Close/reopen changed closed card output');assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
    const sum=commits=>{assert.ok(commits.every(c=>Number.isFinite(c.actualDurationMs)&&c.actualDurationMs>=0));return commits.reduce((sum,c)=>sum+c.actualDurationMs,0);};
    results.push({size,cohort:ids,detailReadiness,fixedWallClock:'2026-11-12T12:00:00.000Z',parentUpdates:10,cyclesPerCard:2,contentFingerprint:digest(before),interactionFingerprint:digest(interactionContent),parentActualDurationMs:sum(parentCommits),interactionActualDurationMs:sum(interactionCommits),parentCommits:parentCommits.length,interactionCommits:interactionCommits.length});
   }finally{await context.close();}
  }
  return {mode,round,scope,results,visuals};
}

const median=values=>{const sorted=[...values].sort((a,b)=>a-b);return (sorted[1]+sorted[2])/2;};
export async function runComparison({production=false}={}){
 const browser=await chromium.launch({headless:true});const trials=[],prepared={};
 try{
  // Sequential builds, reused for all balanced trials. Do not compare build time.
  prepared.off=await prepare('off',production);prepared.on=await prepare('on',production);
  for(let round=1;round<=4;round++)for(const mode of round%2?['off','on']:['on','off'])trials.push(await sample(browser,mode,round,prepared[mode]));
  const visualComparisons=[];
  for(let round=1;round<=4;round++){
   const off=trials.find(t=>t.round===round&&t.mode==='off'),on=trials.find(t=>t.round===round&&t.mode==='on');
   for(let i=0;i<off.results.length;i++){assert.equal(on.results[i].contentFingerprint,off.results[i].contentFingerprint);assert.equal(on.results[i].interactionFingerprint,off.results[i].interactionFingerprint);}
   assert.equal(on.visuals.length,off.visuals.length);
   for(let i=0;i<off.visuals.length;i++){
    const a=off.visuals[i],b=on.visuals[i];assert.equal(a.state,b.state);assert.equal(a.size,b.size);assert.equal(a.info.width,b.info.width);assert.equal(a.info.height,b.info.height);assert.equal(a.data.length,b.data.length);
    let changed=0;for(let p=0;p<a.data.length;p+=4)if([0,1,2].some(c=>Math.abs(a.data[p+c]-b.data[p+c])>16))changed++;
    const changedRatio=changed/(a.info.width*a.info.height);assert.ok(changedRatio<=0.0025,`Visual mismatch ${a.size} ${a.state}: ${changedRatio}`);visualComparisons.push({round,size:a.size,state:a.state,changedRatio});
   }
  }
  const summary=['small','tall','wide'].flatMap(size=>['parentActualDurationMs','interactionActualDurationMs'].map(metric=>{
   const off=trials.filter(t=>t.mode==='off').map(t=>t.results.find(r=>r.size===size)[metric]),on=trials.filter(t=>t.mode==='on').map(t=>t.results.find(r=>r.size===size)[metric]);
   const pairedPercent=off.map((value,i)=>value?100*(on[i]-value)/value:null);return {size,metric,off,on,offMedian:median(off),onMedian:median(on),medianChangePercent:median(off)?100*(median(on)-median(off))/median(off):null,pairedPercent,regressedPairs:pairedPercent.filter(v=>v>0).length};
  }));
  const report={build:production?'vite-production-optimized-react-dom/profiling':'vite-development',browser:browser.version(),trials:trials.map(({visuals,...trial})=>trial),summary,visualComparisons,note:(production?'Production-optimized isolated six-card fixture using react-dom/profiling, not the full route, physical device, or live traffic. Profiling instrumentation adds overhead. ':'Dev-server fixture. ')+'React Profiler actualDuration only; not end-to-end latency or production speedup. Verified six successful idle detail queries and committed counter values isolate settled-data work. Date wall-clock is fixed; timers and performance.now remain real. Initial loading and real-clock freshness are not measured. Four order-balanced pairs. Positive change means slower. Timing improvements are not asserted; all raw regressions are retained. Correctness and transform checks are gates. Production gating needs the actual app scope check, optimized whole-page runs, cross-browser functional QA and human review.'};
  const output=process.env.PLACEZ_COMPILER_REPORT||`artifacts/placez-artwork/six/compiler-${production?'production':'development'}-comparison.json`;await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2));console.log('PLACEZ_SIX_COMPILER_COMPARISON '+JSON.stringify(report));
 }finally{await browser.close();await prepared.off?.close();await prepared.on?.close();}
}
