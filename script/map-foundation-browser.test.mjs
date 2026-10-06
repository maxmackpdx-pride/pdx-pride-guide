import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium,webkit,devices} from 'playwright';
import express from 'express';
import fs from 'node:fs';
const app=express();
app.get('/api/auth/me',(_req,res)=>res.json({id:1}));
app.use('/api',(_req,res)=>res.status(503).json({error:'offline fixture'}));
app.get('/pin-fixture',(_req,res)=>res.send('<html><head><link rel="stylesheet" href="/home-flight/vendor/maplibre-gl-5.6.2.css"></head><body><div id="map" style="width:600px;height:400px"></div><script src="/home-flight/vendor/maplibre-gl-5.6.2.js"></script></body></html>'));
app.use(express.static('client/public'));
let server,url;
test.before(async()=>{server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});url=`http://127.0.0.1:${server.address().port}`;fs.mkdirSync('.local/maplibre-consolidation',{recursive:true});});
test.after(()=>server.close());

for(const engine of ['chromium','webkit'])test(`${engine}: native standard pins preserve artwork, popup and source reuse`,{timeout:60000},async t=>{
 let browser;
 try{browser=await (engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{headless:true});}catch(error){t.skip(error.message);return;}
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url+'/pin-fixture');
  const result=await page.evaluate(async()=>{
   const {createNativePins}=await import('/map-foundation/native-pins.js');
   const map=new maplibregl.Map({container:'map',style:{version:8,sources:{},layers:[{id:'ground',type:'background',paint:{'background-color':'#18313b'}}]},center:[0,0],zoom:10});
   const pins=createNativePins(map,'test');
   const rows=[{id:1,lng:0,lat:0,color:'#ff7900',label:'Community waypoint'}];
   await pins.set(rows);const source=map.getSource('test');let writes=0;const set=source.setData.bind(source);source.setData=(...args)=>{writes++;return set(...args)};
   await pins.set(rows);
   await new Promise(resolve=>map.once('idle',resolve));
   const data=await source.getData(),image=map.getImage('standard-pin-#ff7900');
   window.__testMap=map;window.__testPins=pins;
   return {count:data.features.length,image:{width:image.data.width,height:image.data.height,pixelRatio:image.pixelRatio},writes};
  });
  assert.equal(result.count,1);assert.equal(result.writes,0);assert.deepEqual(result.image,{width:54,height:82,pixelRatio:2});
  await page.mouse.click(308,190);await page.waitForSelector('.maplibregl-popup-content');
  assert.match(await page.locator('.maplibregl-popup-content').textContent(),/Community waypoint/);
  await page.screenshot({path:`.local/maplibre-consolidation/native-pins-${engine}.png`});
  await page.evaluate(()=>{window.__testPins.dispose();window.__testMap.remove();});assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});

for(const profile of ['desktop','phone'])test(`Outzide ${profile}: shell and markers do not wait for detail feeds`,{timeout:90000},async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const context=await browser.newContext(profile==='phone'?devices['iPhone 13']:{viewport:{width:1280,height:800}}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  let releaseCatalog,releaseDetails;
  const catalogGate=new Promise(resolve=>releaseCatalog=resolve),detailsGate=new Promise(resolve=>releaseDetails=resolve);
  await page.route('**/places.json',async route=>{await catalogGate;await route.continue();});
  await page.route(/\/(details|routes|feed|beaches)\.json/,async route=>{await detailsGate;await route.continue();});
  await page.goto(url+'/outzide-map/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.maplibregl-canvas');
  assert.equal(await page.locator('.maplibregl-marker.waypoint-icon').count(),0);
  releaseCatalog();await page.waitForSelector('.maplibregl-marker.waypoint-icon');
  assert.match(await page.locator('#result-count').textContent(),/385 destinations/);
  await page.locator('#rack-layers').click();await page.waitForSelector('#outz-map-controls:not([hidden])');
  await page.locator('#outz-map-controls-close').click();assert.equal(await page.locator('#outz-map-controls').isVisible(),false);
  releaseDetails();await page.waitForTimeout(4000);
  await page.screenshot({path:`.local/maplibre-consolidation/outzide-startup-${profile}.png`});
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
