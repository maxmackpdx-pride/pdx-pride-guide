/** Real production-card layout checks. Run: node --test script/card-route-browser.test.mjs
 * Uses a local Vite fixture; mocks APIs and the map iframe to avoid network/data writes.
 * This checks host geometry and card actions, not the map iframe's internal controls.
 */
import assert from 'node:assert/strict';
import {test} from 'node:test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {createServer} from 'vite';
import react,{reactCompilerPreset} from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import {cardSourcePatterns,cardCompilerExcludedPatterns} from './react-compiler-card-scope.mjs';
import {chromium,webkit} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// Opt-in WebKit adds a second rendering engine, not a physical iOS Safari certification.
const browserEngine=process.env.CARD_ROUTE_QA_BROWSER??'chromium';
assert.ok(['chromium','webkit'].includes(browserEngine),`Unsupported card QA browser engine: ${browserEngine}`);
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<=1.1,`${message}: ${a} vs ${b}`);
const overlaps=(a,b)=>Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1 && Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1;
async function snapshot(page){return page.locator('#qa-grid').evaluate(grid=>[...grid.children].filter(el=>el.getBoundingClientRect().width>0).map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));}
async function settled(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.waitForTimeout(450);}
// Playwright's boundingBox x coordinate differs from DOM getBoundingClientRect
// by 10px in Linux WebKit on this route. Compare *both* card states in the same
// DOM viewport coordinate system; still require stable geometry and <=1.1px
// anchor parity. This does not hide an actual visual displacement.
const domCardRect=locator=>locator.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
async function stableDomCardRect(locator){
 const page=locator.page();
 await page.evaluate(async()=>{await document.fonts.ready;});
 let previous=null,steady=0;
 for(let attempt=0;attempt<24;attempt++){
  await page.waitForTimeout(120);
  const current=await domCardRect(locator);
  assert.ok(current,'Card must remain measurable while layout settles');
  if(previous&&['x','y','width','height'].every(k=>Math.abs(current[k]-previous[k])<=0.5))steady++;
  else steady=0;
  if(steady>=3)return current;
  previous=current;
 }
 assert.fail(`Card failed to stabilize before opening: ${JSON.stringify(previous)}`);
}


test('actual NEEDZ, BoardZ and Directory routes expand within their own card layout',{timeout:300000},async(t)=>{
 // Every invocation starts cold. Suites must never race over Vite's default
 // node_modules/.vite cache, and virtual HTML needs an explicit scanner entry.
 const cacheDir=await mkdtemp(path.join(tmpdir(),'card-route-browser-vite-'));
 t.after(()=>rm(cacheDir,{recursive:true,force:true}));
 const fixture='script/fixtures/card-route-browser.tsx';
 console.log('CARD_ROUTE_COMPILER_MODE '+(process.env.CARD_ROUTE_QA_COMPILER==='1'?'card-only-infer':'off')+' BROWSER_ENGINE '+browserEngine);
 const server=await createServer({configFile:false,root,cacheDir,optimizeDeps:{entries:[fixture],include:['react/jsx-runtime','react/jsx-dev-runtime']},publicDir:path.join(root,'client/public'),plugins:[react(),...(process.env.CARD_ROUTE_QA_COMPILER==='1'?[babel({presets:[reactCompilerPreset({compilationMode:'infer'})],include:cardSourcePatterns,exclude:cardCompilerExcludedPatterns})]:[]),{name:'card-qa-fixture',configureServer(s){s.middlewares.use(async(req,res,next)=>{if(!req.url?.startsWith('/__route-qa'))return next();const html=await s.transformIndexHtml(req.url,'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}</style></head><body><div id="root"></div><script type="module" src="/script/fixtures/card-route-browser.tsx"></script></body></html>');res.setHeader('Content-Type','text/html');res.end(html);});}}],resolve:{alias:{'@':path.join(root,'client/src'),'@shared':path.join(root,'shared'),'@assets':path.join(root,'attached_assets')}},server:{host:'127.0.0.1',port:0,hmr:false,watch:null},define:{__OUTZIDE_ASSETS__:JSON.stringify({script:'/outzide-map/app.js',maplibre:'/home-flight/vendor/maplibre-gl-5.6.2.js',maplibreCss:'/home-flight/vendor/maplibre-gl-5.6.2.css'}),__MAPZ_ASSETS__:'{}',__HOME_FLIGHT_BASE__:JSON.stringify('/home-flight')}});
 let browser;
 try{
 await server.listen();
 // Public Vite API: transform the explicit fixture before opening Chromium.
 await server.warmupRequest(`/${fixture}`);
 const base=server.resolvedUrls.local[0];
 // On GPU-less Linux runners, headless WPE can crash in graphics initialization.
 // The explicit headed WebKit option runs under Xvfb; all geometry and behavior
 // assertions remain identical. This does not count as physical Safari evidence.
 const webkitHeadless=process.env.CARD_ROUTE_QA_WEBKIT_HEADED!=='1';
 console.log('WEBKIT_RENDER_MODE '+(webkitHeadless?'headless':'headed-xvfb'));
 browser=browserEngine==='webkit'?await webkit.launch({headless:webkitHeadless}):await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1280,height:1000},reducedMotion:'reduce'});
 await context.addInitScript(()=>{localStorage.setItem("pdx-calm-mode","true");Math.random=()=>0.1;});
 const gifts=Array.from({length:8},(_,i)=>({id:i+1,userId:1,postType:'GIFT',title:`QA Gift ${i+1}`,description:'Useful gift',category:'Other',neighborhood:'Portland',pickupPreference:'Pickup',photoUrls:[],status:'OPEN',createdAt:'2026-11-01T00:00:00Z',expiresAt:'2027-01-01T00:00:00Z',username:'qa',interestCount:0}));
 const businesses=Array.from({length:8},(_,i)=>({id:100+i,name:`QA Cafe ${i+1}`,type:'cafe',description:i%2?'A welcoming local cafe with a longer description and community gatherings throughout the week.':'A welcoming local cafe',address:'123 Main St',neighborhood:i%2?'Northwest Portland neighborhood':'Portland',website:null,instagram:null,donateUrl:null,hours:null,phone:null,queerOwned:true,queerFriendly:true,imageUrl:null,lat:null,lng:null,isNew:false}));
 businesses.push(...Array.from({length:4},(_,i)=>({...businesses[i],id:200+i,name:`QA Tavern ${i+1}`,type:'bar'})));
 await context.route('**/outzide-map/places.json*',route=>route.fulfill({json:{places:[]}}));
 // Synthetic future events preserve the real Eventz card + modal flow without
 // depending on today's date, production API data, or a mutable event calendar.
 const events=Array.from({length:8},(_,i)=>({
  id:300+i,title:`QA Event ${i+1}`,description:'Synthetic event for Compiler route profiling',
  venueName:`QA Venue ${i+1}`,address:'123 Fictional Street',neighborhood:'Portland',
  dateStart:`2099-07-${String(15+i).padStart(2,'0')}T20:00:00`,
  dateEnd:`2099-07-${String(15+i).padStart(2,'0')}T23:00:00`,
  dayOfWeek:['WED','THU','FRI','SAT','SUN','MON','TUE','WED'][i],
  eventType:'NIGHTLIFE',admission:'FREE',ageRequirement:'21_PLUS',
  posterUrl:null,imageUrl:null,ticketUrl:null,website:null,lat:null,lng:null,
  status:'PUBLISHED',isFeatured:false,
 }));
 const mockApi=route=>{const p=new URL(route.request().url()).pathname;if(route.request().method()!=='GET')return route.abort('blockedbyclient');if(p==='/api/auth/me')return route.fulfill({status:401,json:{}});if(p==='/api/directory')return route.fulfill({json:businesses});if(p==='/api/ads/serve')return route.fulfill({json:{ads:[]}});if(p==='/api/events')return route.fulfill({json:events});if(/^\/api\/events\/\d+$/.test(p)){const event=events.find(item=>item.id===Number(p.split('/').pop()));return route.fulfill({status:event?200:404,json:event??{error:'Not found'}});}if(/^\/api\/directory\/\d+$/.test(p)){const business=businesses.find(item=>item.id===Number(p.split('/').pop()));return route.fulfill({status:business?200:404,json:business?{...business,description:`Fresh detail for ${business.name}`}:{error:'Not found'}});}if(p==='/api/housing')return route.fulfill({json:{posts:[]}});if(p.startsWith('/api/gifting'))return route.fulfill({json:p==='/api/gifting'?gifts:gifts[0]});return route.fulfill({json:[]});};
 await context.route('**/api/**',mockApi);
 let page;const errors=[];const focus=process.env.CARD_ROUTE_QA_FOCUS;
 // Isolated route probes distinguish cross-route WebKit renderer failures from card-specific regressions.

 // Whole-page profiling traverses the real Eventz, Resources, Boards and Directory
 // page components. Mocked read-only APIs prevent private or live data access.
 // It is a page-tree development-fixture comparison, NOT a production speedup.
 const pageProfiles=[];
 if(focus==='page-profile'){
  // A single-round mode lets CI interleave off/infer in balanced order while
  // retaining the original four-round behavior for standalone invocations.
  const roundEnv=process.env.CARD_ROUTE_QA_PROFILE_ROUND;
  const rounds=roundEnv===undefined?[1,2,3,4]:[Number(roundEnv)];
  assert.ok(rounds.every(round=>Number.isInteger(round)&&round>=1&&round<=4),'Profile round must be 1, 2, 3, or 4');
  for(const kind of ['events','resources','boards','directory']){
   const selector=kind==='events'?'.events-poster-grid [data-card-category="eventz"]':kind==='resources'?'.rd-card[data-card-category="needz"]':kind==='boards'?'.boardz-production-card':'.eb-grid .rd-card[data-card-category="placez"]';
   for(const round of rounds){
    page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    const search=kind==='events'?'?window=ALL':kind==='directory'?'?type=ALL&layout=grid':'?layout=grid';
    await page.goto(base+'__route-qa/'+kind+search,{waitUntil:'networkidle'});
    await settled(page);
    const card=page.locator(selector).first();await card.waitFor({state:'visible',timeout:30000});
    await card.scrollIntoViewIfNeeded();await settled(page);
    const cardTexts=async()=>page.locator(selector).allTextContents().then(xs=>xs.map(x=>x.replace(/\s+/g,' ').trim()));
    const before=await cardTexts();
    assert.ok(before.length>=1,kind+': expected production cards');
    const fingerprint=createHash('sha256').update(JSON.stringify(before)).digest('hex').slice(0,16);
    await page.evaluate(()=>{window.__zayWholePageProfiler=[];window.__zayWholePageProfilerEnabled=true;});
    if(kind==='events')await card.locator('.tonight-card__open').click();
    else if(kind==='boards')await card.locator('.punk-open-target').click();
    else await card.click({position:{x:kind==='resources'?80:60,y:kind==='resources'?90:75}});
    const expanded=page.locator(kind==='events'?'[data-testid="event-modal"]':'.zay-card-expanded');
    await expanded.waitFor({state:'visible',timeout:20000});
    await settled(page);
    await page.keyboard.press('Escape');
    await expanded.waitFor({state:'hidden',timeout:20000});
    await settled(page);
    const samples=await page.evaluate(()=>{window.__zayWholePageProfilerEnabled=false;return window.__zayWholePageProfiler||[];});
    assert.deepEqual(await cardTexts(),before,kind+': open/close changed card text');
    assert.ok(samples.length>=2,kind+' round '+round+': expected page Profiler callbacks for open and close');
    assert.ok(samples.every(sample=>Number.isFinite(sample.actualDurationMs)&&sample.actualDurationMs>=0&&Number.isFinite(sample.baseDurationMs)&&sample.baseDurationMs>=0),kind+' round '+round+': invalid Profiler durations');
    assert.ok(samples.every(sample=>sample.phase!=='mount'),kind+' round '+round+': measured navigation/mount rather than interactions');
    const actualDurationMs=Number(samples.reduce((total,item)=>total+item.actualDurationMs,0).toFixed(3));
    pageProfiles.push({kind,round,fingerprint,cards:before.length,commits:samples.length,actualDurationMs});
    console.log('REACT_ROUTE_WHOLE_PAGE_PROFILE '+JSON.stringify({mode:process.env.CARD_ROUTE_QA_COMPILER==='1'?'card-infer':'off',kind,round,fingerprint,cards:before.length,commits:samples.length,actualDurationMs}));
    await page.close();
   }
  }
  assert.deepEqual(errors,[],'Actual page-tree profiling encountered browser errors');
  const output=process.env.CARD_ROUTE_QA_PROFILE_OUTPUT;
  if(output)await writeFile(output,JSON.stringify({mode:process.env.CARD_ROUTE_QA_COMPILER==='1'?'card-infer':'off',browser:browser.version(),records:pageProfiles},null,2)+'\n');
 }
 for(const kind of focus==='grid-resources'?['resources']:focus==='grid-boards'?['boards']:focus?[]:['resources','boards']){
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 page.on('crash',()=>console.error(`CARD_ROUTE_BROWSER_PAGE_CRASH ${browserEngine} ${kind}`));
 await page.goto(`${base}__route-qa/${kind}?layout=grid`,{waitUntil:'networkidle'});await settled(page);
 const selector=kind==='resources'?'.rd-card[data-card-category="needz"]':'.boardz-production-card';
 await page.locator(selector).first().waitFor({timeout:30000});
 await page.locator(selector).first().scrollIntoViewIfNeeded();await settled(page);
 const before=await stableDomCardRect(page.locator(selector).first());
 const beforeMeta=await page.locator(selector).first().evaluate(el=>({scrollY:window.scrollY,top:el.getBoundingClientRect().top,parentTop:el.parentElement.getBoundingClientRect().top,margin:getComputedStyle(el).margin,transform:getComputedStyle(el).transform}));
 // Browser engines can disagree about grid intrinsic alignment. Capture both
 // the closed face and its hosting grid so regressions are diagnosed from real
 // geometry, not by changing the assertion or its 1.1px tolerance.
 const layoutProbe=async()=>page.locator(selector).first().evaluate(el=>{
   const slot=el.closest('.eb-original-card')||el;
   const grid=slot.parentElement;
   const info=node=>{if(!node)return null;const r=node.getBoundingClientRect(),c=getComputedStyle(node);return {x:r.x,y:r.y,width:r.width,height:r.height,style:node.getAttribute('style'),margin:c.margin,padding:c.padding,justifySelf:c.justifySelf,justifyContent:c.justifyContent,gridColumn:c.gridColumn,gridTemplateColumns:c.gridTemplateColumns,columnGap:c.columnGap,display:c.display,boxSizing:c.boxSizing,transform:c.transform};};
   return {face:info(el),slot:info(slot),grid:info(grid),scrollY:window.scrollY};
 });
 const closedLayout=browserEngine==='webkit'?await layoutProbe():null;
 if(closedLayout){near(closedLayout.face.x,before.x,`${kind}: DOM face origin before click`);near(closedLayout.face.y,before.y,`${kind}: DOM face vertical origin before click`);}
 const immediatelyBeforeClick=await domCardRect(page.locator(selector).first());
 assert.ok(immediatelyBeforeClick,'Card stays measurable before opening');
 near(immediatelyBeforeClick.x,before.x,`${kind}: stable closed x before click`);
 near(immediatelyBeforeClick.y,before.y,`${kind}: stable closed y before click`);
 if(kind==='resources')await page.locator(selector).first().click({position:{x:80,y:90}});else await page.locator(selector).first().locator('.punk-open-target').click();
 await page.locator('.zay-card-expanded').waitFor({state:'visible'});await settled(page);
 const hostLocForDiagnostics=()=>page.locator('[data-card-expanded="true"]').evaluate(el=>{const grid=el.parentElement;const info=node=>{if(!node)return null;const r=node.getBoundingClientRect(),c=getComputedStyle(node);return {x:r.x,y:r.y,width:r.width,height:r.height,style:node.getAttribute('style'),margin:c.margin,padding:c.padding,justifySelf:c.justifySelf,justifyContent:c.justifyContent,gridColumn:c.gridColumn,gridTemplateColumns:c.gridTemplateColumns,columnGap:c.columnGap,display:c.display,boxSizing:c.boxSizing,transform:c.transform};};return {slot:info(el),grid:info(grid)};});
 const host=await page.locator('[data-card-expanded="true"]').evaluate(el=>({tag:el.tagName,cls:el.className,parent:el.parentElement.className,rect:{x:el.getBoundingClientRect().x,y:el.getBoundingClientRect().y,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}}));
 assert.ok(!/eb-page|ab-page|eb-frame/.test(host.cls),`${kind}: selected whole page`);
 console.log(JSON.stringify({kind,before,beforeMeta,scrollY:await page.evaluate(()=>window.scrollY),host}));
 if(closedLayout)console.log('WEBKIT_GRID_LAYOUT',JSON.stringify({kind,closed:closedLayout,open:await hostLocForDiagnostics()}));
 near(host.rect.x,before.x,`${kind}: first-card left anchor`);
 near(host.rect.y,before.y,`${kind}: first-card top anchor`);
 assert.equal(await page.locator('[aria-modal="true"]:visible').count(),0);
 await page.screenshot({path:`/tmp/${kind}-card-expanded.png`,fullPage:false});
 await page.keyboard.press('Escape');await settled(page);
 assert.equal(await page.locator('.zay-card-expanded:visible').count(),0,`${kind}: Escape closes`);
 await page.close();
 }
 // Directory uses its actual responsive grid, not a fixture-sized collection.
 for(const width of focus?[]:[1280,390]){
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width,height:1000});
 await page.goto(`${base}__route-qa/directory?type=ALL&layout=grid`,{waitUntil:'networkidle'});await settled(page);
 const cards=page.locator('.eb-grid .rd-card[data-card-category="placez"]');
 if(!(await cards.count()))console.log('CARD_ROUTE_DIRECTORY_PROBE',JSON.stringify(await page.evaluate(()=>({url:location.href,results:document.querySelector('[data-testid=directory-result-count]')?.textContent,gridCount:document.querySelectorAll('.eb-grid').length,cardCount:document.querySelectorAll('[data-card-size]').length,visibleText:document.body.innerText.slice(0,950)}))),errors.slice(-5));
 await cards.first().waitFor();
 const boxes=await cards.evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));
 // Modern Placez uses a responsive discovery surface, not the retired small DirectoryCard.
 for(let i=0;i<boxes.length;i++){assert.ok(boxes[i].width>=100&&boxes[i].height>=100,'Directory discovery card has usable dimensions');for(let j=i+1;j<boxes.length;j++)assert.ok(!overlaps(boxes[i],boxes[j]),`Directory ${width}: closed cards overlap`);}
 await cards.first().scrollIntoViewIfNeeded();await settled(page);
 const title=cards.first().locator('.rd-card-copy h3');assert.ok(await title.isVisible(),'Directory title visible');
 const face=await cards.first().boundingBox();const scrollBeforeOpen=await page.evaluate(()=>scrollY);const titleBox=await title.boundingBox();assert.ok(titleBox.y>=face.y&&titleBox.y+titleBox.height<=face.y+face.height,'Directory title stays within face');
 await cards.first().click({position:{x:60,y:75}});await page.locator('.zay-card-expanded').waitFor();await settled(page);
 const host=page.locator('[data-card-expanded="true"]');assert.equal(await host.count(),1);
 await host.getByText('Fresh detail for QA Cafe 1',{exact:true}).waitFor({state:'visible'});await settled(page);
 assert.ok(await host.evaluate(el=>el.classList.contains('eb-original-card')&&el.parentElement.classList.contains('eb-grid')),'Directory expands own grid item');
 const expanded=await host.boundingBox();console.log(JSON.stringify({directoryWidth:width,face,expanded,host:await host.evaluate(el=>({style:el.getAttribute('style'),parentStyle:el.parentElement.getAttribute('style'),parentRect:el.parentElement.getBoundingClientRect().toJSON()}))}));await page.screenshot({path:`/tmp/directory-${width}-expanded.png`});near(expanded.x,face.x,'Directory left anchor');near(expanded.y+(width<768?await page.evaluate(()=>scrollY):0),face.y+(width<768?scrollBeforeOpen:0),'Directory document top anchor (mobile may reveal once)');
 console.log('PANEL',JSON.stringify(await host.evaluate(el=>[el,...el.querySelectorAll('.zay-card-detail-mount,.zay-card-expanded,.place-modal-overlay,.place-modal-panel,[role=dialog]')].map(e=>{const c=getComputedStyle(e);return {className:e.className,rect:e.getBoundingClientRect().toJSON(),width:c.width,minWidth:c.minWidth,maxWidth:c.maxWidth,padding:c.padding,margin:c.margin,boxSizing:c.boxSizing,translate:c.translate,transform:c.transform};}))));
 const panel=await host.locator('[role="dialog"]').boundingBox();assert.ok(panel&&panel.x>=expanded.x-1&&panel.x+panel.width<=expanded.x+expanded.width+1,'Directory detail panel fits expanded host');
 const closeButton=host.getByRole('button',{name:'Close place',exact:true});assert.ok(await closeButton.isVisible(),'Directory close button visible');const closeBox=await closeButton.boundingBox();assert.ok(closeBox.x>=0&&closeBox.x+closeBox.width<=width&&closeBox.y>=0&&closeBox.y+closeBox.height<=1000,'Directory close button stays in viewport');
 const neighborBoxes=await host.evaluate(el=>[...el.parentElement.children].filter(child=>child!==el&&child.getBoundingClientRect().width>0).map(child=>{const r=child.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));
 for(const neighbor of neighborBoxes)assert.ok(!overlaps(expanded,neighbor),'Directory expanded host does not cover neighbors');
 assert.equal(await page.locator('[aria-modal="true"]:visible').count(),0);
 await page.screenshot({path:`/tmp/directory-${width}-expanded.png`});
 await page.keyboard.press('Escape');await settled(page);assert.equal(await page.locator('.zay-card-expanded:visible').count(),0,'Directory Escape closes');
 await page.close();
 }
 // Default BrowseLane is a distinct production layout, including nested wrappers.
 // Multiple native category lanes exercise the two-track desktop composition;
 // varied metadata preserves the actual baseline/margin geometry of the faces.
 for(const kind of ['directory','resources'])for(const width of [1280,390]){
 if(focus&&focus!==`${kind}/${width}`)continue;
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:1000});
 await page.goto(`${base}__route-qa/${kind}${kind==='directory'?'?type=ALL&layout=browse':'?layout=browse'}`,{waitUntil:'networkidle'});await settled(page);
 const layoutParam=new URL(page.url()).searchParams.get('layout');assert.ok(layoutParam===null||layoutParam==='browse','Browse URL may normalize the default view while preserving the lane');
 const lane=kind==='directory'?page.locator('.eb-lane').filter({has:page.locator('.rd-card-copy h3',{hasText:'QA Cafe 1'})}):page.locator('.eb-lane:has(.events-rail__item:nth-child(5))').first();
 const expectedCategory=kind==='directory'?'placez':'needz';
 const cards=lane.locator(`.rd-card[data-card-category="${expectedCategory}"]`);await cards.first().waitFor({state:'visible',timeout:30000});
 const closedFaces=await cards.evaluateAll(els=>els.filter(el=>el.getBoundingClientRect().width&&getComputedStyle(el.closest('.events-rail__item')).display!=='none').map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));
 for(let i=0;i<closedFaces.length;i++){if(width===390)assert.ok(closedFaces[i].x>=0&&closedFaces[i].x+closedFaces[i].width<=width,`${kind}: mobile closed face fits viewport`);for(let j=i+1;j<closedFaces.length;j++)assert.ok(!overlaps(closedFaces[i],closedFaces[j]),`${kind} ${width}: closed browse faces ${i}/${j} overlap; rectangles ${JSON.stringify([closedFaces[i],closedFaces[j]])}`);}
 const docBox=async locator=>locator.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height};});
 for(const index of [0,1,2,0]){
 const card=cards.nth(index);await card.scrollIntoViewIfNeeded();await settled(page);
 const before=await docBox(card);
 const diagnose=async()=>card.evaluate(el=>{const chain=[];for(let node=el;node&&chain.length<9;node=node.parentElement){const r=node.getBoundingClientRect(),s=getComputedStyle(node);chain.push({tag:node.tagName,cls:node.className,style:node.getAttribute('style'),x:r.x+scrollX,y:r.y+scrollY,w:r.width,h:r.height,display:s.display,margin:s.margin,padding:s.padding,lineHeight:s.lineHeight,font:s.font,align:s.alignItems,verticalAlign:s.verticalAlign,transform:s.transform,transition:s.transition,animation:s.animation});}return {scrollY,fonts:document.fonts.status,chain};});
 const beforeDiagnostic=process.env.CARD_ROUTE_QA_DIAGNOSTICS?await diagnose():null;
 if(index===0)await page.screenshot({path:`/tmp/${kind}-browse-${width}-closed.png`});
 const hiddenBefore=await lane.locator('.events-rail__item').evaluateAll(els=>els.map(el=>getComputedStyle(el).display==='none'));
 if(width===1280)assert.ok(hiddenBefore.slice(4).every(Boolean)&&hiddenBefore.length>4,'Desktop browse keeps fifth+ cards hidden');
 const closedItems=await lane.locator('.events-rail__item:visible').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height};}));
 await card.click({position:{x:60,y:75}});const host=lane.locator('.events-rail__item[data-card-expanded="true"]');await host.waitFor();
 if(kind==='directory')await host.getByText(`Fresh detail for QA Cafe ${index+1}`,{exact:true}).waitFor();await settled(page);
 assert.deepEqual(await lane.locator('.events-rail__item').evaluateAll(els=>els.map(el=>getComputedStyle(el).display==='none')),hiddenBefore,'Browse hidden fifth+ visibility unchanged while open');
 if(index===0)await page.screenshot({path:`/tmp/${kind}-browse-${width}-expanded.png`});
 const expanded=await docBox(host);const anchor=await host.getAttribute('data-card-anchor');
 console.log('BROWSE',JSON.stringify({kind,width,index,before,expanded,anchor,layout:await host.evaluate(el=>({style:el.getAttribute('style'),parentStyle:el.parentElement.getAttribute('style'),tracks:getComputedStyle(el.parentElement).gridTemplateColumns,parent:el.parentElement.getBoundingClientRect().toJSON()}))}));
 near(expanded.y,before.y,`${kind} browse ${width} card${index+1} top anchor`);
 if(anchor==='right')near(expanded.x+expanded.width,before.x+before.width,`${kind} browse ${width} right anchor`);else near(expanded.x,before.x,`${kind} browse ${width} left anchor`);
 assert.ok(await host.evaluate(el=>el.parentElement.classList.contains('events-rail')),'Default browse expands rail item, not page or lane');
 const neighbors=await host.evaluate(el=>[...el.parentElement.children].filter(child=>child!==el&&getComputedStyle(child).display!=='none').map(child=>{const r=child.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height};}));
 for(const neighbor of neighbors)assert.ok(!overlaps(expanded,neighbor),`${kind} browse ${width}: expanded card covers neighbor`);
 assert.equal(await page.locator('[aria-modal="true"]:visible').count(),0);
 if(index===1)await page.keyboard.press('Escape');else await host.getByRole('button',{name:kind==='directory'?'Close place':'Close resource',exact:true}).click();await host.waitFor({state:'detached'});await settled(page);
 assert.deepEqual(await lane.locator('.events-rail__item').evaluateAll(els=>els.map(el=>getComputedStyle(el).display==='none')),hiddenBefore,'Browse hidden fifth+ visibility unchanged after close');
 const restored=await docBox(card);if(beforeDiagnostic)console.log('RESTORE_DIAGNOSTIC',JSON.stringify({kind,width,index,before:beforeDiagnostic,after:await diagnose()}));near(restored.x,before.x,'Browse restored x');near(restored.y,before.y,'Browse restored y');
 const restoredItems=await lane.locator('.events-rail__item:visible').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height};}));
 restoredItems.forEach((r,i)=>{near(r.x,closedItems[i].x,'Browse neighbor restored x');near(r.y,closedItems[i].y,'Browse neighbor restored y');});
 console.log(`PASS ${kind} default browse ${width} card${index+1}: anchor, native close/reopen, neighbor reflow`);
 }
 await page.close();
 }
 if(!focus||focus==='gutters'){
 const mobileContext=await browser.newContext({isMobile:true,hasTouch:true,deviceScaleFactor:1,viewport:{width:390,height:1000},reducedMotion:'reduce'});
 await mobileContext.addInitScript(()=>{localStorage.setItem('pdx-calm-mode','true');Math.random=()=>0.1;});
 await mobileContext.route('**/api/**',mockApi);await mobileContext.route('**/outzide-map/places.json*',route=>route.fulfill({json:{places:[]}}));
 for(const width of [320,390,430])for(const layout of ['browse','grid']){
 page=await mobileContext.newPage();page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:1000});
 await page.goto(`${base}__route-qa/directory?type=ALL&layout=${layout}`,{waitUntil:'networkidle'});await settled(page);
 const collection=layout==='grid'?page.locator('.eb-grid'):page.locator('.eb-lane').filter({has:page.locator('.rd-card-copy h3',{hasText:'QA Cafe 1'})}).locator('.events-rail');
 const cards=collection.locator('.rd-card[data-card-category="placez"]');await cards.first().waitFor();
 const documentBox=async locator=>locator.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height};});
 const first=await documentBox(cards.nth(0)),second=await documentBox(cards.nth(1));
 console.log('PLACEZ_RESPONSIVE',JSON.stringify({width,layout,first,second}));
 for(const face of [first,second])assert.ok(face.width>=100&&face.height>=100,'Discovery face has usable dimensions');
 if(layout==='grid'){
   assert.ok(first.x>=0&&first.x+first.width<=width+1,'First grid card fits viewport');
   assert.ok(second.y>=first.y+first.height-1,'Approved mobile grid is single-column');
 }
 assert.ok(!overlaps(first,second),'Closed Placez discovery cards never overlap');
 for(const index of [0,1,0]){
  await cards.nth(index).scrollIntoViewIfNeeded();await settled(page);const before=await documentBox(cards.nth(index));
  if(index===0)await page.screenshot({path:`/tmp/placez-gutters-${layout}-${width}-closed.png`});
  await cards.nth(index).locator('.rd-card-open').click();
  const host=collection.locator('[data-card-expanded="true"]');await host.waitFor();await settled(page);
  const expanded=await documentBox(host);
  assert.ok(expanded.x>=-1&&expanded.x+expanded.width<=width+1,'Expanded card fits mobile viewport');
  near(expanded.y,before.y,'Expanded corner remains document anchored');
  const anchor=await host.getAttribute('data-card-anchor');
  if(anchor==='right')near(expanded.x+expanded.width,before.x+before.width,'Right anchor preserved');
  else near(expanded.x,before.x,'Left anchor preserved');
  const panel=await documentBox(host.locator('[role="dialog"]'));
  assert.ok(panel.x>=expanded.x-1&&panel.x+panel.width<=expanded.x+expanded.width+1,'Detail panel fits host');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
  if(index===0)await page.screenshot({path:`/tmp/placez-gutters-${layout}-${width}-open.png`});
  await host.getByRole('button',{name:'Close place',exact:true}).click();await host.waitFor({state:'detached'});await settled(page);
  const restored=await documentBox(cards.nth(index));near(restored.x,before.x,'Close restores x');near(restored.y,before.y,'Close restores y');
 }
 console.log(`PASS Placez ${layout}/${width}: responsive discovery cards, no overlap, inline anchor and reopen`);await page.close();
 }
 await mobileContext.close();
 }
 // Real 18+ chat gate with synthetic-only content. Both compiler modes must
 // preserve explicit acknowledgement, decline, reload and browser isolation.
 if(!focus){
  const consentContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  try{
   await consentContext.route('**/api/**',mockApi);
   const consentPage=await consentContext.newPage();
   consentPage.on('pageerror',e=>errors.push(e.message));
   await consentPage.goto(`${base}__route-qa/adult-gate`,{waitUntil:'networkidle'});
   const gate=consentPage.getByRole('alertdialog',{name:'18 and over only'});
   const gatedBody=consentPage.getByTestId('adult-chat-content');
   await gate.waitFor({state:'visible'});
   assert.equal(await gatedBody.count(),0,'Adult chat content must not mount before acknowledgement');
   assert.equal(await consentPage.evaluate(()=>localStorage.getItem('pdx-chat-18-ack-v1')),null,'No unsolicited adult acknowledgement');
   await gate.getByRole('button',{name:'Not now'}).click();
   await consentPage.getByTestId('adult-gate-declined').waitFor({state:'visible'});
   assert.equal(await gatedBody.count(),0,'Declining adult gate must not reveal chat');
   assert.equal(await consentPage.evaluate(()=>localStorage.getItem('pdx-chat-18-ack-v1')),null,'Declining must not persist adult acknowledgement');
   await consentPage.reload({waitUntil:'networkidle'});
   await gate.waitFor({state:'visible'});
   assert.equal(await gatedBody.count(),0,'Reload after decline remains gated');
   await gate.getByRole('button',{name:"I'm 18+ - enter chat"}).click();
   await gatedBody.waitFor({state:'visible'});
   assert.equal(await consentPage.evaluate(()=>localStorage.getItem('pdx-chat-18-ack-v1')),'1','Acceptance persists explicit adult acknowledgement');
   await consentPage.reload({waitUntil:'networkidle'});
   await gatedBody.waitFor({state:'visible'});
   assert.equal(await gate.count(),0,'Accepted browser context does not prompt again');
   await consentPage.close();
  }finally{await consentContext.close();}
  const freshContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  try{
   await freshContext.route('**/api/**',mockApi);
   const freshPage=await freshContext.newPage();
   freshPage.on('pageerror',e=>errors.push(e.message));
   await freshPage.goto(`${base}__route-qa/adult-gate`,{waitUntil:'networkidle'});
   await freshPage.getByRole('alertdialog',{name:'18 and over only'}).waitFor({state:'visible'});
   assert.equal(await freshPage.getByTestId('adult-chat-content').count(),0,'Adult consent must not leak to fresh browser context');
  }finally{await freshContext.close();}
  console.log('PASS adult chat consent: no pre-ack content, decline, explicit opt-in, reload and cross-context isolation');
 }
 if(!focus){
 // Current Needz safety is a RoomDiscoveryCard in the grid, not the retired selector.
 page=await context.newPage();await page.setViewportSize({width:390,height:844});
 await page.goto(`${base}__route-qa/resources?layout=grid&cat=safety`,{waitUntil:'networkidle'});
 const safetyCard=page.locator('.eb-grid .rd-card[data-card-category="needz"]').filter({has:page.getByRole('heading',{name:'ARE YOU SAFE?',exact:true})});
 await safetyCard.first().waitFor({state:'visible',timeout:30000});
 assert.equal(await safetyCard.count(),1,'Exactly one Needz safety card in the grid');
 await safetyCard.getByRole('button',{name:'View details for ARE YOU SAFE?',exact:true}).click();
 const safetyDrawer=page.locator('.rg-safety-drawer[aria-label="Oregon urgent help"]');
 await safetyDrawer.waitFor({state:'visible'});
 assert.equal(await page.locator('.zay-card-expanded:visible').count(),1,'Safety expands through CardDetails');
 await page.keyboard.press('Escape');await settled(page);
 await safetyDrawer.waitFor({state:'hidden'});
 assert.equal(await page.locator('.zay-card-expanded:visible').count(),0,'Safety Escape closes');
 await page.close();
 }
 assert.deepEqual(errors,[]);
 }finally{await browser?.close();await server.close();}
});
