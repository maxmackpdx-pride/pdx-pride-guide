import sharp from 'sharp';
import assert from 'node:assert/strict';import test from 'node:test';import path from 'node:path';import {mkdtemp,rm,readFile,mkdir,writeFile} from 'node:fs/promises';import {tmpdir} from 'node:os';import {createServer} from 'vite';import react from '@vitejs/plugin-react';import {chromium} from 'playwright';
const root=process.cwd();
test('real Home cards and EventModal retain geometry/DPR delivery; failed variants retry original before caller fallback',{timeout:240000},async()=>{
 const cacheDir=await mkdtemp(path.join(tmpdir(),'poster-vite-')),fixture='script/fixtures/responsive-poster-browser.tsx';
 const server=await createServer({configFile:false,root,cacheDir,optimizeDeps:{entries:[fixture],include:['react/jsx-runtime','react/jsx-dev-runtime']},publicDir:path.join(root,'client/public'),plugins:[react(),{name:'poster-fixture',configureServer(s){s.middlewares.use(async(req,res,next)=>{if(!req.url?.startsWith('/__poster-qa'))return next();res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml(req.url,`<!doctype html><html data-zaylist-cards="true"><head><style>body{margin:12px!important}#qa-card,#qa-row{margin-bottom:20px}#qa-open{display:block;color:white}</style></head><body><div id="root"></div><script type="module" src="/${fixture}"></script></body></html>`));});}}],resolve:{alias:{'@':path.join(root,'client/src'),'@shared':path.join(root,'shared'),'@assets':path.join(root,'attached_assets')}},server:{host:'127.0.0.1',port:0,hmr:false,watch:null},define:{__OUTZIDE_ASSETS__:'{}',__MAPZ_ASSETS__:'{}',__HOME_FLIGHT_BASE__:JSON.stringify('/home-flight')}});
 let browser;const results=[],evidence=process.env.POSTER_QA_OUTPUT||'/tmp/zaylist-poster-qa';await mkdir(evidence,{recursive:true});
 try{
  await server.listen();browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const base=server.resolvedUrls.local[0];
  const source='/uploads/new-daily-poster.png';
  const originalBytes=await sharp({create:{width:1500,height:1800,channels:3,background:'#773355'}}).png().toBuffer();
  const contentType='image/png',images={};
  const variants=[];for(const size of [640,1280]){const src=`/api/poster-variants/image/${(size===640?'a':'b').repeat(64)}-${size}.webp`;images[src]=await sharp(originalBytes).resize(size).webp({quality:88}).toBuffer();variants.push({src,width:size});}
  const manifest={[source]:{width:1500,height:1800,variants}};
  const makeContext=async (dpr,seed=true)=>{const c=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:dpr,reducedMotion:'reduce',serviceWorkers:'block'});await c.addInitScript(data=>{performance.setResourceTimingBufferSize(10000);window.__POSTER_MANIFEST__=data;},seed?manifest:null);await c.route('**/api/**',route=>{const pathname=new URL(route.request().url()).pathname;if(images[pathname])return route.fulfill({contentType:'image/webp',body:images[pathname]});if(pathname==='/api/poster-variants')return route.fulfill({json:manifest});return route.request().method()==='GET'?route.fulfill({json:pathname.includes('/auth/me')?null:[]}):route.fulfill({status:403,json:{error:'QA writes blocked'}});});return c;};
  const measure=async(page,selector)=>{const img=page.locator(selector);await img.waitFor();await img.scrollIntoViewIfNeeded();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await img.evaluate(async e=>{if(!e.complete||!e.naturalWidth)await new Promise((resolve,reject)=>{e.addEventListener('load',resolve,{once:true});e.addEventListener('error',reject,{once:true});});await e.decode();});return img.evaluate(e=>{const r=e.getBoundingClientRect();return {width:r.width,height:r.height,currentSrc:e.currentSrc,srcset:e.srcset,sizes:e.sizes,naturalWidth:e.naturalWidth,naturalHeight:e.naturalHeight};});};
  for(const dpr of [1,2,3]){let baseline;for(const original of [true,false]){
   const context=await makeContext(dpr),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await context.route(u=>u.pathname===source,route=>route.fulfill({contentType,body:originalBytes}));
   await page.goto(base+'__poster-qa?source='+encodeURIComponent(source)+(original?'&original=1':''),{waitUntil:'networkidle'});
   const tall=await measure(page,'#qa-card .tonight-card__art img'),wide=await measure(page,'#qa-row .tonight-card__art img');await page.locator('#qa-open').click();const detail=await measure(page,'.event-modal__poster-img');
   await page.waitForLoadState('networkidle');
   // Keep real DPR for delivery/layout checks, but do not rasterize 9x evidence pixels
   // on the software compositor at DPR3. Two-CPU CI otherwise stalls capture >30s.
   const screenshotPath=path.join(evidence,`detail-dpr${dpr}-${original?'original':'responsive'}.png`);
   await page.screenshot({path:screenshotPath,scale:'css',timeout:30000});
   const screenshotBytes=await readFile(screenshotPath),screenshotImage=sharp(screenshotBytes);
   const screenshotInfo=await screenshotImage.metadata(),screenshotStats=await screenshotImage.stats();
   assert.equal(screenshotInfo.format,'png');assert.equal(screenshotInfo.width,390);assert.equal(screenshotInfo.height,844);
   assert.ok(screenshotStats.channels.some(channel=>channel.min<channel.max),'saved screenshot must decode and contain visible content');
   const screenshot={scale:'css',width:screenshotInfo.width,height:screenshotInfo.height,bytes:screenshotBytes.length};
   const transfers=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.initiatorType==='img').map(r=>({url:r.name,encodedBytes:r.encodedBodySize,transferBytes:r.transferSize})));
   const record={dpr,original,source,tall,wide,detail,transfers,errors,screenshot};results.push(record);assert.deepEqual(errors,[]);
   if(original)baseline=record;else{for(const k of ['tall','wide','detail'])for(const d of ['width','height'])assert.ok(Math.abs(record[k][d]-baseline[k][d])<.2,`${k} ${d} changed`);assert.match(tall.currentSrc,/\/api\/poster-variants\/image\/.*-640\.webp$/);assert.match(wide.currentSrc,/\/api\/poster-variants\/image\/.*-640\.webp$/);assert.ok(detail.naturalWidth>0);assert.match(detail.currentSrc,new RegExp(`/api/poster-variants/image/.*-${dpr===1?640:1280}\\.webp$`));}
   await context.close();
  }}
  for(const mode of ['delayed','error','timeout','unknown','offline']){
   const context=await makeContext(1,false);let originals=0;
   await context.route(u=>u.pathname===source,route=>{originals++;return route.fulfill({contentType,body:originalBytes});});
   await context.route(u=>u.pathname==='/api/poster-variants',async route=>{
    await new Promise(resolve=>setTimeout(resolve,mode==='timeout'?2600:400));
    try{await route.fulfill(mode==='error'?{status:503,body:'Unavailable'}:{json:mode==='unknown'?{}:manifest});}catch{/* timeout abort expected */}
   });
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'__poster-qa?source='+encodeURIComponent(source)+(mode==='offline'?'&offline=1':''),{waitUntil:'domcontentloaded'});
   const image=await measure(page,'#qa-card .tonight-card__art img');
   if(mode==='delayed'){assert.equal(originals,0,'cold metadata must not download full original first');assert.match(image.currentSrc,/poster-variants\/image/);}else{assert.ok(originals>0,'failed metadata falls back to original');assert.equal(new URL(image.currentSrc).pathname,source);}
   assert.deepEqual(errors,[]);results.push({cold:true,mode,originals,image,errors});await context.close();
  }
  for(const failOriginal of [false,true]){const context=await makeContext(2);await context.route('**/api/poster-variants/image/**',route=>route.fulfill({status:404,body:'Missing derivative fixture'}));await context.route(u=>u.pathname===source,route=>failOriginal?route.fulfill({status:404,body:'Missing original fixture'}):route.fulfill({contentType,body:originalBytes}));
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'__poster-qa?fallback=1&source='+encodeURIComponent(source),{waitUntil:'networkidle'});const image=page.locator('#qa-fallback img');await image.waitFor();
   if(failOriginal)await page.waitForFunction(()=>document.querySelector('#qa-terminal-errors')?.textContent==='1');else{await image.evaluate(e=>e.decode());assert.equal(await page.locator('#qa-terminal-errors').textContent(),'0');}
   const state=await image.evaluate(e=>{const r=e.getBoundingClientRect();return {srcset:e.srcset,currentSrc:e.currentSrc,width:r.width,height:r.height,naturalWidth:e.naturalWidth,complete:e.complete};});assert.equal(state.srcset,'');assert.equal(new URL(state.currentSrc).pathname,source);assert.equal(state.width,200);assert.equal(state.height,260);assert.equal(state.complete,true);
   if(failOriginal){assert.equal(state.naturalWidth,0);await page.waitForTimeout(100);assert.equal(await page.locator('#qa-terminal-errors').textContent(),'1');}else assert.ok(state.naturalWidth>0);
   assert.deepEqual(errors,[]);results.push({fallback:true,failOriginal,source,...state,errors});await context.close();
  }
 }finally{await writeFile(path.join(evidence,'results.json'),JSON.stringify(results,null,2));await browser?.close();await server.close();await rm(cacheDir,{recursive:true,force:true});}
});
