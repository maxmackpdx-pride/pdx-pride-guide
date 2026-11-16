import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {chromium} from 'playwright';

test('Boardz saves identify the post, toggle state, and do not open details',{timeout:120000},async t=>{
 const root=path.resolve(import.meta.dirname,'..'),fixture='script/fixtures/card-api-browser.tsx';
 const cacheDir=await mkdtemp(path.join(tmpdir(),'board-save-a11y-'));
 const server=await createServer({configFile:false,root,cacheDir,
  publicDir:path.join(root,'client/public'),optimizeDeps:{entries:[fixture]},
  plugins:[react(),{name:'save-test',configureServer(vite){vite.middlewares.use(async(req,res,next)=>{
   if(!req.url?.startsWith('/__save-a11y'))return next();
   res.setHeader('Content-Type','text/html');
   res.end(await vite.transformIndexHtml(req.url,'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module" src="/'+fixture+'"></script>'));
  });}}],
  resolve:{alias:{'@':path.join(root,'client/src'),'@shared':path.join(root,'shared'),'@assets':path.join(root,'attached_assets')}},
  define:{__HOME_FLIGHT_BASE__:JSON.stringify('/home-flight'),__MAPZ_ASSETS__:'{}',__OUTZIDE_ASSETS__:'{}'},
  server:{host:'127.0.0.1',port:0,hmr:false,watch:null}});
 let browser;
 try{
  await server.listen();
  browser=await chromium.launch({headless:true});
  await mkdir('artifacts/mobile-discovery',{recursive:true});
  for(const size of ['small','wide']){
   const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
   await context.route('**/outzide-map/places.json',route=>route.fulfill({json:{places:[]}}));
   await context.route('**/api/**',route=>{
    if(route.request().method()!=='GET')return route.abort('blockedbyclient');
    return route.fulfill({json:new URL(route.request().url()).pathname==='/api/auth/me'?{id:123,username:'qa'}:[]});
   });
   const page=await context.newPage();
   await page.goto(server.resolvedUrls.local[0]+'__save-a11y?family=board&size='+size);
   const heart=page.getByRole('button',{name:'Save QA Gift 1',exact:true});
   await heart.waitFor({state:'visible',timeout:30000});
   assert.equal(await page.getByRole('button',{name:/^Save QA Gift \d+$/}).count(),6);
   await heart.click();
   await page.getByRole('button',{name:'Unsave QA Gift 1',exact:true}).waitFor();
   assert.equal(await page.locator('#qa-saved-count').textContent(),'1');
   assert.equal(await page.locator('.zay-card-expanded:visible').count(),0,'Saving must not open the post');
   await page.screenshot({path:'artifacts/mobile-discovery/board-save-'+size+'.png'});
   await page.getByRole('button',{name:'Unsave QA Gift 1',exact:true}).click();
   await page.getByRole('button',{name:'Save QA Gift 1',exact:true}).waitFor();
   assert.equal(await page.locator('#qa-saved-count').textContent(),'0');
   await context.close();
  }
 }finally{
  await browser?.close();await server.close();await rm(cacheDir,{recursive:true,force:true});
 }
});
