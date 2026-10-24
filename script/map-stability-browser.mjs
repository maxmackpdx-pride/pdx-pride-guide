// Read-only account fixtures on a LOCAL preview only; no production mutations.
// MAP_STABILITY_URL=http://127.0.0.1:5057 MAP_SOAK_SECONDS=1800 node script/map-stability-browser.mjs
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.MAP_STABILITY_URL||'http://127.0.0.1:5057';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error('Use a local fixture, never a real account');
const seconds=Number(process.env.MAP_SOAK_SECONDS||0),summary={base,renderer:'Chrome software WebGL (SwiftShader)',viewport:{width:390,height:844},network:'Unthrottled local application assets; real provider tiles; injected failures separately',errors:[],checks:[],samples:[],started:new Date().toISOString()};
fs.mkdirSync('.local/map-stability',{recursive:true});
const output='.local/map-stability/result.json';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],ignoreDefaultArgs:['--disable-back-forward-cache']});
let page,context;
const log=(name,data={})=>{summary.checks.push({name,...data});console.log(JSON.stringify({name,...data}));fs.writeFileSync(output,JSON.stringify(summary,null,2));};
const current=()=>page.frames().find(f=>f.url().includes('/'+(page.url().includes('/outzide')?'outzide':'mapz')+'-map/index.html'));
async function ready(mode){
 await page.waitForSelector(`iframe[src*="/${mode==='map'?'mapz':'outzide'}-map/index.html"]`,{timeout:45000});
 await page.waitForFunction(mode=>{const f=document.querySelector(mode==='map'?'.mapz-demo-canvas':'.outz-map-page iframe');return !!f?.contentWindow?.__zaylistMap;},mode,{timeout:45000});
 const f=current();await f.waitForFunction(()=>document.documentElement.dataset.mapPhase==='first-frame',null,{timeout:60000});
 await page.waitForFunction(()=>!document.querySelector('.map-boot-loader'),null,{timeout:20000});
 return f;
}
async function switchTo(mode){
 await page.locator('.map-switch:visible').getByText(mode==='map'?'Portland':'OutZide',{exact:true}).click();
 return ready(mode);
}
async function readCamera(f){return f.evaluate(()=>{const m=window.__zaylistMap;return {center:m.getCenter().toArray(),zoom:m.getZoom(),pitch:m.getPitch(),bearing:m.getBearing()};});}
async function sceneToken(f){return f.evaluate(()=>window.__stabilityToken??=(Math.random()+''));}
try{
 context=await browser.newContext({viewport:summary.viewport,deviceScaleFactor:1,reducedMotion:'reduce'});
 page=await context.newPage();page.setDefaultTimeout(20000);
 page.on('pageerror',e=>{summary.errors.push(e.stack);console.log('PAGEERROR',e.stack);});
 page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text().slice(0,250));});page.on('requestfailed',r=>console.log('REQUEST FAILED',r.url().slice(0,180),r.failure()?.errorText));
 page.on('crash',()=>summary.errors.push('Browser page crashed'));
 // Keep account-dependent community feeds unavailable without touching a real account.
 let f;
 if(process.env.MAP_SOAK_ONLY!=='1'){
 await page.goto(base+'/outzide',{waitUntil:'domcontentloaded'});
 f=await ready('outzide');await page.evaluate(()=>document.querySelector('.outz-map-page iframe').contentWindow.postMessage({source:'outzide-host',type:'auth-state',allowed:true},location.origin));log('Outzide boot',{camera:await readCamera(f),markers:await f.locator('.waypoint-icon').count()});
 await f.locator('#drawer-launcher').click();
 await f.locator('#search').fill('Forest Park');
 await f.waitForFunction(()=>document.querySelectorAll('#results .place-card').length===1);
 await f.locator('#results .place-card').click();
 await f.waitForFunction(()=>document.querySelector('#detail').open);
 assert.match(await f.locator('#detail-title').textContent(),/Forest Park/);
 await f.locator('#detail [data-action="close-detail"]').click();
 await f.locator('#drawer-launcher').click();
 await f.locator('#search').fill('no-such-destination-987654');
 await f.locator('#results [data-action="clear-filters"]').click();
 assert.equal(await f.locator('#results .place-card').count(),385);
 await f.locator('#sources-button').click();
 assert.match(await f.locator('#utility-content').textContent(),/Captured|captured|Sources/);
 await f.locator('.utility-close').click();
 await f.locator('#outz-map-controls-close').click();
 log('Search, cards, empty results, reset, sources dialog');
 for(const width of [320,390,768,1280]){
  await page.setViewportSize({width,height:844});
  await f.locator('#drawer-launcher').click();
  const search=await f.locator('#search').boundingBox(),sheet=await f.locator('#outz-map-controls').boundingBox();
  assert.ok(search.x>=sheet.x-1&&search.x+search.width<=sheet.x+sheet.width+1);
  assert.equal(await f.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await f.locator('#outz-map-controls-close').click();
  log('Responsive controls',{width});
 }
 await page.setViewportSize(summary.viewport);
 // A real lost/restored WebGL context must surface an actionable local notice.
 await f.evaluate(()=>{const gl=window.__zaylistMap.getCanvas().getContext('webgl2');window.__loss=gl.getExtension('WEBGL_lose_context');window.__loss.loseContext();});
 await f.locator('#map-failure').waitFor({state:'visible'});
 await f.evaluate(()=>window.__loss.restoreContext());
 await f.locator('#map-failure').waitFor({state:'hidden'});
 log('Outzide graphics loss and restoration');
 const expected={center:[-123.142,48.823],zoom:7.2,pitch:0,bearing:-25};
 await f.evaluate(camera=>window.__zaylistMap.jumpTo(camera),expected);
 // Exercise the parent retry action with the current camera, even after startup.
 await page.evaluate(()=>{const iframe=document.querySelector('.outz-map-page iframe');window.postMessage({source:'outzide-map',type:'browse-error'},location.origin);});
 // The scene's own retry shares the same URL helper and preserves all parameters.
 await f.evaluate(()=>{document.querySelector('#map-failure').hidden=false;});
 await f.locator('#retry-map').click();
 f=await ready('outzide');
 const retried=await readCamera(f);assert.ok(retried.center.every((v,i)=>Math.abs(v-expected.center[i])<1e-6));assert.equal(retried.pitch,0);
 log('Outzide manual reboot preserves camera',{camera:retried});
 f=await switchTo('map');const token=await sceneToken(f);
 await f.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});
 assert.equal(await sceneToken(f),token);assert.ok(await f.evaluate(()=>!!window.__zaylistMap.getStyle()));
 log('Mapz BFCache restore retains renderer');
 for(let i=0;i<12;i++){
  const mode=i%2===0?'outzide':'map';f=await switchTo(mode);
  if(mode==='map')assert.equal(await sceneToken(f),token,'returning to Mapz must reuse the iframe');
  log('Room switch',{iteration:i+1,mode});
 }
 // A real Mapz loss deliberately rebuilds custom GPU assets; camera survives.
 const before=await readCamera(f);const generation=await f.frameElement().then(el=>el.getAttribute('src'));
 await f.evaluate(()=>window.__zaylistMap.getCanvas().getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
 await page.waitForFunction(src=>document.querySelector('.mapz-demo-canvas')?.getAttribute('src')!==src,generation);
 f=await ready('map');const after=await readCamera(f);assert.ok(after.center.every((v,i)=>Math.abs(v-before.center[i])<1e-5));
 log('Mapz graphics reboot restores camera',{before,after});
 }else{await page.goto(base+'/map',{waitUntil:'domcontentloaded'});f=await ready('map');}
 const mapzToken=await sceneToken(f);let expectedToken=mapzToken;
 const soakStart=Date.now();let cycle=0,mode='map';
 while(Date.now()-soakStart<seconds*1000){
  f=current();
  assert.equal(await sceneToken(f),expectedToken,'unexpected renderer reload during active browsing');
  await f.evaluate(cycle=>{const m=window.__zaylistMap,c=m.getCenter();m.easeTo({center:[c.lng+(cycle%2?.001:-.001),c.lat],bearing:(cycle%8)*5,duration:250});},cycle);
  await page.waitForTimeout(1500);
  if(cycle%10===0){
   const sample={seconds:Math.round((Date.now()-soakStart)/1000),mode,camera:await readCamera(f),memory:await page.evaluate(()=>performance.memory?{heap:performance.memory.usedJSHeapSize}:null)};
   summary.samples.push(sample);log('Soak sample',sample);
  }
  if(cycle>0&&cycle%20===0){mode=mode==='map'?'outzide':'map';f=await switchTo(mode);expectedToken=await sceneToken(f);if(mode==='map')assert.equal(expectedToken,mapzToken,'retained Mapz reloaded while away');}
  if(cycle%15===0){await page.setViewportSize({width:cycle%30===0?390:320,height:844});}
  cycle++;
 }
 log('Soak complete',{seconds:Math.round((Date.now()-soakStart)/1000),cycles:cycle});
 assert.deepEqual(summary.errors,[]);
 await page.screenshot({path:'.local/map-stability/final.png'});
 summary.passed=true;
}catch(error){summary.failure=error.stack;console.error(error);console.log('BODY',await page.locator('body').innerText().catch(()=>''));console.log('FRAMES',page.frames().map(f=>f.url()));await page.screenshot({path:'.local/map-stability/failure.png',timeout:10000}).catch(()=>{});process.exitCode=1;}
finally{summary.finished=new Date().toISOString();fs.writeFileSync(output,JSON.stringify(summary,null,2));await browser.close();}
