/** Real production-card layout checks. Run: node --test script/card-route-browser.test.mjs
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
async function snapshot(page){return page.locator('#qa-grid').evaluate(grid=>[...grid.children].filter(el=>el.getBoundingClientRect().width>0).map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));}
async function settled(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.waitForTimeout(450);}


test('actual NEEDZ, BoardZ and Directory routes expand within their own card layout',{timeout:300000},async(t)=>{
 // Every invocation starts cold. Suites must never race over Vite's default
 // node_modules/.vite cache, and virtual HTML needs an explicit scanner entry.
 const cacheDir=await mkdtemp(path.join(tmpdir(),'card-route-browser-vite-'));
 t.after(()=>rm(cacheDir,{recursive:true,force:true}));
 const fixture='script/fixtures/card-route-browser.tsx';
 const server=await createServer({configFile:false,root,cacheDir,optimizeDeps:{entries:[fixture],include:['react/jsx-runtime','react/jsx-dev-runtime']},publicDir:path.join(root,'client/public'),plugins:[react(),{name:'card-qa-fixture',configureServer(s){s.middlewares.use(async(req,res,next)=>{if(!req.url?.startsWith('/__route-qa'))return next();const html=await s.transformIndexHtml(req.url,'<!doctype html><html><head><style>body{margin:24px!important}h1{font:16px sans-serif;margin-bottom:24px}@media(max-width:650px){body{margin:12px!important}#qa-grid{grid-template-columns:repeat(auto-fit,var(--qa-card-width))!important;width:100%!important;gap:16px!important}}</style></head><body><div id="root"></div><script type="module" src="/script/fixtures/card-route-browser.tsx"></script></body></html>');res.setHeader('Content-Type','text/html');res.end(html);});}}],resolve:{alias:{'@':path.join(root,'client/src'),'@shared':path.join(root,'shared'),'@assets':path.join(root,'attached_assets')}},server:{host:'127.0.0.1',port:0,hmr:false,watch:null},define:{__OUTZIDE_ASSETS__:JSON.stringify({script:'/outzide-map/app.js',maplibre:'/home-flight/vendor/maplibre-gl-5.6.2.js',maplibreCss:'/home-flight/vendor/maplibre-gl-5.6.2.css'}),__MAPZ_ASSETS__:'{}',__HOME_FLIGHT_BASE__:JSON.stringify('/home-flight')}});
 let browser;
 try{
 await server.listen();
 // Public Vite API: transform the explicit fixture before opening Chromium.
 await server.warmupRequest(`/${fixture}`);
 const base=server.resolvedUrls.local[0];
 browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1280,height:1000},reducedMotion:'reduce'});
 await context.addInitScript(()=>{localStorage.setItem("pdx-calm-mode","true");Math.random=()=>0.1;});
 const gifts=Array.from({length:8},(_,i)=>({id:i+1,userId:1,postType:'GIFT',title:`QA Gift ${i+1}`,description:'Useful gift',category:'Other',neighborhood:'Portland',pickupPreference:'Pickup',photoUrls:[],status:'OPEN',createdAt:'2026-11-01T00:00:00Z',expiresAt:'2027-01-01T00:00:00Z',username:'qa',interestCount:0}));
 const businesses=Array.from({length:8},(_,i)=>({id:100+i,name:`QA Cafe ${i+1}`,type:'cafe',description:'A welcoming local cafe',address:'123 Main St',neighborhood:'Portland',website:null,instagram:null,donateUrl:null,hours:null,phone:null,queerOwned:true,queerFriendly:true,imageUrl:null,lat:null,lng:null,isNew:false}));
 await context.route('**/outzide-map/places.json*',route=>route.fulfill({json:{places:[]}}));
 await context.route('**/api/**',route=>{const p=new URL(route.request().url()).pathname;if(route.request().method()!=='GET')return route.abort('blockedbyclient');if(p==='/api/auth/me')return route.fulfill({status:401,json:{}});if(p==='/api/directory')return route.fulfill({json:businesses});if(/^\/api\/directory\/\d+$/.test(p)){const business=businesses.find(item=>item.id===Number(p.split('/').pop()));return route.fulfill({status:business?200:404,json:business?{...business,description:`Fresh detail for ${business.name}`}:{error:'Not found'}});}if(p==='/api/housing')return route.fulfill({json:{posts:[]}});if(p.startsWith('/api/gifting'))return route.fulfill({json:p==='/api/gifting'?gifts:gifts[0]});return route.fulfill({json:[]});});
 let page;const errors=[];
 for(const kind of ['resources','boards']){
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${base}__route-qa/${kind}?layout=grid`,{waitUntil:'networkidle'});await settled(page);
 const selector=kind==='resources'?'.rg-directory-card[data-card-category="needz"]':'.boardz-production-card';
 await page.locator(selector).first().waitFor({timeout:30000});
 await page.locator(selector).first().scrollIntoViewIfNeeded();await settled(page);
 const before=await page.locator(selector).first().boundingBox();
 const beforeMeta=await page.locator(selector).first().evaluate(el=>({scrollY:window.scrollY,top:el.getBoundingClientRect().top,parentTop:el.parentElement.getBoundingClientRect().top,margin:getComputedStyle(el).margin,transform:getComputedStyle(el).transform}));
 if(kind==='resources')await page.locator(selector).first().click({position:{x:80,y:90}});else await page.locator(selector).first().locator('.punk-open-target').click();
 await page.locator('.zay-card-expanded').waitFor({state:'visible'});await settled(page);
 const host=await page.locator('[data-card-expanded="true"]').evaluate(el=>({tag:el.tagName,cls:el.className,parent:el.parentElement.className,rect:{x:el.getBoundingClientRect().x,y:el.getBoundingClientRect().y,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}}));
 assert.ok(!/eb-page|ab-page|eb-frame/.test(host.cls),`${kind}: selected whole page`);
 console.log(JSON.stringify({kind,before,beforeMeta,scrollY:await page.evaluate(()=>window.scrollY),host}));
 near(host.rect.x,before.x,`${kind}: first-card left anchor`);
 near(host.rect.y,before.y,`${kind}: first-card top anchor`);
 assert.equal(await page.locator('[aria-modal="true"]:visible').count(),0);
 await page.screenshot({path:`/tmp/${kind}-card-expanded.png`,fullPage:false});
 await page.keyboard.press('Escape');await settled(page);
 assert.equal(await page.locator('.zay-card-expanded:visible').count(),0,`${kind}: Escape closes`);
 await page.close();
 }
 // Directory uses its actual responsive grid, not a fixture-sized collection.
 for(const width of [1280,390]){
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width,height:1000});
 await page.goto(`${base}__route-qa/directory?layout=grid`,{waitUntil:'networkidle'});await settled(page);
 const cards=page.locator('.eb-grid .pdxPlace[data-card-size]');await cards.first().waitFor();
 const boxes=await cards.evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));
 const expected=width===390?{width:136,height:170}:{width:200,height:403};
 for(let i=0;i<boxes.length;i++){near(boxes[i].width,expected.width,'Directory width');near(boxes[i].height,expected.height,'Directory height');for(let j=i+1;j<boxes.length;j++)assert.ok(!overlaps(boxes[i],boxes[j]),`Directory ${width}: closed cards overlap`);}
 await cards.first().scrollIntoViewIfNeeded();await settled(page);
 const title=cards.first().locator('.pdxPlace__name');assert.ok(await title.isVisible(),'Directory title visible');
 const face=await cards.first().boundingBox();const titleBox=await title.boundingBox();assert.ok(titleBox.y>=face.y&&titleBox.y+titleBox.height<=face.y+face.height,'Directory title stays within face');
 await cards.first().click({position:{x:60,y:75}});await page.locator('.zay-card-expanded').waitFor();await settled(page);
 const host=page.locator('[data-card-expanded="true"]');assert.equal(await host.count(),1);
 await host.getByText('Fresh detail for QA Cafe 1',{exact:true}).waitFor({state:'visible'});await settled(page);
 assert.ok(await host.evaluate(el=>el.classList.contains('eb-original-card')&&el.parentElement.classList.contains('eb-grid')),'Directory expands own grid item');
 const expanded=await host.boundingBox();console.log(JSON.stringify({directoryWidth:width,face,expanded,host:await host.evaluate(el=>({style:el.getAttribute('style'),parentStyle:el.parentElement.getAttribute('style'),parentRect:el.parentElement.getBoundingClientRect().toJSON()}))}));await page.screenshot({path:`/tmp/directory-${width}-expanded.png`});near(expanded.x,face.x,'Directory left anchor');near(expanded.y,face.y,'Directory top anchor');
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
 // Safety card uses the actual mobile page with its inserted card.
 page=await context.newPage();await page.setViewportSize({width:390,height:844});
 await page.goto(`${base}__route-qa/resources?layout=grid&cat=safety`,{waitUntil:'networkidle'});
 await page.locator('.needz-mobile-safety-card').first().click();await page.locator('.zay-card-expanded').waitFor({state:'visible'});
 await page.keyboard.press('Escape');await settled(page);
 assert.equal(await page.locator('.zay-card-expanded:visible').count(),0,'Safety Escape closes');
 assert.deepEqual(errors,[]);
 }finally{await browser?.close();await server.close();}
});
