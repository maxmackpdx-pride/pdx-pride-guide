/** node --test script/placez-artwork-browser.test.mjs
 * Local Vite + production components/styles; real checked-in recipe assets, no image mocks.
 * External Foundation GETs are allowed. Every write is blocked. Asset outages fail explicitly.
 * Chromium desktop/mobile-emulation evidence is not physical Safari/device validation.
 */
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
const vectors=page=>page.locator('.rg-card-motif').evaluate(svg=>Object.fromEntries(['support','front'].map(depth=>{
 const css=getComputedStyle(svg.querySelector(`[data-motif-depth="${depth}"]`));
 return [depth,{translate:css.translate,animation:css.animationName,xy:css.translate.split(/\s+/).map(Number.parseFloat)}];
})));

async function artworkReady(page){
 await page.locator('.rg-card-motif[data-card-motif] [data-motif-depth="front"] [data-library-motif]').waitFor();
 await page.waitForFunction(()=>document.fonts.status==='loaded' && [...document.querySelectorAll('#qa-card, #qa-card *')].every(node=>node.getAnimations().every(a=>!Number.isFinite(a.effect?.getComputedTiming().endTime)||['finished','idle'].includes(a.playState))));
 // SVG <image> has no HTMLImageElement.complete. Decode the SAME URLs, with the
 // SAME anonymous CORS mode, so missing/blocked images cannot produce a false pass.
 return page.locator('#qa-card').evaluate(async card=>{
  const urls=[...new Set([...card.querySelectorAll('.rg-motif-slot image,.rg-motif-slot feImage')].map(el=>el.getAttribute('href')).filter(Boolean))];
  if(urls.length<5)throw Error(`Expected hero, companion and three network URLs; got ${urls.length}`);
  await Promise.all(urls.map(url=>new Promise((resolve,reject)=>{
   const img=new Image();img.crossOrigin='anonymous';
   const timer=setTimeout(()=>reject(Error(`Artwork timed out: ${url}`)),20000);
   img.onload=()=>{clearTimeout(timer);img.naturalWidth>0?resolve():reject(Error(`Empty artwork: ${url}`));};
   img.onerror=()=>{clearTimeout(timer);reject(Error(`Artwork unavailable/CORS blocked: ${url}`));};img.src=url;
  })));
  await Promise.all([...card.querySelectorAll('img')].map(img=>img.decode()));
  return urls;
 });
}

test('Places preserve clear artwork and opposite-depth parallax across sizes and motion settings',{timeout:600000},async()=>{
 const cacheDir=await mkdtemp(path.join(tmpdir(),'placez-artwork-vite-'));
 const fixture='script/fixtures/placez-artwork-browser.tsx';
 const shots=process.env.PLACEZ_QA_SCREENSHOT_DIR;
 if(shots)await mkdir(shots,{recursive:true});
 let server,browser;
 const evidence=[];
 try{
  server=await createServer({configFile:false,root,cacheDir,publicDir:path.join(root,'client/public'),
   optimizeDeps:{entries:[fixture],include:['react/jsx-runtime','react/jsx-dev-runtime']},
   plugins:[react(),{name:'placez-artwork-fixture',configureServer(s){s.middlewares.use(async(req,res,next)=>{
    if(!req.url?.startsWith('/__placez-artwork'))return next();
    res.setHeader('Content-Type','text/html');
    res.end(await s.transformIndexHtml(req.url,`<!doctype html><html data-zaylist-cards="true"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:12px!important}h1{font:16px sans-serif;margin:0 0 24px}#qa-card{position:relative;max-width:100%}</style></head><body><div id="root"></div><script type="module" src="/${fixture}"></script></body></html>`));
   });}}],resolve:{alias:{'@':path.join(root,'client/src'),'@shared':path.join(root,'shared'),'@assets':path.join(root,'attached_assets')}},
   server:{host:'127.0.0.1',port:0,hmr:false,watch:null},
   define:{__OUTZIDE_ASSETS__:JSON.stringify({script:'/outzide-map/app.js',maplibre:'/home-flight/vendor/maplibre-gl-5.6.2.js',maplibreCss:'/home-flight/vendor/maplibre-gl-5.6.2.css'}),__MAPZ_ASSETS__:'{}',__HOME_FLIGHT_BASE__:JSON.stringify('/home-flight')}});
  await server.listen();await server.warmupRequest(`/${fixture}`);
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined});
  for(const device of ['desktop','mobile'])for(const mode of ['normal','reduced','calm']){
   const context=await browser.newContext({viewport:device==='mobile'?{width:390,height:844}:{width:1280,height:1000},isMobile:device==='mobile',hasTouch:device==='mobile',deviceScaleFactor:1,reducedMotion:mode==='reduced'?'reduce':'no-preference',serviceWorkers:'block'});
   try{
    await context.addInitScript(calm=>localStorage.setItem('pdx-calm-mode',String(calm)),mode==='calm');
    const writes=[];
    await context.route('**/*',route=>{
     const request=route.request(),url=new URL(request.url());
     if(!['GET','HEAD'].includes(request.method())){writes.push(`${request.method()} ${url.pathname}`);return route.abort('blockedbyclient');}
     if(url.origin===new URL(server.resolvedUrls.local[0]).origin && url.pathname.startsWith('/api/'))return route.fulfill(url.pathname==='/api/auth/me'?{status:401,json:{}}:{json:[]});
     // Hold the production hook on its checked-in snapshot; never replace artwork.
     if(url.pathname==='/api/design/v1/motif-recipes')return route.abort('blockedbyclient');
     return route.continue();
    });
    const page=await context.newPage();page.setDefaultTimeout(30000);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    for(const [family,size] of [['public','wide'],['public','tall'],['public','small'],['directory',device==='mobile'?'small':'tall']]){
     const label=`${device}-${mode}-${family}-${size}`;
     try{
     await page.goto(`${server.resolvedUrls.local[0]}__placez-artwork?family=${family}&size=${size}`,{waitUntil:'domcontentloaded'});
     const urls=await artworkReady(page);
     if(shots)await page.screenshot({path:path.join(shots,`${label}-loaded.png`),fullPage:true,animations:'allow'});
     const card=page.locator('#qa-card [data-card-size]').first();
     const dimensions=await card.evaluate(el=>({width:el.offsetWidth,height:el.offsetHeight}));
     const expected=size==='wide'?[360,216]:size==='small'?[136,170]:[200,403];
     near(dimensions.width,expected[0],`${label} width`);near(dimensions.height,expected[1],`${label} height`);
     assert.equal(await page.locator('#qa-card .card-artwork-glass,#qa-card .xr-grain').count(),0,`${label}: no film or grain`);
     const overlays=await card.evaluate(el=>[el,...el.querySelectorAll('*')].flatMap(node=>['::before','::after'].map(p=>getComputedStyle(node,p).backgroundImage)));
     assert.ok(overlays.every(image=>!image.includes('torn-card-scan')),`${label}: no torn-card overlay`);
     assert.equal(await page.locator('.rg-card-motif[data-motif^="place-"][aria-hidden="true"]').count(),1);
     for(const depth of ['support','front'])assert.equal(await page.locator(`.rg-card-motif [data-motif-depth="${depth}"] [data-library-motif]`).count(),1);
     assert.equal(await page.locator('.card-network__plane').count(),3,`${label}: three network layers`);
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${label}: no document horizontal overflow`);
     const box=await card.boundingBox();assert.ok(box);
     // Real pointer events drive the production springs; never set CSS variables.
     await page.mouse.move(box.x+box.width*.2,box.y+box.height*.35);
     await page.waitForTimeout(700);const before=await vectors(page);
     await page.mouse.move(box.x+box.width*.8,box.y+box.height*.75);
     if(mode==='normal'){
      await page.waitForFunction(()=>{
       const svg=document.querySelector('.rg-card-motif');
       return Math.abs(parseFloat(svg.style.getPropertyValue('--rg-parallax-x')))>1;
      });
      await page.waitForTimeout(700);
      const after=await vectors(page);
      assert.ok(Math.abs(after.support.xy[0]-before.support.xy[0])>.5,`${label}: genuine support movement`);
      assert.ok(Math.abs(after.front.xy[0]-before.front.xy[0])>.5,`${label}: genuine front movement`);
      assert.ok(Math.abs(after.support.xy[1]-before.support.xy[1])>.5,`${label}: genuine support Y movement`);
      assert.ok(Math.abs(after.front.xy[1]-before.front.xy[1])>.5,`${label}: genuine front Y movement`);
      assert.ok(after.support.xy[0]*after.front.xy[0]<0,`${label}: opposing X vectors`);
      assert.ok(after.support.xy[1]*after.front.xy[1]<0,`${label}: opposing Y vectors`);
     }else{
      const motion=await vectors(page);
      for(const depth of ['support','front']){assert.equal(motion[depth].translate,'none',`${label}: ${depth} translation off`);assert.equal(motion[depth].animation,'none',`${label}: ${depth} animation off`);}
      const network=await page.locator('.card-network__plane').evaluateAll(nodes=>nodes.map(el=>({translate:getComputedStyle(el).translate,animation:getComputedStyle(el).animationName})));
      network.forEach(p=>{assert.equal(p.translate,'none');assert.equal(p.animation,'none');});
     }
     // Capture actual motion, without Playwright disabling animations or CSS overrides.
     if(shots)await page.screenshot({path:path.join(shots,`${label}.png`),fullPage:true,animations:'allow'});
     evidence.push({label,dimensions,artwork:urls,motion:await vectors(page)});
     assert.deepEqual(errors,[],`${label}: no uncaught errors`);
     assert.deepEqual(writes,[],`${label}: no attempted writes`);
     console.log(`PASS ${label}: clear artwork, dimensions, layers, motion, overflow`);
     }catch(error){
      evidence.push({label,error:String(error)});
      if(shots)await page.screenshot({path:path.join(shots,`${label}-FAILED.png`),fullPage:true,animations:'allow',timeout:10000}).catch(()=>{});
      throw error;
     }
    }
   }finally{await context.close();}
  }
 }finally{
  if(shots)await writeFile(path.join(shots,'evidence.json'),JSON.stringify(evidence,null,2));
  await browser?.close();await server?.close();await rm(cacheDir,{recursive:true,force:true});
 }
});
