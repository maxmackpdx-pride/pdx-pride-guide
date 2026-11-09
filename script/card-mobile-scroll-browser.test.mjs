/** Mobile Placez viewport and native internal-scroll checks.
 * Run: node --test script/card-mobile-scroll-browser.test.mjs
 * Uses real Directory/chrome with local API mocks; no live writes.
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
async function settled(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.waitForTimeout(450);}


test('mobile inline Placez keeps all corners and pinned image/phone while only lower content scrolls',{timeout:300000},async(t)=>{
 const cacheDir=await mkdtemp(path.join(tmpdir(),'card-mobile-scroll-vite-'));
 t.after(()=>rm(cacheDir,{recursive:true,force:true}));
 const fixture='script/fixtures/card-mobile-scroll-browser.tsx';
 const server=await createServer({configFile:false,root,cacheDir,optimizeDeps:{entries:[fixture],include:['react/jsx-runtime','react/jsx-dev-runtime']},publicDir:path.join(root,'client/public'),plugins:[react(),{name:'card-qa-fixture',configureServer(s){s.middlewares.use(async(req,res,next)=>{if(!req.url?.startsWith('/__route-qa'))return next();const html=await s.transformIndexHtml(req.url,'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}</style></head><body><div id="root"></div><script type="module" src="/script/fixtures/card-mobile-scroll-browser.tsx"></script></body></html>');res.setHeader('Content-Type','text/html');res.end(html);});}}],resolve:{alias:{'@':path.join(root,'client/src'),'@shared':path.join(root,'shared'),'@assets':path.join(root,'attached_assets')}},server:{host:'127.0.0.1',port:0,hmr:false,watch:null},define:{__OUTZIDE_ASSETS__:JSON.stringify({script:'/outzide-map/app.js',maplibre:'/home-flight/vendor/maplibre-gl-5.6.2.js',maplibreCss:'/home-flight/vendor/maplibre-gl-5.6.2.css'}),__MAPZ_ASSETS__:'{}',__HOME_FLIGHT_BASE__:JSON.stringify('/home-flight')}});
 let browser;
 try{
  await server.listen();await server.warmupRequest(`/${fixture}`);const base=server.resolvedUrls.local[0];
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({isMobile:true,hasTouch:true,viewport:{width:390,height:844},deviceScaleFactor:1,reducedMotion:'reduce'});
  const business={id:100,name:'QA Community Cafe',type:'cafe',description:Array(35).fill('Community events, accessible seating, coffee and neighborhood resources.').join(' '),address:'123 Main St',neighborhood:'Portland',website:'https://example.invalid/cafe',instagram:null,donateUrl:null,hours:'Daily 7am–9pm',phone:'503-555-0123',queerOwned:true,queerFriendly:true,imageUrl:'/directory-logos/coffeebeer-white.svg',lat:null,lng:null,isNew:false};
  const businesses=Array.from({length:8},(_,i)=>({...business,id:100+i,name:`QA Community Cafe ${i+1}`}));
  await context.route('**/outzide-map/places.json*',route=>route.fulfill({json:{places:[]}}));
  await context.route('**/api/**',route=>{const req=route.request(),p=new URL(req.url()).pathname;if(req.method()!=='GET')return route.abort('blockedbyclient');if(p==='/api/auth/me')return route.fulfill({status:401,json:{}});if(p==='/api/directory')return route.fulfill({json:businesses});if(/^\/api\/directory\/\d+$/.test(p))return route.fulfill({json:businesses.find(b=>b.id===Number(p.split('/').pop()))});return route.fulfill({json:[]});});
  const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const shots='/tmp/zaylist-mobile-scroll';await mkdir(shots,{recursive:true});
  async function geometryReady(card){
   await page.waitForFunction(source=>{
    if(!source?.isConnected||document.fonts.status!=='loaded')return false;
    for(let node=source;node;node=node.parentElement){
     if(node.getAnimations().some(animation=>Number.isFinite(animation.effect?.getComputedTiming().endTime)&&!['finished','idle'].includes(animation.playState)))return false;
    }
    return true;
   },await card.elementHandle());
  }
  async function lifecycle(card,label){if(!process.env.CARD_MOBILE_DIAGNOSTIC)return;console.log('LIFECYCLE',label,JSON.stringify(await card.evaluate(source=>{
    const describe=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {tag:el.tagName,id:el.id,class:el.className,cardSize:el.getAttribute('data-card-size'),inline:el.getAttribute('style'),rect:{x:r.x,y:r.y,docY:r.y+scrollY,width:r.width,height:r.height},css:Object.fromEntries(['display','position','marginTop','marginBottom','paddingTop','paddingBottom','gap','height','fontFamily','fontSize','lineHeight','transform','transition','animation'].map(k=>[k,s[k]]))};};
    const ancestors=[];for(let el=source;el&&ancestors.length<9;el=el.parentElement)ancestors.push(describe(el));
    return {pageY:scrollY,innerWidth,innerHeight,fonts:document.fonts.status,ancestors,chrome:[...document.querySelectorAll('.site-header,.zl-dock,.eb-header,.eb-browse-lane__header')].map(describe),animations:document.getAnimations().filter(a=>a.playState==='running').slice(0,10).map(a=>({target:a.effect?.target?.className,time:a.currentTime,timing:a.effect?.getComputedTiming()}))};
   })));}
  async function state(){return page.evaluate(()=>{
   const box=selector=>{const el=document.querySelector(selector);if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
   const scroller=document.querySelector('.place-modal-panel__content-scroll');
   return {coarse:matchMedia('(pointer:coarse)').matches,mobileMarker:document.querySelector('.zay-card-expanded')?.getAttribute('data-card-mobile-viewport'),pageY:scrollY,pageX:scrollX,viewport:{width:visualViewport.width,height:visualViewport.height,top:visualViewport.offsetTop},panel:box('.event-modal.eb-detail--place'),hero:box('.place-modal-panel__hero'),image:box('.place-modal-panel__hero img'),phone:box('.place-modal-panel__contacts'),body:box('.place-modal-panel__content-scroll'),topChrome:box('.site-header'),bottomChrome:box('.z-mobile-dock'),scroll:scroller?{top:scroller.scrollTop,height:scroller.clientHeight,total:scroller.scrollHeight}:null};
  });}
  function fits(s,label){assert.ok(s.panel&&s.hero&&s.image&&s.phone&&s.body,`${label}: native panel/hero/phone/body exist`);assert.ok(s.panel.x>=-1&&s.panel.right<=s.viewport.width+1,`${label}: both side corners fit ${JSON.stringify(s)}`);assert.ok(s.panel.y>=s.topChrome.bottom-1&&s.panel.bottom<=s.bottomChrome.y+1,`${label}: top/bottom corners clear fixed chrome ${JSON.stringify(s)}`);assert.ok(s.topChrome.height>=40&&s.bottomChrome.height>=56,`${label}: real mobile chrome is mounted`);assert.ok(s.body.height>=64,`${label}: lower content has usable scroll area ${JSON.stringify(s)}`);}
  async function cornersClear(label){
   const hits=await page.locator('.event-modal.eb-detail--place').evaluate(panel=>{const r=panel.getBoundingClientRect(),inset=Math.ceil((parseFloat(getComputedStyle(panel).borderTopLeftRadius)||20)*(1-1/Math.sqrt(2))+2);return [[r.left+inset,r.top+inset],[r.right-inset,r.top+inset],[r.left+inset,r.bottom-inset],[r.right-inset,r.bottom-inset],[r.left+r.width/2,r.top+2],[r.left+r.width/2,r.bottom-2]].map(([x,y])=>{const hit=document.elementFromPoint(x,y);return {x,y,clear:!!hit&&(hit===panel||panel.contains(hit)),hit:hit?.className};});});
   await page.screenshot({path:path.join(shots,`${label}-corners.png`),fullPage:false});
   assert.ok(hits.every(hit=>hit.clear),`${label}: all four corners unobscured ${JSON.stringify(hits)}`);
  }
  async function scrollProof(label){
   const before=await state();fits(before,label);assert.ok(before.scroll.total>before.scroll.height+50,`${label}: real overflowing native content`);
   const x=before.body.x+before.body.width/2,y=before.body.y+before.body.height*.8;
   if(label==='390x844'){
    const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(let step=1;step<=6;step++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-step*Math.min(25,before.body.height/12)}]});await page.waitForTimeout(20);}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(300);
    // Keep this target session until context teardown: detaching CDP resets Chromium touch emulation.
    assert.ok(await page.evaluate(()=>matchMedia('(pointer:coarse)').matches),'native touch context remains coarse after swipe');
    const touched=await state();assert.ok(touched.scroll.top>before.scroll.top+10,'touch swipe scrolls lower content');near(touched.pageY,before.pageY,'touch swipe does not move outer page');console.log('TOUCH_PROOF',JSON.stringify({before:before.scroll,after:touched.scroll,pageY:touched.pageY}));
   }
   await page.mouse.move(before.body.x+before.body.width/2,before.body.y+before.body.height/2);await page.mouse.wheel(0,420);await page.waitForTimeout(300);
   const after=await state();assert.ok(after.scroll.top>before.scroll.top+10,`${label}: wheel scrolls lower body ${JSON.stringify({before,after})}`);
   near(after.pageY,before.pageY,`${label}: internal scrolling never moves page`);near(after.pageX,before.pageX,`${label}: internal scroll never moves page sideways`);
   for(const part of ['panel','hero','image','phone']){near(after[part].x,before[part].x,`${label}: ${part} pinned x`);near(after[part].y,before[part].y,`${label}: ${part} pinned y`);}
   // Scroll to real last content through wheel input, not a synthetic scrollTop assignment.
   for(let i=0;i<20;i++){const now=await state();if(now.scroll.top+now.scroll.height>=now.scroll.total-2)break;await page.mouse.wheel(0,now.scroll.total);await page.waitForTimeout(100);}
   const end=await state();assert.ok(end.scroll.top+end.scroll.height>=end.scroll.total-2,`${label}: lower content reaches end`);near(end.pageY,before.pageY,`${label}: no page scroll while reaching final content`);
   const last=await page.locator('.place-modal-panel__content-scroll').evaluate(el=>{const visible=[...el.querySelectorAll('button,a,p,summary')].filter(n=>{const r=n.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(n).visibility!=='hidden';});const n=visible.at(-1),r=n?.getBoundingClientRect(),b=el.getBoundingClientRect();return {text:n?.textContent,top:r?.top,bottom:r?.bottom,bodyTop:b.top,bodyBottom:b.bottom};});
   assert.ok(last.bottom<=last.bodyBottom+2&&last.bottom>last.bodyTop,`${label}: last visible native content accessible ${JSON.stringify(last)}`);
   await page.mouse.wheel(0,600);await page.waitForTimeout(200);near((await state()).pageY,before.pageY,`${label}: lower boundary does not chain scroll to page`);
   await page.screenshot({path:path.join(shots,`${label}-scrolled.png`),fullPage:false});console.log('SCROLL_PROOF',JSON.stringify({label,before,after,end,last}));
  }
  for(const viewport of [{width:320,height:568},{width:390,height:844},{width:430,height:932},{width:320,height:568,variant:'long-multi'},{width:430,height:932,variant:'last',last:true}]){
   const label=`${viewport.width}x${viewport.height}${viewport.variant?'-'+viewport.variant:''}`;if(process.env.CARD_MOBILE_SCROLL_FOCUS&&!label.includes(process.env.CARD_MOBILE_SCROLL_FOCUS))continue;await page.setViewportSize({width:viewport.width,height:viewport.height});if(viewport.variant==='long-multi')businesses[0]={...businesses[0],name:'QA Community Cafe and Neighborhood Welcome Center With A Long Name',locations:[{label:'Primary community welcome desk and visitor information',address:'123 Main St',phone:'503-555-0123'},{label:'Second location',address:'456 Second St',phone:'503-555-0456'},{label:'Third location',address:'789 Third St',phone:'503-555-0789'}]};
   await page.goto(`${base}__route-qa/directory?type=ALL&layout=grid`,{waitUntil:'networkidle'});
   const cards=page.locator('.eb-grid [data-card-size="small"]');const card=viewport.variant==='long-multi'?cards.filter({has:page.getByRole('button',{name:'View details for '+businesses[0].name,exact:true})}):viewport.last?cards.last():cards.first();await card.waitFor();await card.scrollIntoViewIfNeeded();await settled(page);await geometryReady(card);
   await lifecycle(card,label+' before-open');
   const original=await card.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+scrollX,right:r.right+scrollX,y:r.y+scrollY};});
   await card.locator('button[aria-label^="View details for "]').click();await page.locator('.event-modal.eb-detail--place').waitFor();await page.locator('.place-modal-panel__content-scroll').waitFor();await settled(page);
   if(viewport.variant==='long-multi'){const panel=page.locator('.event-modal.eb-detail--place');await panel.getByText(businesses[0].name,{exact:true}).waitFor();assert.equal(await panel.locator('.place-modal-panel__content-scroll a[href="tel:5035550456"]').count(),1,'second location phone in lower scrolling content');assert.equal(await panel.locator('.place-modal-panel__content-scroll a[href="tel:5035550789"]').count(),1,'third location phone in lower scrolling content');}
   const host=await page.locator('[data-card-expanded="true"]').evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+scrollX,right:r.right+scrollX,y:r.y+scrollY,anchor:el.dataset.cardAnchor,position:getComputedStyle(el).position};});near(host.anchor==='right'?host.right:host.x,host.anchor==='right'?original.right:original.x,`${label}: inline document anchored edge`);near(host.y,original.y,`${label}: inline document top anchor`);assert.ok(!['fixed','absolute'].includes(host.position),'expanded card remains in flow');assert.equal(await page.locator('[aria-modal=true]:visible').count(),0,'no floating modal');
   fits(await state(),label);await cornersClear(label);const phoneNumber=page.locator('.place-modal-panel__contacts a:visible').first();assert.ok(await phoneNumber.evaluate(el=>el.scrollWidth<=el.clientWidth+1),'primary phone fully visible');await page.screenshot({path:path.join(shots,`${label}-open.png`),fullPage:false});await scrollProof(label);
   if(viewport.width===390){await page.setViewportSize({width:844,height:390});await page.waitForTimeout(500);await page.screenshot({path:path.join(shots,'landscape-diagnostic.png'),fullPage:false});fits(await state(),'landscape');await cornersClear('landscape');await page.screenshot({path:path.join(shots,'landscape-open.png'),fullPage:false});const scroller=page.locator('.place-modal-panel__content-scroll');await scroller.hover();await page.mouse.wheel(0,-100000);await page.waitForTimeout(250);await scrollProof('landscape');await page.setViewportSize(viewport);await page.waitForTimeout(500);await geometryReady(card);assert.equal(await card.getAttribute('data-card-size'),'small','responsive face returns to small');fits(await state(),'portrait-restored');await lifecycle(card,label+' returned-portrait');const returned=await page.locator('[data-card-expanded="true"]').evaluate(el=>{const r=el.getBoundingClientRect();return {y:r.y+scrollY,x:r.x+scrollX};});near(returned.y,original.y,'returned portrait preserves original document top anchor');near(returned.x,original.x,'returned portrait preserves original document left anchor');}
   const close=page.locator('.event-modal.eb-detail--place button[aria-label*="Close"]').first();const closeBox=await close.boundingBox(),s=await state();assert.ok(closeBox.y>=s.topChrome.bottom&&closeBox.y+closeBox.height<=s.bottomChrome.y,'close remains reachable without scrolling outer page');await lifecycle(card,label+' before-close');await close.click();await lifecycle(card,label+' immediate-close');const immediate=await card.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY};});near(immediate.x,original.x,label+': immediate close restores document x without transition bounce');near(immediate.y,original.y,label+': immediate close restores document y without transition bounce');await page.locator('[data-card-expanded=true]').waitFor({state:'detached'});
   await settled(page);
   await geometryReady(card);near((await card.boundingBox()).width,136,'closed face settles to native small width');
   await lifecycle(card,label+' settled-close');
   const restored=await card.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {x:r.x+scrollX,y:r.y+scrollY,usable:!!hit&&(hit===el||el.contains(hit)),hit:hit?.className};});
   near(restored.x,original.x,`${label}: closed document x restored`);near(restored.y,original.y,`${label}: closed document y restored`);assert.ok(restored.usable,`${label}: closed opener not hidden by restored dock ${JSON.stringify(restored)}`);
   const restoredHeart=await card.locator('[data-card-heart]').evaluate(button=>{const r=button.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {x:r.x,y:r.y,width:r.width,height:r.height,usable:!!hit&&(hit===button||button.contains(hit)),hit:hit?.outerHTML?.slice(0,500),pageY:scrollY};});
   assert.ok(restoredHeart.usable,`${label}: restored heart not covered after close ${JSON.stringify(restoredHeart)}`);
   await card.locator('button[aria-label^="View details for "]').click();await page.locator('.place-modal-panel__content-scroll').waitFor();await settled(page);fits(await state(),`${label}-reopen`);await cornersClear(`${label}-reopen`);await page.locator('.event-modal.eb-detail--place button[aria-label*="Close"]').first().click();await page.locator('[data-card-expanded=true]').waitFor({state:'detached'});
   console.log(`PASS ${label}: viewport fit, document anchor, real internal scrolling, fixed image/phone, native close`);
  }
  assert.deepEqual(errors,[],'no uncaught browser errors');
 }finally{await browser?.close();await server.close();}
});
