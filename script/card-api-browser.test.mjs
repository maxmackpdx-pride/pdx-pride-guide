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
import {checkPlaceStage,placeDialog} from './placez-stage-browser-helpers.mjs';
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
// One open event card everywhere (Tucker, t276u): an event opener goes straight to the
// shared OpenEventCard (no front preview step), centered in the card stage on INFO.
async function openEventDetails(page, trigger) {
 await trigger.click();
 const details=page.locator('.zay-card-stage--expanded .ocard[role=dialog]');
 await details.waitFor();
 const stage=page.locator('.zay-card-stage--expanded');
 const cardBox=await details.boundingBox(), stageBox=await stage.boundingBox();
 near(cardBox.x+cardBox.width/2,stageBox.x+stageBox.width/2,'open event card centered horizontally');
 await details.locator('.otabs [role=tab][aria-selected=true]',{hasText:'INFO'}).waitFor();
 return details;
}
async function settled(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.waitForTimeout(450);}

test('production cards preserve source geometry across viewport and in-flow presentations',{timeout:600000},async(t)=>{
 // Every invocation starts cold. Suites must never race over Vite's default
 // node_modules/.vite cache, and virtual HTML needs an explicit scanner entry.
 const cacheDir=await mkdtemp(path.join(tmpdir(),'card-api-browser-vite-'));
 t.after(()=>rm(cacheDir,{recursive:true,force:true}));
 const fixture='script/fixtures/card-api-browser.tsx';
 const server=await createServer({configFile:false,root,cacheDir,optimizeDeps:{entries:[fixture],include:['react/jsx-runtime','react/jsx-dev-runtime']},publicDir:path.join(root,'client/public'),plugins:[react(),{name:'card-qa-fixture',configureServer(s){s.middlewares.use(async(req,res,next)=>{if(!req.url?.startsWith('/__card-qa'))return next();const html=await s.transformIndexHtml(req.url,'<!doctype html><html data-zaylist-cards="true"><head><style>body{margin:0!important}#root{margin:24px;width:auto}h1{font:16px sans-serif;margin-bottom:24px}@media(max-width:650px){#root{margin:12px}#qa-grid{grid-template-columns:repeat(auto-fit,var(--qa-card-width))!important;width:100%!important;gap:16px!important}}</style></head><body><div id="root"></div><script type="module" src="/script/fixtures/card-api-browser.tsx"></script></body></html>');res.setHeader('Content-Type','text/html');res.end(html);});}}],resolve:{alias:{'@':path.join(root,'client/src'),'@shared':path.join(root,'shared'),'@assets':path.join(root,'attached_assets')}},server:{host:'127.0.0.1',port:0,hmr:false,watch:null},define:{__OUTZIDE_ASSETS__:JSON.stringify({script:'/outzide-map/app.js',maplibre:'/home-flight/vendor/maplibre-gl-5.6.2.js',maplibreCss:'/home-flight/vendor/maplibre-gl-5.6.2.css'}),__MAPZ_ASSETS__:'{}',__HOME_FLIGHT_BASE__:JSON.stringify('/home-flight')}});
 let browser;
 try{
  await server.listen();
 // Public Vite API: transform the explicit fixture before opening Chromium.
 await server.warmupRequest(`/${fixture}`);
 const base=server.resolvedUrls.local[0];
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:1280,height:1000},reducedMotion:'reduce'});
  await context.route('**/api/**',route=>{const p=new URL(route.request().url()).pathname;if(route.request().method()!=='GET')return route.abort('blockedbyclient');if(p==='/api/auth/session')return route.fulfill({contentType:'application/json',body:'null'});
    if(p.endsWith('/planning'))return route.fulfill({json:{checked:false,onSiteWindow:false,poster:null,venue:'QA venue',title:'QA Event',open:true,canPostGig:false,gigs:[],rides:[{id:7,area:'North Portland',driver:'qa_driver',driverPhotoUrl:null,remaining:2,mine:false,myRequest:null,requests:[],circle:'everybody',plan:{kind:'carpool',meeting:'NE 15th & Alberta',leaveBy:null,oneWay:true,departed:false},faces:[]}],needs:[{id:1,user:'qa_needs',photoUrl:null,area:'Pearl',direction:'departing',mine:false,sameEvent:true,sameAfterz:false,circle:'everybody',distanceMi:null},{id:2,user:'qa_afterz',photoUrl:null,area:'Alberta',direction:'now',mine:false,sameEvent:false,sameAfterz:true,circle:'friend',distanceMi:0.1},{id:3,user:'qa_me',photoUrl:null,area:'Kenton',direction:'departing',mine:true,sameEvent:true,sameAfterz:false,circle:'you',distanceMi:null}]}});
    return route.fulfill({json:[]});});
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
    if(family==='event'){
     const details=await openEventDetails(page,open);
     await details.getByRole('button',{name:'Close event',exact:true}).click();
     await details.waitFor({state:'hidden'});await settled(page);
     const restored=await snapshot(page);
     restored.forEach((r,i)=>{for(const axis of ['x','y','width','height'])near(r[axis],original[i][axis],`event/${size}: restored source ${i} ${axis}`);});
     continue;
    }
    if(family==='place'){
     await open.click();await settled(page);
     const dialog=await checkPlaceStage(page);
     assert.equal(await dialog.getByRole('tab',{name:'Info',exact:true}).getAttribute('aria-selected'),'true');
     await dialog.getByRole('button',{name:/^Close /}).click();
     await placeDialog(page).waitFor({state:'hidden'});await settled(page);
     const restored=await snapshot(page);
     restored.forEach((r,i)=>{for(const axis of ['x','y','width','height'])near(r[axis],original[i][axis],`place/${size}: restored source ${i} ${axis}`);});
     continue;
    }
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
   console.log(`PASS ${family}/${size}/${layout}/${strict||'normal'}: sizes, ${['place','event'].includes(family)?'centered portal, restored source':'three anchors, reflow without overlap'}, close/reopen`);
  }
  for(const family of ['outz','event']) {
   if(process.env.CARD_QA_CASE_FILTER && process.env.CARD_QA_CASE_FILTER!=='extras')continue;
   await page.setViewportSize({width:390,height:844});
   await page.goto(`${base}__card-qa?family=${family}&size=small`,{waitUntil:'domcontentloaded'});await page.locator('#qa-grid button[aria-label^="Open "]').first().waitFor();await settled(page);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'closed fixture fits the mobile viewport');
   const original=await snapshot(page);const first=page.locator('#qa-grid button[aria-label^="Open "],#qa-grid button[aria-label^="View details for "]').first();
   if(family==='event'){
    const details=await openEventDetails(page,first);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile event has no horizontal overflow');
    // RIDEZ tile -> in-card Ridez panel (t345u). The leading rail area opens the expanded carpool
    // card stub (design pending); a carpool card opens the existing at-event carpool flow.
    // Tile row (owner, Nov 20): TICKETS first, VENUE WEBSITE last, both new-tab links; the row is centered.
    {
     const row=details.locator('nav.otiles');
     const keys=await row.locator(':scope > .otile').evaluateAll(els=>els.map(e=>e.dataset.action));
     assert.equal(keys[0],'tickets','TICKETS is the first tile');
     assert.equal(keys[keys.length-1],'venue-website','VENUE WEBSITE is the last tile');
     for(const k of ['tickets','venue-website']){
      const a=row.locator(`a[data-action=${k}]`);
      assert.equal(await a.getAttribute('target'),'_blank',`${k} opens in a new tab`);
      assert.ok((await a.getAttribute('rel')).includes('noopener'),`${k} is rel=noopener`);
     }
     assert.equal(await row.locator('a[data-action=tickets]').getAttribute('href'),'https://tickets.example.test/qa-event');
     const geo=await row.evaluate(nav=>{const card=nav.closest('.ocard').getBoundingClientRect();const faces=[...nav.querySelectorAll('.otile-face')].map(f=>f.getBoundingClientRect());return {cardMid:(card.left+card.right)/2,first:faces[0].left-card.left,last:card.right-faces[faces.length-1].right,gaps:faces.slice(1).map((f,i)=>Math.round(f.left-faces[i].right))};});
     assert.ok(Math.abs(geo.first-geo.last)<=1,'tile row is centered '+JSON.stringify(geo));
     assert.ok(Math.max(...geo.gaps)-Math.min(...geo.gaps)<=1,'tiles are evenly spaced '+JSON.stringify(geo));
    }
    const ridezTile=details.locator('[data-action=rides]');
    const openRidez=async()=>{if(await ridezTile.getAttribute('aria-expanded')!=='true')await ridezTile.click();const ridez=details.locator('.zxp[aria-label=Ridez].is-open');await ridez.waitFor();return ridez;};
    {
     const ridez=await openRidez();
     assert.equal(await ridezTile.getAttribute('aria-expanded'),'true','Ridez tile reports its open panel');
     assert.equal(await page.locator('.zas-scrim').count(),0,'tile panels open in the card, not as a sheet');
     // Ride websites (Lyft, Uber, TriMet) render only for events with a place; every one opens in a
     // new tab (hrefs are covered by client/src/lib/travelLinks.test.ts).
     const links=ridez.locator('a.zride-tile');
     for(let i=0;i<await links.count();i++){
      const a=links.nth(i);
      assert.equal(await a.getAttribute('target'),'_blank','ride websites open in a new tab');
      const rel=(await a.getAttribute('rel')||'').split(/\s+/);
      assert.ok(rel.includes('noopener')&&rel.includes('noreferrer'),'ride links are rel=noopener noreferrer');
      assert.match(await a.getAttribute('href'),/^https:\/\/(ride\.lyft\.com|m\.uber\.com\/go\/|trimet\.org\/home\/planner)/,'ride links are websites, not app hand-offs');
     }
     const lead=ridez.locator('button[data-action=open-carpool]');
     assert.match(await lead.getAttribute('aria-label'),/expanded carpool card/i,'leading carpool area is a labelled button');
     assert.equal(await ridez.locator('[data-action=post-carpool]').count(),0,'no dashed plus slot');
     // OFFER A RIDE / I NEED A RIDE (owner, Nov 20): expanded-card buttons in Ridez orange that open
     // the shared RidezFormCard with the event preselected (signed out: the sign-in gate).
     for(const [action,kicker] of [['ridez-offer','OFFER A RIDE'],['ridez-need','I NEED A RIDE']]){
      const btn=ridez.locator(`button[data-action=${action}]`);
      assert.equal((await btn.textContent()).trim(),kicker);
      assert.ok((await btn.getAttribute('class')).split(/\s+/).includes('obtn'),'Ridez buttons use the expanded card action style');
      await btn.click();
      const form=page.locator(`.zform[role=dialog][aria-label^="${kicker}: "]`);await form.waitFor();
      assert.match(await form.getAttribute('aria-label'),/QA EVENT/,'the event is preselected (no event picker)');
      assert.equal(await form.locator('select[name=event],[data-field=event]').count(),0,'no event picker step');
      await page.keyboard.press('Escape');await form.waitFor({state:'detached'});
     }
     // Circle toggle (owner, Nov 20): top-right radiogroup, default Everybody, persisted, filters the rail.
     const circle=ridez.getByRole('radiogroup',{name:'Show carpools from'});
     const radios=circle.getByRole('radio');
     assert.equal(await radios.count(),3);
     assert.equal(await circle.getByRole('radio',{name:'Everybody'}).getAttribute('aria-checked'),'true','default Everybody');
     const offers=ridez.locator('[data-card-category=carpool] button.ocarpool'),needCards=ridez.locator('[data-card-category=carpool-need]');
     assert.equal(await offers.count(),1,'Everybody shows every carpool');
     assert.equal(await needCards.count(),3,'NEEDS A RIDE cards share the rail');
     for(let i=0;i<3;i++)assert.equal(await needCards.nth(i).locator('.ocarpool-av').count(),1,'every NEEDS A RIDE card has an avatar');
     assert.equal(await ridez.locator('[data-action=ridez-coming]').count(),0,"signed out: no I'M COMING");
     {
      // Who's coming (rider side of my own need) opens over the card, not clipped by the panel.
      await ridez.locator('[data-action=ridez-whos-coming]').click();
      const who=page.locator('.zas[aria-label="Who\'s coming"]');await who.waitFor();
      assert.ok(await who.locator('.zwho').isVisible(),"who's coming renders");
      await page.keyboard.press('Escape');await who.waitFor({state:'detached'});
     }
     // Divider between the buttons + toggle and the list; NEEDS A RIDE label; blooms (afterz yellow first).
     assert.equal(await ridez.locator('.zridez > hr.zridez-div').count(),1,'divider above the card list');
     assert.equal(await needCards.first().locator('.orailcard-tag').textContent(),'NEEDS A RIDE');
     assert.equal(await needCards.first().getAttribute('data-bloom'),'afterz','same Afterz blooms first (yellow)');
     assert.equal(await needCards.nth(1).getAttribute('data-bloom'),'event','same event blooms orange');
     const bloom=await needCards.first().evaluate(el=>{const b=getComputedStyle(el,'::before');return {content:b.content,anim:b.animationName,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches};});
     assert.notEqual(bloom.content,'none','bloom layer renders');
     assert.equal(bloom.anim==='none',bloom.reduced,'bloom pulses, static under reduced motion');
     await circle.getByRole('radio',{name:'Friends',exact:true}).click();
     assert.equal(await offers.count(),0,'Friends hides a ride outside your circle');
     assert.equal(await needCards.count(),2,'Friends keeps only needs from friends (and you)');
     assert.equal(await page.evaluate(()=>localStorage.getItem('zaylist:ridez-circle')),'friends','choice persists');
     await page.keyboard.press('ArrowRight');
     assert.equal(await circle.getByRole('radio',{name:'Friends of friends'}).getAttribute('aria-checked'),'true','arrow keys move the choice');
     assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Friends of friends','focus follows the choice');
     await circle.getByRole('radio',{name:'Everybody'}).click();
     assert.equal(await offers.count(),1);
     await ridezTile.click();await details.locator('.zxp').waitFor({state:'detached'});
     assert.equal(await ridezTile.getAttribute('aria-expanded'),'false','tapping the same tile closes the panel');
    }
    {
     // The leading rail area opens the marked expanded-carpool stub (no posting from it any more).
     const ridez=await openRidez();await ridez.locator('[data-action=open-carpool]').click();
     const stub=page.locator('.zas[aria-label^="Expanded carpool card"]');await stub.waitFor();await stub.locator('[data-stub=expanded-carpool]').waitFor();
     assert.equal(await stub.locator('[data-action^=post-]').count(),0,'posting moved to OFFER A RIDE / I NEED A RIDE');
     await page.keyboard.press('Escape');await stub.waitFor({state:'detached'});
    }
    // A carpool card opens the existing at-event ride flow.
    const launch=async()=>{const ridez=await openRidez();await ridez.locator('[data-card-category=carpool] button.ocarpool').first().click();};
    await launch();
    const atEvent=page.locator('dialog.at-event-dialog[open]');
    await atEvent.getByRole('button',{name:'Carpools & rides home'}).click();
    await atEvent.getByRole('button',{name:'Sign in to coordinate a ride'}).click();
    const login=atEvent.getByRole('dialog');
    await login.waitFor();
    await page.keyboard.press('Escape');
    await login.waitFor({state:'hidden'});
    assert.ok(await atEvent.isVisible(),'Closing sign-in returns to the at-event screen');
    await page.keyboard.press('Escape');
    await atEvent.waitFor({state:'hidden'});
    await launch();
    await atEvent.getByRole('button',{name:'Sign in to coordinate a ride'}).waitFor();
    await atEvent.getByRole('button',{name:'Back to event'}).click();
    assert.ok(await details.isVisible(),'Closing at-event preserves the event and its selected tab');
    await details.getByRole('button',{name:'Close event',exact:true}).press('Escape');await details.waitFor({state:'hidden'});
    assert.equal(await first.evaluate(el=>document.activeElement===el),true,'Escape restores event opener focus');
    await page.setViewportSize({width:1280,height:1000});continue;
   }
   await first.click();await page.locator('.zay-card-expanded').waitFor({state:'visible'});await settled(page);
   const box=await documentBox(page.locator('[data-card-expanded="true"]'));near(box.x,original[0].x,'mobile left anchor');near(box.y,original[0].y,'mobile top anchor');
   const overflow=await page.evaluate(()=>({viewport:innerWidth,page:document.documentElement.scrollWidth,items:[...document.querySelectorAll('body *')].map(el=>({className:typeof el.className==='string'?el.className:el.tagName,right:Math.round(el.getBoundingClientRect().right)})).filter(el=>el.right>innerWidth).slice(0,9)}));
   assert.ok(overflow.page<=overflow.viewport,'mobile no document horizontal overflow '+JSON.stringify(overflow));
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
   if(family==='event'){
    for(let i=0;i<2;i++){
     const details=await openEventDetails(page,openers.nth(i));
     assert.equal(await details.getAttribute('aria-label'),`QA Event ${i+1}`);
     assert.equal(await page.locator('.zay-card-stage--expanded .ocard:visible').count(),1,'only selected event remains open');
     await details.getByRole('button',{name:'Close event',exact:true}).click();await details.waitFor({state:'hidden'});await settled(page);
    }
    continue;
   }
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
