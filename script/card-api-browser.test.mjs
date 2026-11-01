/** Real production-card layout checks. Run: node --test script/card-api-browser.test.mjs
 * Uses a local Vite fixture; mocks APIs and the map iframe to avoid network/data writes.
 * This checks host geometry and card actions, not the map iframe's internal controls.
 */
import assert from 'node:assert/strict';
import {test} from 'node:test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<=1.1,`${message}: ${a} vs ${b}`);
const overlaps=(a,b)=>Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1 && Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1;
// A card can be visible while its finite entrance animation is still delayed.
// Playwright waits for actionability before clicking; take the baseline only
// after the same root/wrapper animations finish. Decorative infinite loops do
// not block readiness. Never cancel or override production animations here.
async function geometryReady(page){
 await page.waitForFunction(()=>{
  const grid=document.querySelector('#qa-grid');if(!grid||document.fonts.status!=='loaded')return false;
  const roots=new Set([grid,...grid.children]);
  for(const face of grid.querySelectorAll('[data-card-size]')){
   for(let node=face;node&&node!==grid;node=node.parentElement)roots.add(node);
  }
  return [...roots].every(node=>node.getAnimations().every(animation=>
   !Number.isFinite(animation.effect?.getComputedTiming().endTime)||['finished','idle'].includes(animation.playState)));
 });
}
async function snapshot(page){await geometryReady(page);return page.locator('#qa-grid').evaluate(grid=>[...grid.children].filter(el=>el.getBoundingClientRect().width>0).map(el=>{const face=el.matches("[data-card-expanded=true],[data-card-size]")?el:el.querySelector("[data-card-size]")||el;const r=face.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height};}));}
async function documentBox(locator){return locator.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height};});}
async function settled(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.waitForTimeout(450);}

test('production cards keep standard dimensions and expand in flow with position-aware anchors',{timeout:600000},async(t)=>{
 // Every invocation starts cold. Suites must never race over Vite's default
 // node_modules/.vite cache, and virtual HTML needs an explicit scanner entry.
 const cacheDir=await mkdtemp(path.join(tmpdir(),'card-api-browser-vite-'));
 t.after(()=>rm(cacheDir,{recursive:true,force:true}));
 const fixture='script/fixtures/card-api-browser.tsx';
 const server=await createServer({configFile:false,root,cacheDir,optimizeDeps:{entries:[fixture],include:['react/jsx-runtime','react/jsx-dev-runtime']},publicDir:path.join(root,'client/public'),plugins:[react(),{name:'card-qa-fixture',configureServer(s){s.middlewares.use(async(req,res,next)=>{if(!req.url?.startsWith('/__card-qa'))return next();const html=await s.transformIndexHtml(req.url,'<!doctype html><html data-zaylist-cards="true"><head><style>body{margin:24px!important}h1{font:16px sans-serif;margin-bottom:24px}@media(max-width:650px){body{margin:12px!important}#qa-grid{grid-template-columns:repeat(auto-fit,var(--qa-card-width))!important;width:100%!important;gap:16px!important}}</style></head><body><div id="root"></div><script type="module" src="/script/fixtures/card-api-browser.tsx"></script></body></html>');res.setHeader('Content-Type','text/html');res.end(html);});}}],resolve:{alias:{'@':path.join(root,'client/src'),'@shared':path.join(root,'shared'),'@assets':path.join(root,'attached_assets')}},server:{host:'127.0.0.1',port:0,hmr:false,watch:null},define:{__OUTZIDE_ASSETS__:JSON.stringify({script:'/outzide-map/app.js',maplibre:'/home-flight/vendor/maplibre-gl-5.6.2.js',maplibreCss:'/home-flight/vendor/maplibre-gl-5.6.2.css'}),__MAPZ_ASSETS__:'{}',__HOME_FLIGHT_BASE__:JSON.stringify('/home-flight')}});
 let browser;
 try{
  await server.listen();
 // Public Vite API: transform the explicit fixture before opening Chromium.
 await server.warmupRequest(`/${fixture}`);
 const base=server.resolvedUrls.local[0];
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:1280,height:1000},reducedMotion:'reduce'});
  await context.route('**/api/**',route=>{const p=new URL(route.request().url()).pathname;if(route.request().method()!=='GET')return route.abort('blockedbyclient');if(p==='/api/auth/me')return route.fulfill({status:401,json:{}});return route.fulfill({json:[]});});
  await context.route('**/outzide-map/index.html?*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body><h2>Destination detail fixture</h2><p>Map internals intentionally isolated from host geometry tests.</p></body></html>'}));
  const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('BROWSER ERROR',e.message);});
  const cases=['outz','place','event','board','needz'].flatMap(family=>['tall','wide','small'].map(size=>[family,size]));
  cases.push(['outz','tall','flex'],['board','wide','flex'],['outz','small','flex'],['outz','tall','grid','strict'],['place','tall','fluid'],['board','wide','flex-rotated']);
  const shots=process.env.CARD_QA_SCREENSHOT_DIR;if(shots)await mkdir(shots,{recursive:true});
  for(const [family,size,layout='grid',strict=''] of cases){
   if(process.env.CARD_QA_CASE_FILTER&&!new RegExp(process.env.CARD_QA_CASE_FILTER).test(`${family}/${size}/${layout}`))continue;
   await page.goto(`${base}__card-qa?family=${family}&size=${size}&layout=${layout}&strict=${strict?'1':'0'}`,{waitUntil:'domcontentloaded'});await page.locator('#qa-grid button[aria-label^="Open "],#qa-grid button[aria-label^="View details for "]').first().waitFor();await settled(page);
   const before=await snapshot(page);assert.equal(before.length,6,`${family}/${size}: six cards`);
   const expected=size==='small'?{width:136,height:170}:size==='wide'?{width:360,height:216}:{width:200,height:403};
   const dimensions=await page.locator('#qa-grid').evaluate(grid=>[...grid.children].map(el=>{const face=el.matches("[data-card-size]")?el:el.querySelector("[data-card-size]")||el;return {width:face.offsetWidth,height:face.offsetHeight};}));
   dimensions.forEach((r,i)=>{near(r.width,expected.width,`${family}/${size} card${i+1} width`);near(r.height,expected.height,`${family}/${size} card${i+1} height`);});
   if(shots&&family==='outz')await page.waitForFunction(()=>[...document.querySelectorAll('#qa-grid img')].every(img=>img.complete),undefined,{timeout:10000});
   if(shots)await page.screenshot({path:path.join(shots,`${family}-${size}-${layout}-${strict||'normal'}-closed.png`),fullPage:true});
   const titles=await page.locator('#qa-grid').evaluate(grid=>[...grid.children].map(card=>{
    const title=card.querySelector('.tonight-card__body h3,.outz-small__title,.outz-destination-card strong,.zine-title,.pdxPlace__name,.event-rail-card__title');
    if(!title)return {text:null,visible:false};const r=title.getBoundingClientRect(),c=card.getBoundingClientRect();const css=getComputedStyle(title);
    const visible=r.width>0&&r.height>0&&css.visibility!=='hidden'&&Number(css.opacity)>0&&r.left>=c.left-2&&r.right<=c.right+2&&r.top>=c.top-2&&r.bottom<=c.bottom+2;
    return {text:title.textContent,visible,rect:{x:r.x,y:r.y,width:r.width,height:r.height},card:{x:c.x,y:c.y,width:c.width,height:c.height}};
   }));
   titles.forEach((title,i)=>assert.ok(title.visible,`${family}/${size}: title${i+1} is readable inside the face ${JSON.stringify(title)}`));
   if(family==='event'&&size==='small'){
    const visibleFace=await page.locator('.event-rail-card__art').first().boundingBox();near(visibleFace.height,170,'small Eventz visible face fills shared height');
   }
   // Exercise every position in a three-column row, including right-anchored expansion.
   for(const index of [0,1,2]){
    const original=await snapshot(page);const originalScroll=await page.evaluate(()=>({x:scrollX,y:scrollY}));const open=page.locator('#qa-grid button[aria-label^="Open "],#qa-grid button[aria-label^="View details for "]').nth(index);
    if(family==='needz'&&size==='small'&&index===1){await open.focus();await page.keyboard.press('Enter');}else await open.click();await page.locator('.zay-card-expanded').waitFor({state:'visible'});await settled(page);
    const after=await snapshot(page);const expanded=await documentBox(page.locator('[data-card-expanded="true"]'));assert.ok(expanded);
    const openedScroll=await page.evaluate(()=>({x:scrollX,y:scrollY}));near(openedScroll.x,originalScroll.x,`${family}/${size}: no unrequested horizontal scroll`);near(openedScroll.y,originalScroll.y,`${family}/${size}: no unrequested vertical scroll`);
    near(expanded.y,original[index].y,`${family}/${size} col${index+1}: top anchor`);
    if(index===2)near(expanded.x+expanded.width,original[index].x+original[index].width,`${family}/${size}: right anchor`);else near(expanded.x,original[index].x,`${family}/${size} col${index+1}: left anchor`);
    assert.ok(expanded.width>original[index].width||expanded.height>original[index].height,`${family}/${size}: genuinely expanded`);
    assert.equal(await page.locator('[aria-modal="true"]:visible').count(),0,`${family}/${size}: no floating modal`);
    assert.ok(after.some((r,i)=>i!==index&&(Math.abs(r.x-original[i].x)>1||Math.abs(r.y-original[i].y)>1)),`${family}/${size}: neighbors moved`);
    after.forEach((r,i)=>{if(i!==index)assert.ok(!overlaps(expanded,r),`${family}/${size} col${index+1}: overlaps neighbor${i+1}`);});
    if(shots&&index===2)await page.screenshot({path:path.join(shots,`${family}-${size}-${layout}-${strict||'normal'}-right-open.png`),fullPage:true});
    const close=page.locator('.zay-card-expanded button[aria-label*="Close"], .zay-card-expanded button[aria-label*="close"]').first();
    await close.click();await page.locator('.zay-card-expanded').waitFor({state:'detached'});await settled(page);
    const restored=await snapshot(page);restored.forEach((r,i)=>{near(r.x,original[i].x,'restored x');near(r.y,original[i].y,'restored y');near(r.width,original[i].width,'restored width');near(r.height,original[i].height,'restored height');});
   }
   if(family==='event'){await page.locator('#qa-grid button[aria-label^="Add "]').first().click();assert.equal(await page.locator('#qa-saved-count').textContent(),'1','save action still works');assert.equal(await page.locator('.zay-card-expanded').count(),0,'save does not expand');}
   console.log(`PASS ${family}/${size}/${layout}/${strict||'normal'}: sizes, all three anchors, reflow/no-overlap, close/reopen, no modal`);
  }
  for(const family of ['outz','event']) {
   if(process.env.CARD_QA_CASE_FILTER && process.env.CARD_QA_CASE_FILTER!=='extras')continue;
   await page.setViewportSize({width:390,height:844});
   await page.goto(`${base}__card-qa?family=${family}&size=small`,{waitUntil:'domcontentloaded'});await page.locator('#qa-grid button[aria-label^="Open "]').first().waitFor();await settled(page);
   const original=await snapshot(page);const first=page.locator('#qa-grid button[aria-label^="Open "],#qa-grid button[aria-label^="View details for "]').first();
   await first.click();await page.locator('.zay-card-expanded').waitFor({state:'visible'});await settled(page);
   const box=await documentBox(page.locator('[data-card-expanded="true"]'));near(box.x,original[0].x,'mobile left anchor');near(box.y,original[0].y,'mobile top anchor');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile no document horizontal overflow');
   if(shots&&family==='outz')await page.waitForFunction(()=>[...document.querySelectorAll('#qa-grid img')].every(img=>img.complete),undefined,{timeout:10000});
   if(shots)await page.screenshot({path:path.join(shots,`${family}-small-mobile-open.png`),fullPage:true});
   const close=page.locator('.zay-card-expanded button[aria-label*="Close"]').first();await close.focus();await page.keyboard.press('Escape');
   await page.locator('.zay-card-expanded').waitFor({state:'detached'});assert.equal(await first.evaluate(el=>document.activeElement===el),true,'Escape returns focus to opener');
   await page.setViewportSize({width:1280,height:1000});
   console.log(`PASS ${family}/small mobile: anchored, no overflow, Escape/focus`);
  }
  for(const family of ['outz','event']) {
   if(process.env.CARD_QA_CASE_FILTER && process.env.CARD_QA_CASE_FILTER!=='extras')continue;
   await page.goto(`${base}__card-qa?family=${family}&size=tall`,{waitUntil:'domcontentloaded'});
   const openers=page.locator('#qa-grid button[aria-label^="Open "]:visible');await openers.first().waitFor();await settled(page);
   await openers.first().click();await page.locator('[data-card-expanded="true"]').waitFor();await settled(page);
   const second=openers.first();const nextName=await second.getAttribute('aria-label');await second.click();await settled(page);
   assert.equal(await page.locator('[data-card-expanded="true"]').count(),1,`${family}: switching keeps one expanded card`);
   assert.equal(await page.locator('.zay-card-expanded').count(),1,`${family}: old details unmounted`);
   const expanded=page.locator('[data-card-expanded="true"]');
   assert.equal(await expanded.locator(`button[aria-label=${JSON.stringify(nextName)}]`).count(),1,`${family}: opened the newly selected source`);
   const box=await documentBox(expanded);const neighbors=await page.locator('#qa-grid').evaluate(grid=>[...grid.children].filter(el=>el.dataset.cardExpanded!=='true').map(el=>{const r=el.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height};}));
   neighbors.forEach(r=>assert.ok(!overlaps(box,r),`${family}: switched card does not overlap neighbor`));
   await page.locator('.zay-card-expanded button[aria-label*="Close"]').first().click();await page.locator('.zay-card-expanded').waitFor({state:'detached'});
   console.log(`PASS ${family}: sequential selection replaces active details without overlap`);
  }
  assert.deepEqual(errors,[],'no uncaught browser errors');
  if(process.env.CARD_QA_SCREENSHOT_DIR){await mkdir(process.env.CARD_QA_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.CARD_QA_SCREENSHOT_DIR,'card-api.png'),fullPage:true});}
 }finally{await browser?.close();await server.close();}
});
