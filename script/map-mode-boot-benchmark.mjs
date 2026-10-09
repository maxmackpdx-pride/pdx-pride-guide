import {chromium,devices} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
// Run against a built local preview: node script/map-mode-boot-benchmark.mjs --url http://127.0.0.1:5050 --runs 3 --out .local/map-mode-boot.json
const args=Object.fromEntries(process.argv.slice(2).reduce((pairs,value,index,list)=>value.startsWith('--')?[...pairs,[value.slice(2),list[index+1]]]:pairs,[]));
const base=args.url||'http://127.0.0.1:5050',runs=Number(args.runs||1),output=args.out||'.local/map-mode-boot.json';
fs.mkdirSync(path.dirname(output),{recursive:true});
const browser=await chromium.launch({executablePath:args.browser||process.env.MAPZ_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:args.headless==='1'});
const results=[];
try{for(let run=0;run<runs;run++)for(const profile of args.profile?[args.profile]:['desktop','phone'])for(const mode of args.mode?[args.mode]:['map','outzide']){
 const context=await browser.newContext(profile==='phone'?devices['iPhone 13']:{viewport:{width:1280,height:800}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));
 await page.addInitScript(()=>{window.__firstMapFrame=null;window.addEventListener('message',e=>{if(['first-frame','map-ready'].includes(e.data?.type)&&window.__firstMapFrame===null)window.__firstMapFrame=performance.now();});});
 const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:40,downloadThroughput:10*1024*1024/8,uploadThroughput:5*1024*1024/8});if(profile==='phone')await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 for(const cache of ['cold','warm']){
  await page.goto(base+'/'+mode,{waitUntil:'domcontentloaded'});
  try{await page.waitForFunction(()=>window.__firstMapFrame!==null,null,{timeout:30000});const iframe=page.frames().find(f=>f.url().includes("-map/index.html"));const frameTiming=await iframe.evaluate(()=>({start:performance.timeOrigin,phase:document.documentElement.dataset.mapPhase,resources:performance.getEntriesByType("resource").map(e=>({name:e.name,duration:e.duration,bytes:e.transferSize}))}));const timing=await page.evaluate(()=>({readyMs:window.__firstMapFrame,resources:performance.getEntriesByType('resource').map(e=>({name:e.name,duration:e.duration,bytes:e.transferSize}))}));results.push({run,profile,mode,cache,...timing,frameTiming,errors});console.log(JSON.stringify({run,profile,mode,cache,readyMs:timing.readyMs,errors}));if(run===0&&cache==='cold')await page.screenshot({path:output.replace(/\.json$/,'')+`-${profile}-${mode}-cold.png`});const beforeInput=await iframe.evaluate(()=>window.__zaylistMap.getCenter().toArray());await iframe.locator('canvas.maplibregl-canvas').focus();await page.keyboard.press('ArrowRight');await iframe.waitForFunction(center=>window.__zaylistMap.getCenter().toArray().some((value,index)=>Math.abs(value-center[index])>1e-8),beforeInput,{timeout:5000});results[results.length-1].inputResponded=true;}
  catch(e){console.log(profile,mode,cache,e.message,errors);results.push({run,profile,mode,cache,failure:e.message,errors});}
 }
 if(profile==='desktop'&&run===0&&args.switches!=='0'){
  const expected=mode==='map'?{center:[-132.352175,53.612374],zoom:2.712375,pitch:0,bearing:17.125}:{center:[-123.14235174,48.82375419],zoom:6.712375,pitch:34,bearing:-32.125};
  const frame=page.frames().find(f=>f.url().includes('-map/index.html'));await frame.evaluate(camera=>window.__zaylistMap.jumpTo(camera),expected);
  for(let step=0;step<3;step++){
   const destination=(mode==='map')===(step%2===0)?'OutZide':'Portland';await page.evaluate(()=>window.__firstMapFrame=null);const start=Date.now();await page.locator('.map-switch').getByText(destination,{exact:true}).click();await page.waitForFunction(()=>window.__firstMapFrame!==null&&document.querySelector('iframe')?.contentWindow?.__zaylistMap?.loaded(),null,{timeout:30000});
   const current=page.frames().find(f=>f.url().includes('-map/index.html'));const camera=await current.evaluate(()=>{const m=window.__zaylistMap;return {center:m.getCenter().toArray(),zoom:m.getZoom(),pitch:m.getPitch(),bearing:m.getBearing()};});console.log(JSON.stringify({profile,from:mode,switch:destination,ms:Date.now()-start,camera}));const preserved=camera.center.every((value,index)=>Math.abs(value-expected.center[index])<1e-8)&&['zoom','pitch','bearing'].every(key=>Math.abs(camera[key]-expected[key])<1e-8);results.push({profile,from:mode,switch:destination,ms:Date.now()-start,camera,preserved});await page.waitForTimeout(2000);const settled=await current.evaluate(()=>{const m=window.__zaylistMap;return {center:m.getCenter().toArray(),zoom:m.getZoom(),pitch:m.getPitch(),bearing:m.getBearing()};});const stable=settled.center.every((value,index)=>Math.abs(value-expected.center[index])<1e-8)&&['zoom','pitch','bearing'].every(key=>Math.abs(settled[key]-expected[key])<1e-8);results.push({profile,switch:destination,settledCamera:settled,preserved:stable});
  }
 }
 await page.screenshot({path:output.replace(/\.json$/,'')+`-${profile}-${mode}.png`});await context.close();
}
}finally{fs.writeFileSync(output,JSON.stringify({network:{mbps:10,latencyMs:40},phoneCpuThrottle:4,results},null,2));await browser.close();}

const failures=results.filter(result=>result.failure||result.errors?.length||result.preserved===false||result.readyMs>=3000||result.ms>=3000);
if(failures.length){console.error(`${failures.length} boot or continuity checks failed; see ${output}`);process.exitCode=1;}
