import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {chromium} from 'playwright';
import sharp from 'sharp';
const root=process.cwd();
test('actual OutZide cards preserve base/overlay geometry and select sized photos at DPR 1/2/3',{timeout:180000},async()=>{
 const cacheDir=await mkdtemp(path.join(tmpdir(),'outz-photo-vite-')),fixture='script/fixtures/outz-photo-sizes-browser.tsx';
 const server=await createServer({configFile:false,root,cacheDir,publicDir:path.join(root,'client/public'),
 optimizeDeps:{entries:[fixture],include:['react/jsx-runtime','react/jsx-dev-runtime']},
 plugins:[react(),{name:'outz-photo-fixture',configureServer(s){s.middlewares.use(async(req,res,next)=>{
  if(!req.url?.startsWith('/__outz-photo-qa'))return next();
  res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml(req.url,`<!doctype html><html data-zaylist-cards="true"><head><style>body{margin:12px!important}#root>div{margin-bottom:20px}#hero,#default-responsive{width:366px}</style></head><body><div id="root"></div><script type="module" src="/${fixture}"></script></body></html>`));
 });}}],resolve:{alias:{'@':path.join(root,'client/src'),'@shared':path.join(root,'shared'),'@assets':path.join(root,'attached_assets')}},
 server:{host:'127.0.0.1',port:0,hmr:false,watch:null},define:{__OUTZIDE_ASSETS__:'{}',__MAPZ_ASSETS__:'{}',__HOME_FLIGHT_BASE__:JSON.stringify('/home-flight')}});
 const buffers=new Map();for(const width of [640,1280,1600])buffers.set(width,await sharp({create:{width,height:width*5/8,channels:3,background:'#376f56'}}).webp().toBuffer());
 let browser;const results=[],evidence=process.env.OUTZ_PHOTO_QA_OUTPUT||'/tmp/zaylist-outz-photo-qa';await mkdir(evidence,{recursive:true});
 try{
  await server.listen();browser=await chromium.launch({headless:true});
  for(const dpr of [1,2,3]){let baseline;
   for(const original of [true,false]){
    const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:dpr,reducedMotion:'reduce',serviceWorkers:'block'});
    // Stationary photo-motion adapter isolates download/geometry from parallax; actual markup/CSS retained.
    await context.addInitScript(()=>{window.__outzPhotoMotion={attachPhoto:()=>()=>{}};});
    await context.route('**/api/**',r=>r.fulfill({status:r.request().url().includes('/auth/me')?401:200,json:[]}));
    await context.route('**/outzide-map/assets/photos/qa-*.webp',r=>{
      const width=/-640\.webp$/.test(r.request().url())?640:/-1280\.webp$/.test(r.request().url())?1280:1600;
      return r.fulfill({contentType:'image/webp',body:buffers.get(width)});
    });
    const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(server.resolvedUrls.local[0]+'__outz-photo-qa'+(original?'?original=1':''),{waitUntil:'networkidle'});
    const record={dpr,original,contexts:{}};
    for(const id of ['small','today-small','today-tall','today-wide','hero','default-responsive']){
      const base=page.locator('#'+id+' .outz-photo__base');await base.scrollIntoViewIfNeeded();
      await base.evaluate(e=>e.decode());await page.locator('#'+id+' .outz-photo__overlay').evaluate(e=>e.decode());
      const state=await page.locator('#'+id).evaluate(el=>{
        const measure=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,currentSrc:e.currentSrc,srcset:e.srcset,sizes:e.sizes,fit:getComputedStyle(e).objectFit,position:getComputedStyle(e).objectPosition};};
        return {base:measure(el.querySelector('.outz-photo__base')),overlay:measure(el.querySelector('.outz-photo__overlay'))};
      });record.contexts[id]=state;
      for(const dim of ['x','y','width','height'])assert.ok(Math.abs(state.base[dim]-state.overlay[dim])<.2,id+' overlay '+dim);
      assert.equal(state.base.fit,'cover');assert.equal(state.base.position,'40% 60%');
      if(!original){
        for(const layer of ['base','overlay'])for(const dim of ['width','height'])assert.ok(Math.abs(state[layer][dim]-baseline.contexts[id][layer][dim])<.2,id+' geometry '+dim);
        const sizes={'small':'136px','today-small':'136px','today-tall':'200px','today-wide':'360px','default-responsive':'(max-width: 800px) 100vw, 800px'};
        if(id==='hero'){assert.equal(state.base.sizes,'');assert.equal(state.overlay.sizes,'');assert.match(state.base.currentSrc,/qa-original.webp$/);}
        else {
          assert.equal(state.base.sizes,sizes[id]);assert.equal(state.overlay.sizes,sizes[id]);
          const width=(id==='today-wide'||id==='default-responsive')&&dpr>1?1280:640;
          assert.match(state.base.currentSrc,new RegExp('-'+width+'\\.webp$'));assert.match(state.overlay.currentSrc,new RegExp('-'+width+'\\.webp$'));
        }
      }
    }
    assert.equal(await page.locator('#unsafe img').count(),0);
    assert.deepEqual(errors,[]);results.push(record);if(original)baseline=record;await context.close();
   }
  }
 }finally{await writeFile(path.join(evidence,'results.json'),JSON.stringify(results,null,2));await browser?.close();await server.close();await rm(cacheDir,{recursive:true,force:true});}
});
