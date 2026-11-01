/** Focused shared SMALL-card visual/action regression.
 * All auth/hearts/directory writes are fulfilled locally; never mutates live data.
 * Real mobile gutter/expansion checks live in card-route-browser.test.mjs.
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
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<=0.1,`${message}: ${a} vs ${b}`);
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
async function settled(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.waitForTimeout(450);}

test('all small card APIs and real Directory share centered heart controls without radar',{timeout:300000},async(t)=>{
 const cacheDir=await mkdtemp(path.join(tmpdir(),'card-small-heart-vite-'));
 t.after(()=>rm(cacheDir,{recursive:true,force:true}));
 const fixture='script/fixtures/card-api-browser.tsx';
 const server=await createServer({configFile:false,root,cacheDir,optimizeDeps:{entries:[fixture,'script/fixtures/card-route-browser.tsx'],include:['react/jsx-runtime','react/jsx-dev-runtime']},publicDir:path.join(root,'client/public'),plugins:[react(),{name:'card-qa-fixture',configureServer(s){s.middlewares.use(async(req,res,next)=>{if(!req.url?.startsWith('/__card-qa')&&!req.url?.startsWith('/__route-qa'))return next();const html=await s.transformIndexHtml(req.url,'<!doctype html><html data-zaylist-cards="true"><head><style>body{margin:24px!important}h1{font:16px sans-serif;margin-bottom:24px}@media(max-width:650px){body{margin:12px!important}#qa-grid{grid-template-columns:repeat(auto-fit,var(--qa-card-width))!important;width:100%!important;gap:16px!important}}</style></head><body><div id="root"></div><script type="module" src="/script/fixtures/card-api-browser.tsx"></script></body></html>');res.setHeader('Content-Type','text/html');res.end(req.url.startsWith('/__route-qa')?html.replace('/script/fixtures/card-api-browser.tsx','/script/fixtures/card-route-browser.tsx'):html);});}}],resolve:{alias:{'@':path.join(root,'client/src'),'@shared':path.join(root,'shared'),'@assets':path.join(root,'attached_assets')}},server:{host:'127.0.0.1',port:0,hmr:false,watch:null},define:{__OUTZIDE_ASSETS__:JSON.stringify({script:'/outzide-map/app.js',maplibre:'/home-flight/vendor/maplibre-gl-5.6.2.js',maplibreCss:'/home-flight/vendor/maplibre-gl-5.6.2.css'}),__MAPZ_ASSETS__:'{}',__HOME_FLIGHT_BASE__:JSON.stringify('/home-flight')}});
 let browser;
 try{
  await server.listen();await server.warmupRequest(`/${fixture}`);const base=server.resolvedUrls.local[0];
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:1280,height:1000},reducedMotion:'reduce'});
  const writes=[];let hearts=[];
  const businesses=Array.from({length:6},(_,i)=>({id:80000+i,name:`QA Place ${i+1}`,type:'bar',description:'Browser regression fixture',neighborhood:'Portland',address:'123 Main Street',events:[],pastEvents:[],gigs:[],queerOwned:true}));
  await context.route('**/api/**',route=>{
   const req=route.request(),p=new URL(req.url()).pathname,method=req.method();
   if(method!=='GET'){
    const body=req.postDataJSON();writes.push({p,method,body});
    if(p==='/api/hearts'){hearts=method==='POST'?[...hearts,body]:hearts.filter(h=>h.kind!==body.kind||h.ref!==body.ref);return route.fulfill({json:{ok:true}});}
    if(/^\/api\/directory\/\d+\/follow$/.test(p))return route.fulfill({json:{isFollowing:method==='POST',followerCount:method==='POST'?1:0}});
    return route.fulfill({status:400,json:{error:'Unexpected write blocked by browser QA'}});
   }
   if(p==='/api/auth/me')return route.fulfill({json:{id:777,username:'qa',email:'qa@example.invalid'}});
   if(p==='/api/hearts')return route.fulfill({json:hearts});
   if(p==='/api/directory')return route.fulfill({json:businesses});
   return route.fulfill({json:[]});
  });
  const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const shots=process.env.CARD_QA_SCREENSHOT_DIR||'/tmp/zaylist-small-heart-qa';await mkdir(shots,{recursive:true});
  let reference,activeReference;
  for(const family of ['outz','place','event','board','needz','directory']){
   if(process.env.CARD_HEART_CASE_FILTER&&!new RegExp(process.env.CARD_HEART_CASE_FILTER).test(family))continue;
   hearts=[];writes.length=0;
   await page.setViewportSize({width:family==='directory'?390:1280,height:1000});
   await page.goto(family==='directory'?`${base}__route-qa/directory`:`${base}__card-qa?family=${family}&size=small`,{waitUntil:'networkidle'});
   const card=page.locator(family==='directory'?'.eb-page [data-card-size="small"]':'#qa-grid [data-card-size="small"]').filter({has:page.locator('[data-card-heart="true"]')}).first();
   await card.waitFor();await card.scrollIntoViewIfNeeded();await settled(page);
   if(family!=='directory')await geometryReady(page);
   const heart=card.locator('[data-card-heart="true"]').first();await heart.waitFor();
   const measure=await heart.evaluate(el=>{
    const card=el.closest('[data-card-size]'),svg=el.querySelector('svg'),b=el.getBoundingClientRect(),c=card.getBoundingClientRect(),s=svg.getBoundingClientRect(),css=getComputedStyle(el);
    const overlap=other=>{const r=other.getBoundingClientRect();return Math.min(b.right,r.right)-Math.max(b.left,r.left)>1&&Math.min(b.bottom,r.bottom)-Math.max(b.top,r.top)>1;};
    return {faceWidth:c.width,faceHeight:c.height,width:b.width,height:b.height,iconWidth:s.width,iconHeight:s.height,centerX:s.x+s.width/2-b.x-b.width/2,centerY:s.y+s.height/2-b.y-b.height/2,top:b.top-c.top,right:c.right-b.right,border:css.border,color:css.color,background:css.backgroundColor,radius:css.borderRadius,stroke:getComputedStyle(svg).stroke,strokeWidth:getComputedStyle(svg).strokeWidth,strokeLinecap:getComputedStyle(svg).strokeLinecap,strokeLinejoin:getComputedStyle(svg).strokeLinejoin,glyph:svg.innerHTML,overlaps:[...card.querySelectorAll('h3,.pdxPlace__name,.zine-title,.outz-small__title,.event-rail-card__title,[aria-label*="Share"],[aria-label*="share"],[class*="waypoint"]')].filter(other=>!el.contains(other)&&overlap(other)).map(other=>({class:other.className,text:other.textContent}))};
   });
   await page.screenshot({path:path.join(shots,`${family}-small-closed.png`),fullPage:false});
   console.log('HEART',family,JSON.stringify(measure));
   near(measure.faceWidth,136,`${family} small width`);near(measure.faceHeight,170,`${family} small height`);near(measure.width,40,`${family} heart width`);near(measure.height,40,`${family} heart height`);near(measure.iconWidth,18,`${family} glyph width`);near(measure.iconHeight,18,`${family} glyph height`);near(measure.centerX,0,`${family} centered x`);near(measure.centerY,0,`${family} centered y`);
   if(reference){for(const k of ['top','right'])near(measure[k],reference[k],`${family} shared ${k} inset`);for(const k of ['border','color','background','radius','stroke','strokeWidth','strokeLinecap','strokeLinejoin','glyph'])assert.equal(measure[k],reference[k],`${family} same ${k}`);}else reference=measure;
   assert.deepEqual(measure.overlaps,[],`${family} heart must not overlap titles/share/waypoint`);
   if(family==='place'||family==='directory')assert.equal(await card.locator('[class*="radar"],.xr-radar,.pdxPlace__radar').count(),0,'Placez has no radar nodes');
   const countBefore=family==='event'||family==='board'?await page.locator('#qa-saved-count').textContent():null;
   await heart.click();await settled(page);
   assert.equal(await page.locator('.zay-card-expanded:visible').count(),0,`${family} heart does not open details`);
   if(countBefore!==null)assert.equal(await page.locator('#qa-saved-count').textContent(),'1',`${family} original save callback`);
   else {assert.equal(writes.length,1,`${family} one original endpoint write`);assert.equal(writes[0].method,'POST');assert.equal(writes[0].p,family==='place'||family==='directory'?'/api/directory/80000/follow':'/api/hearts');if(family==='outz'||family==='needz')assert.equal(writes[0].body.kind,family==='outz'?'outz':'resource');}
   assert.equal(await heart.getAttribute('aria-pressed'),'true',`${family} saved visual state`);
   const activeAppearance=await heart.evaluate(el=>({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color,fill:getComputedStyle(el.querySelector('svg')).fill}));if(activeReference)assert.deepEqual(activeAppearance,activeReference,`${family} same selected appearance`);else activeReference=activeAppearance;
   await heart.focus();await page.keyboard.press('Enter');await settled(page);
   assert.equal(await page.locator('.zay-card-expanded:visible').count(),0,`${family} keyboard heart does not open details`);
   if(countBefore!==null)assert.equal(await page.locator('#qa-saved-count').textContent(),'0',`${family} keyboard original callback`);else {assert.equal(writes.length,2);assert.equal(writes[1].method,'DELETE');}
   assert.equal(await heart.getAttribute('aria-pressed'),'false',`${family} unselected visual state`);
   if(family==='board'){await card.locator('.punk-open-target').click();await page.locator('.zay-card-expanded').waitFor();await page.locator('.zay-card-expanded button[aria-label*="Close"]').first().click();await page.locator('.zay-card-expanded').waitFor({state:'detached'});}
   console.log(`PASS ${family}: shared small heart geometry/glyph, no collision/radar, pointer+keyboard native semantics`);
  }
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await server.close();}
});
