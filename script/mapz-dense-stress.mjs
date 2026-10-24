import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.MAP_STABILITY_URL||'http://127.0.0.1:5059';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error('Local public-feed fixture required');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const result={renderer:'Chrome SwiftShader',network:'Local assets, real map providers, 15-second offline segment',inputPlaces:JSON.parse(fs.readFileSync('.local/map-stability/public-directory.json')).length,inputEvents:JSON.parse(fs.readFileSync('.local/map-stability/public-events.json')).length,errors:[],checks:[]};
try{
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,reducedMotion:'reduce'}),page=await context.newPage();
 page.on('pageerror',e=>result.errors.push(e.stack));
 await page.addInitScript(()=>{window.__rows=[];window.addEventListener('message',e=>{if(e.data?.source==='mapz-host'&&e.data.type==='data')window.__rows=e.data.rows;});});
 await page.goto(base+'/map?lat=45.523&lng=-122.676&zoom=15',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('.mapz-demo-canvas')?.contentWindow?.document.documentElement.dataset.mapPhase==='first-frame',null,{timeout:90000});
 const frame=page.frames().find(f=>f.url().includes('/mapz-map/index.html'));
 await frame.waitForFunction(()=>window.__rows.length>20,null,{timeout:30000});
 result.sceneRows=await frame.evaluate(()=>__rows.length);console.log('SCENE',result.sceneRows);
 await frame.evaluate(()=>window.__denseToken=Math.random());const token=await frame.evaluate(()=>__denseToken);
 for(const width of [320,390,768,1280]){
  await page.setViewportSize({width,height:844});
  const before=await frame.evaluate(()=>__zaylistMap.getZoom());
  await page.locator('.mapz-demo-navigation').getByRole('button',{name:'Zoom in',exact:true}).click();
  await frame.waitForFunction(z=>__zaylistMap.getZoom()>z,before);
  await page.locator('.mapz-demo-navigation').getByRole('button',{name:'Zoom out',exact:true}).click();
  const label=page.getByRole('button',{name:'Show map labels',exact:true});
  if(await label.isVisible()){const pressed=await label.getAttribute('aria-pressed');await label.click();assert.notEqual(await label.getAttribute('aria-pressed'),pressed);await label.click();}
  result.checks.push({name:'Controls and labels',width});console.log('CONTROLS',width);
 }
 await page.setViewportSize({width:390,height:844});
 for(let i=0;i<20;i++){
  await frame.evaluate(i=>__zaylistMap.easeTo({center:[-122.676+(i%4)*.003,45.523+Math.floor(i/4)*.001],zoom:14.5+(i%3)*.5,pitch:i%2?48:0,bearing:(i%6)*15,duration:200}),i);
  await page.waitForTimeout(350);
 }
 await context.setOffline(true);
 for(let i=0;i<10;i++){await frame.evaluate(i=>__zaylistMap.easeTo({bearing:i*12,duration:150}),i);await page.waitForTimeout(1500);}
 assert.equal(await frame.evaluate(()=>__denseToken),token,'offline movement must not reboot the renderer');
 await context.setOffline(false);
 await page.waitForTimeout(2500);
 result.checks.push({name:'20 camera traversals and 15 seconds offline, no renderer reboot'});
 await page.screenshot({path:'.local/map-stability/dense-mapz.png'});
 assert.deepEqual(result.errors,[]);result.passed=true;
}catch(error){result.failure=error.stack;console.error(error);process.exitCode=1;}
finally{fs.writeFileSync('.local/map-stability/dense-result.json',JSON.stringify(result,null,2));await browser.close();}
