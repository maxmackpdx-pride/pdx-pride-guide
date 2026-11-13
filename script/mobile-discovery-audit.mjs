/** Read-only production mobile journeys. No posting, saving, messaging or login writes.
 * Screenshots and JSON report are CI artifacts; this is not a physical-iPhone test.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const origin='https://www.zaylist.com';
const output='artifacts/mobile-discovery';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={started:new Date().toISOString(),browser:browser.version(),scenarios:[],limits:[
  'Chromium mobile emulation, not physical Safari.',
  'Public live data may change; no authenticated posting or saved-post persistence is claimed.',
  'Map host-mounted timing is distinct from rendered tiles or first usable map interaction.',
  'Live screenshots describe production, not the unmerged Boardz accessible-name change.'
]};
async function scenario(name,width,run){
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,timezoneId:'America/Los_Angeles'});
 const row={name,width,status:'running',steps:[],errors:[],blockedWrites:[]};
 report.scenarios.push(row);
 await context.route('**/*',route=>{
   const request=route.request();
   if(!['GET','HEAD','OPTIONS'].includes(request.method())){
     row.blockedWrites.push({method:request.method(),path:new URL(request.url()).pathname});
     return route.abort('blockedbyclient');
   }
   return route.continue();
 });
 const page=await context.newPage();
 page.setDefaultTimeout(20000);
 page.on('pageerror',error=>row.errors.push(error.message));
 const capture=async step=>{
   const file=output+'/'+name+'-'+width+'-'+step+'.png';
   await page.screenshot({path:file,fullPage:false});
   row.steps.push({step,file,url:page.url(),scrollY:await page.evaluate(()=>scrollY)});
 };
 try{await run(page,row,capture);row.status='passed';}
 catch(error){row.status='failed';row.failure=String(error);await capture('failure').catch(()=>{});}
 finally{await context.close();}
}
async function roundTrip(page,opener,closeName,capture,row){
 await opener.scrollIntoViewIfNeeded();
 await page.waitForTimeout(350);
 const before={url:page.url(),y:await page.evaluate(()=>scrollY),box:await opener.boundingBox()};
 await capture('03-filtered-card');
 await opener.click();
 const close=page.getByRole('button',{name:closeName,exact:true});
 await close.waitFor({state:'visible'});
 await page.waitForTimeout(600);
 await capture('04-open');
 const closeBox=await close.boundingBox();
 row.closeInViewport=!!closeBox&&closeBox.x>=0&&closeBox.x+closeBox.width<=row.width+1&&closeBox.y>=0&&closeBox.y+closeBox.height<=844;
 // Do not scroll the close control into view before recording discoverability.
 await close.click();
 await page.waitForURL(before.url);
 await close.waitFor({state:'hidden'});
 await page.waitForTimeout(600);
 const afterY=await page.evaluate(()=>scrollY);
 row.return={beforeY:before.y,afterY,delta:afterY-before.y,focusRestored:await opener.evaluate(el=>document.activeElement===el)};
 await capture('05-return');
 assert.ok(row.closeInViewport,'Close control is outside the mobile viewport');
 assert.ok(Math.abs(afterY-before.y)<=3,'Closing details lost the original scroll position');
 assert.ok(row.return.focusRestored,'Closing details did not restore focus to the card opener');
}
try{
 for(const width of [390,430]){
  await scenario('eventz',width,async(page,row,capture)=>{
   await page.goto(origin+'/events',{waitUntil:'domcontentloaded'});
   const search=page.getByRole('searchbox',{name:'Search events',exact:true});
   await search.waitFor();await capture('01-start');
   await search.fill('karaoke');await page.waitForURL(url=>url.searchParams.get('q')==='karaoke');
   await capture('02-search');
   await page.getByTestId('events-filters-open').click();
   const free=page.locator('[aria-label="Filter events by FREE"]:visible').last();
   await free.click();
   await page.getByTestId('events-filters-apply').click();
   await page.waitForURL(url=>(url.searchParams.get('type')??'').includes('FREE'));
   const opener=page.getByRole('button',{name:/^Open Keyed Up Karaoke/}).first();
   await roundTrip(page,opener,'Close event',capture,row);
   assert.equal(await search.inputValue(),'karaoke');
   assert.ok(new URL(page.url()).searchParams.get('type').includes('FREE'));
  });
  await scenario('placez',width,async(page,row,capture)=>{
   await page.goto(origin+'/directory',{waitUntil:'domcontentloaded'});
   const search=page.getByRole('searchbox',{name:'Search Placez',exact:true});
   await search.waitFor();await capture('01-start');
   await search.fill('Badlands');await page.waitForURL(url=>url.searchParams.get('q')==='Badlands');
   await capture('02-search');
   await page.locator('[aria-pressed]').filter({hasText:'BARS & CLUBS'}).filter({visible:true}).first().click();
   await page.waitForURL(url=>url.searchParams.get('type')==='bar');
   const opener=page.getByRole('button',{name:'View details for Badlands',exact:true});
   // Check real venue links during the same opening used for return-state testing.
   const observe=async step=>{
     if(step==='04-open'){
       const website=page.getByRole('link',{name:'Website',exact:true});
       const directions=page.getByRole('link',{name:'DIRECTIONS',exact:true});
       row.website=await website.getAttribute('href');row.directions=await directions.getAttribute('href');
       assert.ok(/^https?:\/\//.test(row.website??''),'Venue website is missing');
       assert.ok(/^https?:\/\//.test(row.directions??''),'Directions link is missing');
     }
     await capture(step);
   };
   await roundTrip(page,opener,'Close place',observe,row);
   assert.equal(await search.inputValue(),'Badlands');
  });
  await scenario('boardz',width,async(page,row,capture)=>{
   await page.goto(origin+'/boardz',{waitUntil:'domcontentloaded'});
   const search=page.getByRole('searchbox',{name:'Search community boards',exact:true});
   await search.waitFor();await capture('01-start');
   await search.fill('DJ');await page.waitForURL(url=>url.searchParams.get('q')==='DJ');
   await capture('02-search');
   const filter=page.locator('[aria-pressed]').filter({hasText:/^Available for work/}).filter({visible:true}).first();
   if(!await filter.isVisible())await page.getByRole('button',{name:'Filter board posts',exact:true}).click();
   await page.locator('[aria-pressed]').filter({hasText:/^Available for work/}).filter({visible:true}).first().click();
   await page.waitForURL(url=>url.searchParams.get('intent')==='available');
   await page.keyboard.press('Escape');
   await roundTrip(page,page.getByRole('button',{name:'Open DJ in Portland',exact:true}),'Close listing',capture,row);
   assert.equal(await search.inputValue(),'DJ');
  });
 }
 await scenario('needz-food',390,async(page,row,capture)=>{
  await page.goto(origin+'/needz',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:/FOOD & GROCERIES Pantries/}).click();
  await page.getByLabel('ZIP Code',{exact:true}).fill('97215');await capture('01-zip');
  await page.getByRole('button',{name:'FIND FOOD',exact:true}).click();
  await page.getByText(/options? near 97215/).waitFor({timeout:45000});
  row.links=await page.getByRole('link',{name:/Food Finder details|Visit website/i}).evaluateAll(els=>els.map(el=>({label:el.textContent,href:el.href})));
  assert.ok(row.links.length>0,'Food results have no direct details or provider links');
  await capture('02-results');
  await page.getByRole('button',{name:'SNAP & DOUBLE UP',exact:true}).click();
  await capture('03-snap');
  row.snapText=await page.locator('#needz-focused').innerText();
 });
 await scenario('mapz-startup',390,async(page,row,capture)=>{
  await page.addInitScript(()=>window.addEventListener('zaylist:map-ready',event=>{
    window.__auditMapHost={ms:performance.now(),release:event.detail?.release};
  }));
  await page.goto(origin+'/map?mode=mapz',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__auditMapHost),{},{timeout:60000});
  row.hostMounted=await page.evaluate(()=>window.__auditMapHost);
  await page.getByRole('textbox',{name:'Search Mapz',exact:true}).waitFor({timeout:30000});
  row.webglUnavailable=await page.getByText(/WebGL2 graphics are unavailable/).isVisible();
  await capture('01-ready-or-fallback');
 });
 await scenario('mapz-recovery',390,async(page,row,capture)=>{
  let fail=true;
  await page.route('**/map-assets/**/map.js',route=>fail?route.abort('failed'):route.continue());
  await page.goto(origin+'/map?mode=mapz',{waitUntil:'domcontentloaded'});
  const retry=page.getByRole('button',{name:'Retry map',exact:true});
  await retry.waitFor({state:'visible',timeout:60000});await capture('01-failure');
  fail=false;const start=Date.now();await retry.click();
  await page.getByRole('textbox',{name:'Search Mapz',exact:true}).waitFor({timeout:60000});
  row.retryToDiscoveryMs=Date.now()-start;
  await capture('02-recovered');
 });
}finally{
 await browser.close();
 await writeFile(output+'/report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}
if(report.scenarios.some(row=>row.status==='failed'))process.exitCode=1;
