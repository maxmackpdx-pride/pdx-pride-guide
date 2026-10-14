import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import express from 'express';
import fs from 'node:fs';

// Local public catalog + synthetic auth; no real accounts or production writes.
const app=express();
app.get('/api/auth/me',(_req,res)=>res.json({id:1}));
app.use('/api',(_req,res)=>res.status(503).json({error:'Optional feed unavailable in fixture'}));
app.use(express.static('client/public'));
let server,base;
test.before(async()=>{server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});base=`http://127.0.0.1:${server.address().port}`;});
test.after(()=>server.close());
for(const width of [320,390,1320])test(`Outzide ${width}: solid pins, two-step cards, responsive controls and static motion`,{timeout:90000},async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(15000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${base}/outzide-map/index.html?lng=-122.7389&lat=45.5727&zoom=13&pitch=48`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.waypoint-icon');
  await page.locator('#rack-search').click({noWaitAfter:true});
  await page.waitForSelector('#outz-map-controls:not([hidden])');
  assert.equal(await page.locator('#search').isVisible(),true);
  await page.locator('#search').fill('Forest Park');
  await page.waitForFunction(()=>document.querySelectorAll('#results .place-card').length===1);
  await page.locator('#outz-map-controls-close').click({noWaitAfter:true});
  const marker=page.locator('.waypoint-icon').filter({hasText:'Forest Park'});
  await marker.locator('.waypoint-head').click({noWaitAfter:true});
  assert.equal(await page.locator('#detail').evaluate(el=>el.open),false);
  await page.waitForSelector('#selection-dock .place-card');
  assert.match(await page.locator('#selection-dock').textContent(),/Forest Park/);
  const pinOpacity=await marker.evaluate(el=>getComputedStyle(el).opacity);
  assert.equal(pinOpacity,'1');
  await page.locator('#selection-dock .place-card').click({noWaitAfter:true});
  await page.waitForFunction(()=>document.querySelector('#detail').open);
  assert.match(await page.locator('#detail-title').textContent(),/Forest Park/);
  await page.screenshot({path:`/private/tmp/outzide-room-open-${width}.png`});
  await page.locator('#detail [data-action="close-detail"]').click({noWaitAfter:true});
  assert.equal(await page.locator('#detail').evaluate(el=>el.open),false);
  assert.equal(await page.locator('#map canvas.maplibregl-canvas').isVisible(),true);
  await page.keyboard.press('/');
  await page.waitForSelector('#outz-map-controls:not([hidden])');
  // Search intentionally receives focus on the next animation frame.
  await page.waitForFunction(()=>document.activeElement===document.querySelector('#search'));
  await page.locator('#results .place-card').click({noWaitAfter:true});
  await page.waitForFunction(()=>document.querySelector('#detail').open);
  await page.locator('#detail [data-action="close-detail"]').click({noWaitAfter:true});
  const sizes=await page.locator('.map-controls button').evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height};}));
  assert.ok(sizes.every(size=>size.width>=44&&size.height>=44),JSON.stringify(sizes));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('.region-switch button').first().evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
  await page.screenshot({path:`/private/tmp/outzide-room-map-${width}.png`});
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
