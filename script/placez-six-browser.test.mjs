import assert from 'node:assert/strict';
import {test} from 'node:test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const near=(a,b,label)=>assert.ok(Math.abs(a-b)<=1.1,`${label}: ${a} vs ${b}`);
test('six PlaceZ native faces, controls, data and expanded continuity',{timeout:600000},async()=>{
 const cacheDir=await mkdtemp(path.join(tmpdir(),'placez-six-'));
 const fixture='script/fixtures/placez-six-browser.tsx',shots=process.env.PLACEZ_QA_SCREENSHOT_DIR||'artifacts/placez-six';
 await mkdir(shots,{recursive:true});let server,browser,page;
 const evidence=[];
 const checkpoint=async(stage)=>{console.log("PLACEZ_BROWSER_STAGE "+stage);await writeFile(path.join(shots,"progress.json"),JSON.stringify({stage,at:new Date().toISOString()},null,2));};
 try{
  server=await createServer({configFile:false,root,cacheDir,publicDir:path.join(root,'client/public'),plugins:[react(),{name:'six-fixture',configureServer(s){s.middlewares.use(async(req,res,next)=>{
   if(!req.url?.startsWith('/__placez-six')&&!req.url?.startsWith('/directory'))return next();res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml(req.url,`<!doctype html><html data-zaylist-cards="true"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:12px!important}#card-stage{width:100%;max-width:100%}#before,#after{margin:12px}</style></head><body><div id="root"></div><script type="module" src="/${fixture}"></script></body></html>`));
  });}}],resolve:{alias:{'@':path.join(root,'client/src'),'@shared':path.join(root,'shared'),'@assets':path.join(root,'attached_assets')}},server:{host:'127.0.0.1',port:0,hmr:false,watch:null},define:{__OUTZIDE_ASSETS__:JSON.stringify({script:'/outzide-map/app.js',maplibre:'/home-flight/vendor/maplibre-gl-5.6.2.js',maplibreCss:'/home-flight/vendor/maplibre-gl-5.6.2.css'}),__MAPZ_ASSETS__:'{}',__HOME_FLIGHT_BASE__:JSON.stringify('/home-flight')}});
  await server.listen();browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:1000},reducedMotion:'reduce',serviceWorkers:'block'});
  const writes=[],errors=[];
  const names={30:'Holocene',3:'Stag PDX',31:'Alberta Rose Theatre',5:'Eagle Portland',2:'Darcelle XV',23:'Pizza Thief'};
  const mockPlace=id=>({id,name:names[id]||'Nearby test restaurant',type:id===23||id===903?'restaurant':'venue',description:'Isolated API fixture',address:'Portland',neighborhood:'Portland',phone:'503-555-0100',website:null,instagram:null,donateUrl:null,hours:'Hours supplied by venue',queerOwned:false,queerFriendly:true,imageUrl:null,lat:45.52,lng:-122.67,isNew:false,isFollowing:false,upcomingEvents:[{id:95001,title:'Fixture future event',dateStart:new Date(Date.now()+3600000).toISOString(),dateEnd:new Date(Date.now()+7200000).toISOString(),dayOfWeek:null}],pastEvents:[],gigs:[],spotted:[],promoters:[]});
  await context.route('**/api/**',route=>{const req=route.request();if(!['GET','HEAD'].includes(req.method())){writes.push(req.method()+' '+req.url());return route.abort();}const path=new URL(req.url()).pathname;return route.fulfill(path==='/api/auth/me'?{status:401,json:{}}:path==='/api/directory'?{json:[30,3,31,5,2,23,903].map(mockPlace)}:/^\/api\/directory\/\d+$/.test(path)?{json:mockPlace(Number(path.split('/').pop()))}:{json:[]});});
  await context.route('**/outzide-map/places.json*',route=>route.fulfill({json:{places:[]}}));
  await context.addInitScript(()=>{window.__placezTransitions=[];window.__placezDialogMotion=[];const animate=Element.prototype.animate;Element.prototype.animate=function(frames,options){if(this.matches?.('dialog.pz-native-viewport'))window.__placezDialogMotion.push({frames,options});return animate.call(this,frames,options);};const original=document.startViewTransition?.bind(document);if(original)document.startViewTransition=(...args)=>{const transition=original(...args);transition.ready.then(()=>window.__placezTransitions.push(document.getAnimations().map(animation=>({name:animation.animationName||'',duration:animation.effect?.getComputedTiming().duration||0})))).catch(()=>{});return transition;};});
  page=await context.newPage();page.on('pageerror',e=>{errors.push(e.message);console.log('PLACEZ_PAGE_ERROR '+e.message);});page.setDefaultTimeout(30000);
  for(const id of [30,3,31,5,2,23])for(const size of ['small','tall','wide','square']){
   await checkpoint(`closed:${id}:${size}:navigate`);
   await page.goto(`${server.resolvedUrls.local[0]}__placez-six?id=${id}&size=${size}`,{waitUntil:'networkidle'});
   await checkpoint(`closed:${id}:${size}:loaded`);
   const card=page.locator('.pz-card').first();await card.waitFor();await page.evaluate(()=>document.fonts.ready);assert.equal(await page.evaluate(async()=>{const faces=await document.fonts.load('800 24px "Barlow Condensed"');return faces.length>0&&faces.every(face=>face.status==='loaded');}),true,'Production display font loaded');
   await card.evaluate(async el=>Promise.all([...el.querySelectorAll('img')].map(img=>img.decode())));
   const title=card.locator('.pz-title');let typography=null;if(id===30&&size!=='wide'){assert.equal(await title.count(),0,'Holocene approved logo supplies its name');}else{typography=await title.evaluate(el=>({family:getComputedStyle(el).fontFamily,size:getComputedStyle(el).fontSize,weight:getComputedStyle(el).fontWeight}));assert.match(typography.family,/Barlow Condensed/i,'Approved condensed display typography');}
   const actual=await card.boundingBox(),expected={small:[136,170],tall:[200,403],wide:[360,216],square:[250,250]}[size];near(actual.width,expected[0],size+' width');near(actual.height,expected[1],size+' height');
   const heart=card.locator('.pz-heart button'),bounds=await heart.boundingBox();near(bounds.width,44,'target width');near(bounds.height,44,'target height');
   const ring=await heart.evaluate(el=>{const s=getComputedStyle(el,'::before');return {w:parseFloat(s.width),h:parseFloat(s.height),right:getComputedStyle(el.parentElement).right};});near(ring.w,32,'ring width');near(ring.h,32,'ring height');
   const ringRight=actual.x+actual.width-(bounds.x+6+32);near(ringRight,12,'visible right inset');
   assert.equal(await card.locator('[data-corner-control=heart]').count(),1);
   const mask=await card.locator('.pz-art').evaluate(el=>getComputedStyle(el).maskImage);assert.ok(mask.includes('header-cutout.svg'),'approved torn alpha mask');
   const maskUrl=mask.match(/url\(["']?(.*?)["']?\)/)?.[1];assert.ok(maskUrl);assert.equal((await page.request.get(maskUrl)).ok(),true,'mask asset loads');
   assert.equal(await card.locator('a[href^="https://www.zaylist.com"]').count(),0);
   if(size!=='square'){assert.equal(await card.locator('button[data-card-heart]').count(),1);await heart.click();await page.getByText('Authentication requested').waitFor();}
   await checkpoint(`closed:${id}:${size}:screenshot`);
   await page.screenshot({path:path.join(shots,`${id}-${size}.png`),fullPage:true});evidence.push({id,size,width:actual.width,height:actual.height,ringWidth:ring.w,rightInset:ringRight,typography});
   if(size==='wide'){
    assert.deepEqual(await card.locator('.pz-activity-count strong').allTextContents(),['00','00'],'Fresh empty API counts resolve without waiting a minute');
    await card.getByRole('button',{name:/Open Gigz/}).click();const expanded=page.locator('.pz-native-expanded');await expanded.waitFor();await expanded.getByRole('tab',{name:'Feed',exact:true}).waitFor();
    assert.equal(await expanded.getByRole('tab',{name:'Feed',exact:true}).getAttribute('aria-selected'),'true');
    await expanded.getByRole('button',{name:/Close /}).click();await expanded.waitFor({state:'hidden'});
    await card.getByRole('button',{name:/View details for/}).click();await expanded.waitFor();
    await page.waitForFunction(()=>document.querySelector('.pz-native-expanded [role=tab][aria-selected=true]')?.textContent==='Info');
    assert.equal(await expanded.getByRole('tab').count(),5);assert.equal(await expanded.locator('.pz-page-dot').count(),5);
    await expanded.getByRole('tab',{name:'People',exact:true}).click();await expanded.getByText('Staff',{exact:true}).waitFor();
    await expanded.getByRole('tab',{name:'Info',exact:true}).click();await expanded.getByRole('button',{name:/Close /}).click();
   }
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  for(const mode of ['normal','reduced','calm'])for(const size of ['small','tall','wide']){
   await checkpoint(`motion:${mode}:${size}`);
   await page.emulateMedia({reducedMotion:mode==='reduced'?'reduce':'no-preference'});
   await page.evaluate(calm=>localStorage.setItem('pdx-calm-mode',String(calm)),mode==='calm');
   await page.goto(`${server.resolvedUrls.local[0]}__placez-six?id=30&size=${size}`,{waitUntil:'networkidle'});
   const source=page.locator('[data-card-morph]').first(),before=await source.boundingBox();
   const trigger=page.getByRole('button',{name:'View details for Holocene',exact:true});await trigger.focus();await trigger.click();
   await page.locator('.pz-native-expanded').waitFor();await page.waitForFunction(()=>document.querySelector('[data-card-morph]')?.getAttribute('data-card-morph-phase')==='open');
   const viewportDialog=page.locator('dialog.pz-native-viewport');
   if(mode==='normal'){
    await page.waitForFunction(()=>document.querySelector('dialog.pz-native-viewport')?.dataset.placezMotion==='open');
    const captured=JSON.parse(await viewportDialog.getAttribute('data-placez-source-rect'));
    near(captured.width,before.width,'native motion source width');near(captured.height,before.height,'native motion source height');
    assert.ok(await page.evaluate(()=>window.__placezDialogMotion.some(a=>a.options.duration===280&&a.frames[0].scale!=='1 1')),'Dialog itself animates from source size');
   }else assert.equal(await viewportDialog.getAttribute('data-placez-motion'),'quiet');
   await page.screenshot({path:path.join(shots,`motion-${mode}-${size}-expanded.png`),fullPage:true});
   if(mode==='normal')await page.waitForFunction(()=>window.__placezTransitions.some(group=>group.some(animation=>animation.duration>0&&animation.name.includes('view-transition'))));
   await page.getByRole('button',{name:'Close Holocene',exact:true}).click();await page.locator('.pz-native-expanded').waitFor({state:'hidden'});
   await page.waitForFunction(()=>document.querySelector('[data-card-morph]')?.getAttribute('data-card-morph-phase')==='closed');
   const after=await source.boundingBox();near(after.width,before.width,'reverse width');near(after.height,before.height,'reverse height');near(after.x,before.x,'reverse x');near(after.y,before.y,'reverse y');
   await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='View details for Holocene');
   await trigger.click();await page.locator('.pz-native-expanded').waitFor();await page.getByRole('button',{name:'Close Holocene',exact:true}).click();await page.locator('.pz-native-expanded').waitFor({state:'hidden'});
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const width of [320,390,1280]){
   await page.setViewportSize({width,height:844});await page.goto(`${server.resolvedUrls.local[0]}__placez-six?id=23&size=tall`,{waitUntil:'networkidle'});await page.getByRole('button',{name:/View details for Pizza/}).click();const expanded=page.locator('.pz-native-expanded');await expanded.waitFor();const bounds=await expanded.boundingBox();assert.ok(bounds.width<=width,`Expanded fits ${width}`);assert.ok(bounds.width>200,`Expanded uses available width at ${width}`);assert.ok(bounds.height>=844*.93&&bounds.height<=844*.96,'Expanded uses approximately 95% of viewport');assert.equal(await page.locator('dialog.pz-native-viewport').evaluate(el=>el.matches(':modal')),true,'Expanded card occupies browser top layer');const tabs=await expanded.locator('.pz-page-tabs').boundingBox(),phone=await expanded.locator('a[href^="tel:"]').first().boundingBox();assert.ok(phone&&phone.y>=tabs.y+tabs.height,'Tabs appear above phone');
   await page.screenshot({path:path.join(shots,`expanded-${width}.png`),fullPage:true});await expanded.getByRole('button',{name:/Close /}).click();
  }
  await page.setViewportSize({width:1280,height:1000});await page.emulateMedia({reducedMotion:'no-preference'});await page.addInitScript(()=>localStorage.setItem('pdx-calm-mode','true'));await page.goto(`${server.resolvedUrls.local[0]}__placez-six?id=30&size=tall`,{waitUntil:'networkidle'});assert.equal(await page.locator('.pz-card').getAttribute('data-calm'),'true');assert.equal(await page.locator('.pz-art__moving img').evaluate(el=>getComputedStyle(el).animationName),'none');
  for(const directoryId of [30,3,31,5,2,23])for(const directoryWidth of [390,1280]){
   await checkpoint(`directory:${directoryId}:${directoryWidth}:navigate`);
   await page.setViewportSize({width:directoryWidth,height:1000});
  await page.goto(`${server.resolvedUrls.local[0]}directory?layout=grid&type=ALL&q=${encodeURIComponent(names[directoryId])}`,{waitUntil:'networkidle'});
  const directoryFace=page.locator('.pz-card').filter({has:page.getByRole('button',{name:`View details for ${names[directoryId]}`,exact:true})}).first();await directoryFace.waitFor();
  await directoryFace.getByRole('button',{name:`View details for ${names[directoryId]}`,exact:true}).click();await page.locator('.pz-native-expanded').waitFor();assert.ok(new URL(page.url()).pathname.startsWith(`/directory/${directoryId}`));
  await checkpoint(`directory:${directoryId}:${directoryWidth}:opened`);
  const directoryExpanded=page.locator('.pz-native-expanded');
  await page.waitForFunction(()=>document.querySelector('.pz-native-expanded')?.closest('[data-card-expanded=true]')?.querySelector('[data-card-morph]')?.getAttribute('data-card-morph-phase')==='open');
  await checkpoint(`directory:${directoryId}:${directoryWidth}:phase-open`);
  await page.waitForFunction(()=>!document.getAnimations().some(a=>a.animationName?.includes('view-transition')&&a.playState==='running'));
  await checkpoint(`directory:${directoryId}:${directoryWidth}:animations-settled`);
  await directoryExpanded.evaluate(async el=>{await Promise.race([document.fonts.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Directory fonts exceeded20s')),20000))]);const images=[...el.querySelectorAll('.pz-art img')];for(const img of images)img.loading='eager';await Promise.race([Promise.all(images.map(img=>img.decode())),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Approved artwork decode exceeded20s')),20000))]);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  await checkpoint(`directory:${directoryId}:${directoryWidth}:decoded`);
  for(const selector of (directoryWidth<768?['.pz-close','.pz-share','[role=tab][aria-selected=true]']:['.pz-close','.pz-share']))assert.equal(await directoryExpanded.locator(selector).evaluate(el=>{const b=el.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return !!hit&&(el===hit||el.contains(hit));}),true,`Directory ${directoryId} ${selector} unobscured`);
  assert.equal(await directoryExpanded.locator('.pz-close>span').evaluate(el=>getComputedStyle(el).zIndex),'1','Close glyph paints above opaque ring');
  const artBounds=await directoryExpanded.locator('.pz-art').boundingBox();
  if(directoryWidth>768)assert.ok(artBounds.height>=artBounds.width*.45,'Desktop header retains approved near-2:1 composition');
  await checkpoint(`directory:${directoryId}:${directoryWidth}:screenshot`);
  await page.screenshot({path:path.join(shots,`directory-${directoryId}-viewport-${directoryWidth}.png`)});
  const directoryBounds=await directoryExpanded.boundingBox();assert.ok(directoryBounds.width>200&&directoryBounds.width<=directoryWidth,'Directory uses expanded grid width');assert.ok(directoryBounds.height>=930&&directoryBounds.height<=960,'Directory respects expanded height');const disclosureStyle=await directoryExpanded.locator('summary').first().evaluate(el=>({display:getComputedStyle(el).display,listStyle:getComputedStyle(el).listStyleType}));assert.equal(disclosureStyle.display,'flex');assert.equal(disclosureStyle.listStyle,'none');await page.screenshot({path:path.join(shots,`directory-${directoryId}-expanded-${directoryWidth}.png`),fullPage:true});evidence.push({surface:'actual-directory',id:directoryId,viewport:directoryWidth,expanded:directoryBounds});
  await page.getByRole('button',{name:`Close ${names[directoryId]}`,exact:true}).click();await page.locator('.pz-native-expanded').waitFor({state:'hidden'});assert.equal(new URL(page.url()).pathname,'/directory');
  }
  for(const [width,height] of [[1280,700],[740,390]]){
   await checkpoint(`short:${width}:${height}`);
   await page.setViewportSize({width,height});await page.goto(`${server.resolvedUrls.local[0]}directory?layout=grid&type=ALL&q=Alberta`,{waitUntil:'networkidle'});await page.getByRole('button',{name:'View details for Alberta Rose Theatre',exact:true}).click();
   const expanded=page.locator('.pz-native-expanded');await expanded.waitFor();await page.waitForFunction(()=>{const v=document.querySelector('.pz-native-expanded .pz-page-viewport');return v&&v.getBoundingClientRect().height>=80;});
   const viewport=await expanded.locator('.pz-page-viewport').boundingBox();assert.ok(viewport.height>=80,'Short viewport retains usable independently scrolling details');
   await page.screenshot({path:path.join(shots,`directory-short-${width}x${height}.png`)});
   await expanded.getByRole('button',{name:'Close Alberta Rose Theatre',exact:true}).click();
  }
  await checkpoint('expanded-dismissal-reopen');
  await page.setViewportSize({width:390,height:844});
  await page.goto(`${server.resolvedUrls.local[0]}__placez-six?id=30&size=tall`,{waitUntil:'networkidle'});
  for(const dismissal of ['escape','backdrop']){
   const trigger=page.getByRole('button',{name:'View details for Holocene',exact:true});
   await trigger.click();await page.locator('dialog.pz-native-viewport').waitFor();
   if(dismissal==='escape')await page.keyboard.press('Escape');else await page.mouse.click(1,1);
   await page.locator('dialog.pz-native-viewport').waitFor({state:'hidden'});
   assert.equal(await trigger.evaluate(el=>document.activeElement===el),true,'Dismissal restores source focus');
  }
  await page.setViewportSize({width:680,height:700});
  const reopenedTrigger=page.getByRole('button',{name:'View details for Holocene',exact:true});
  const reopenedBounds=await page.locator('[data-card-category="placez"]').first().boundingBox();
  await reopenedTrigger.click();await page.locator('dialog.pz-native-viewport').waitFor();
  const reopenedOrigin=JSON.parse(await page.locator('dialog.pz-native-viewport').getAttribute('data-placez-source-rect'));
  near(reopenedOrigin.width,reopenedBounds.width,'Reopen refreshes resized source width');
  near(reopenedOrigin.height,reopenedBounds.height,'Reopen refreshes source height');
  await page.getByRole('button',{name:'Close Holocene',exact:true}).click();
  await checkpoint('expanded-guest-auth');
  for(const action of ['heart','claim']){
   await page.setViewportSize({width:390,height:844});
   await page.goto(`${server.resolvedUrls.local[0]}__placez-six?id=23&size=tall`,{waitUntil:'networkidle'});
   await page.getByRole('button',{name:/View details for Pizza/}).click();
   const expanded=page.locator('.pz-native-expanded');await expanded.waitFor();
   if(action==='heart')await expanded.locator('.pz-heart button').click();
   else await expanded.getByRole('button',{name:/claim this business/i}).click();
   await page.getByText('Authentication requested').waitFor();
   await page.locator('dialog.pz-native-viewport').waitFor({state:'hidden'});
   const authInput=page.getByRole('textbox',{name:'Authentication email'});
   assert.equal(await authInput.evaluate(el=>document.activeElement===el),true,'Auth input receives focus after native dialog closes');
   await page.keyboard.type('fixture@example.invalid');
   assert.equal(await authInput.inputValue(),'fixture@example.invalid','Auth input accepts typing');
  }
  await checkpoint('authenticated-follow');
  const authenticated=await browser.newContext({viewport:{width:1280,height:1000},reducedMotion:'reduce',serviceWorkers:'block'});let followed=false;const followMethods=[];
  await authenticated.route('**/api/**',route=>{const request=route.request(),path=new URL(request.url()).pathname;if(path==='/api/directory/30/follow'&&['POST','DELETE'].includes(request.method())){followMethods.push(request.method());followed=request.method()==='POST';return route.fulfill({json:{isFollowing:followed,followerCount:followed?1:0}});}if(!['GET','HEAD'].includes(request.method()))return route.abort();if(path==='/api/auth/me')return route.fulfill({json:{id:900001,username:'placez_fixture',email:'fixture@example.invalid',displayName:'Fixture User',avatarChoice:0,bio:null,photoUrl:null,googleLinked:false,calmMode:false}});return route.fulfill({json:path==='/api/directory/30'?{...mockPlace(30),isFollowing:followed}:path==='/api/directory'?[{...mockPlace(30),isFollowing:followed}]:[]});});
  const authedPage=await authenticated.newPage();await authedPage.goto(`${server.resolvedUrls.local[0]}__placez-six?id=30&size=small`,{waitUntil:'networkidle'});await authedPage.locator('#auth-probe').getByText('authenticated',{exact:true}).waitFor();
  await authedPage.getByRole('button',{name:'Follow directory listing',exact:true}).click();await authedPage.getByRole('button',{name:'Unfollow directory listing',exact:true}).waitFor();await authedPage.getByRole('button',{name:'Unfollow directory listing',exact:true}).click();await authedPage.getByRole('button',{name:'Follow directory listing',exact:true}).waitFor();assert.deepEqual(followMethods,['POST','DELETE']);await authenticated.close();
  assert.deepEqual(writes,[],'No writes from unauthenticated follow');assert.deepEqual(errors,[],'No browser runtime errors');await writeFile(path.join(shots,'metrics.json'),JSON.stringify(evidence,null,2));await context.close();
 }finally{if(page&&!page.isClosed()){await page.screenshot({path:path.join(shots,'last-browser-state.png'),fullPage:true}).catch(()=>{});console.log('PLACEZ_LAST_STATE '+JSON.stringify(await page.evaluate(()=>({dialogs:[...document.querySelectorAll('dialog')].map(el=>({html:el.outerHTML.slice(0,1500),connected:el.isConnected,modal:el.matches(':modal'),display:getComputedStyle(el).display})),active:document.activeElement?.outerHTML.slice(0,300)})).catch(()=>null)));}await checkpoint('cleanup');await browser?.close();await server?.close();await rm(cacheDir,{recursive:true,force:true});}
});

