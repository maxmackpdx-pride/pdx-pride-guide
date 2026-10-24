import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {startMapStabilityFixture} from './map-stability-fixture.mjs';
import fs from 'node:fs';
test('Outzide remains browsable with WebGL unavailable, including destination mini-map failure',{timeout:60000},async()=>{
 if(!fs.existsSync('dist/public/index.html'))throw Error('Build the local app before running this browser test');
 const server=await startMapStabilityFixture({sourceMaps:true});
 const base='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--disable-webgl']});
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/outzide',{waitUntil:'domcontentloaded'});
  // The field guide must be available from the three-second loading notice.
  await page.getByRole('button',{name:'Browse listings',exact:true}).waitFor({timeout:10000});
  await page.getByRole('button',{name:'Browse listings',exact:true}).click();
  const frame=page.frames().find(f=>f.url().includes('/outzide-map/index.html'));
  await frame.locator('#search').waitFor({state:'visible'});
  await page.evaluate(()=>document.querySelector('.outz-map-page iframe').contentWindow.postMessage({source:'outzide-host',type:'auth-state',allowed:true},location.origin));
  await frame.locator('#search').fill('Forest Park');
  await frame.locator('#results .place-card').click();
  await frame.waitForFunction(()=>document.querySelector('#detail').open);
  await frame.locator('.card-map-error').waitFor({state:'visible'});
  assert.equal(await frame.locator('#fit-card-route').isDisabled(),true);
  await frame.locator('#detail [data-action="close-detail"]').click();
  await frame.locator('#drawer-launcher').click();
  await frame.locator('#sources-button').click();
  assert.match(await frame.locator('#utility-content').textContent(),/OpenStreetMap/);
  await frame.locator('.utility-close').click();
  await frame.locator('#outz-map-controls-close').click();
  // Zoom and tilt must not throw when construction failed.
  await frame.evaluate(()=>{for(const id of ['zoom-in','zoom-out','terrain-toggle'])document.getElementById(id).click();});
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
