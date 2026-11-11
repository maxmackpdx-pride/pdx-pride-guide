import assert from 'node:assert/strict';
import {test} from 'node:test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir,mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const near=(a,b,label)=>assert.ok(Math.abs(a-b)<1.1,`${label}: ${a} vs ${b}`);
const names={30:'Holocene',3:'Stag PDX',31:'Alberta Rose Theatre',5:'Eagle Portland',2:'Darcelle XV Showplace',23:'Pizza Thief'};
const place=id=>({id,name:names[id],type:id===23?'restaurant':id===3||id===5?'bar':'venue',active:true,status:'OPEN',address:'Public fixture address',description:'Isolated browser fixture',neighborhood:'Portland',lat:45.52,lng:-122.67,locations:[{label:'Primary',address:'Public fixture address',lat:45.52,lng:-122.67}],isFollowing:false,upcomingEvents:[],pastEvents:[],gigs:[],spotted:[],promoters:[]});
test('immutable map release uses shared read-only PlaceZ portals at phone and desktop sizes',{timeout:600000},async(t)=>{
 const pin=JSON.parse(await readFile(path.join(root,'shared/mapReleaseLock.json'),'utf8'));
 const match=/^v(\d+)\.(\d+)\.(\d+)$/.exec(pin.tag||'');assert.ok(match,'Pinned map tag must be a stable semantic version');
 const [major,minor,patch]=match.slice(1).map(Number);
 if(major===1&&minor===0&&patch===20){t.skip('v1.0.20 predates the optional PlaceZ renderer; integrated gate begins at v1.0.21');return;}
 assert.ok(major>1||(major===1&&(minor>0||patch>=21)),'PlaceZ integration requires map release >=1.0.21');
 assert.match(pin.base,/^\/map-assets\/v\d+\.\d+\.\d+\/$/);assert.equal(pin.base,`/map-assets/${pin.tag}/`);
 const safeAsset=value=>typeof value==='string'&&value.length>0&&!value.startsWith('/')&&!value.split('/').includes('..');
 assert.ok(safeAsset(pin.entry),'Safe pinned entry required');assert.ok(Array.isArray(pin.styles)&&pin.styles.length&&pin.styles.every(safeAsset),'Pinned stylesheet paths required');
 const [{createServer},{default:react},{chromium}]=await Promise.all([import('vite'),import('@vitejs/plugin-react'),import('playwright')]);
 const cacheDir=await mkdtemp(path.join(tmpdir(),'placez-map-'));
 const release=path.resolve(process.env.PLACEZ_MAP_RELEASE_DIR||path.join(root,'client/public',pin.base.slice(1)));
 const shots=path.resolve(process.env.PLACEZ_MAP_QA_DIR||path.join(root,'artifacts/placez-six-map'));
 const css=pin.styles;await Promise.all([pin.entry,...css].map(file=>readFile(path.join(release,file))));
 assert.ok(css.length,'Pinned release CSS is required');await mkdir(shots,{recursive:true});
 let server,browser;const evidence=[],errors=[],writes=[];
 try{
  server=await createServer({configFile:false,root,cacheDir,publicDir:path.join(root,'client/public'),plugins:[react(),{name:'map-placez-fixture',configureServer(s){s.middlewares.use(async(req,res,next)=>{
   const url=new URL(req.url||'/', 'http://fixture');
   if(url.pathname.startsWith(pin.base)){const rel=url.pathname.slice(pin.base.length);if(rel.includes('..')){res.statusCode=400;res.end();return;}try{const data=await readFile(path.join(release,rel));res.setHeader('Content-Type',rel.endsWith('.css')?'text/css':/\.(js|cjs)$/.test(rel)?'application/javascript':rel.endsWith('.svg')?'image/svg+xml':'application/octet-stream');res.end(data);}catch{res.statusCode=404;res.end();}return;}
   if(url.pathname!=='/map')return next();res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml(req.url,`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">${css.map(n=>`<link rel="stylesheet" href="${pin.base}${n}">`).join('')}<style>body{margin:0}#reopen-map-place{position:fixed;z-index:90;top:0;left:0}#map-fixture-error{position:fixed;z-index:200;color:red}</style></head><body><div id="root"></div><script type="module" src="/script/fixtures/placez-six-map-browser.tsx"></script></body></html>`));
  });}}],resolve:{alias:{'@':path.join(root,'client/src'),'@shared':path.join(root,'shared'),'@assets':path.join(root,'attached_assets')}},server:{host:'127.0.0.1',port:0,hmr:false,watch:null},define:{__OUTZIDE_ASSETS__:'{}',__MAPZ_ASSETS__:'{}',__HOME_FLIGHT_BASE__:JSON.stringify('/home-flight')}});
  await server.listen();browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await context.route('**/*',route=>{const req=route.request(),url=new URL(req.url());if(!['GET','HEAD'].includes(req.method())){writes.push(req.method()+' '+url.pathname);return route.abort();}
   if(url.pathname.startsWith('/api/')){const p=url.pathname;return route.fulfill(p==='/api/auth/me'?{status:401,json:{}}:{json:p==='/api/directory'?Object.keys(names).map(Number).map(place):/^\/api\/directory\/\d+$/.test(p)?place(Number(p.split('/').pop())):p==='/api/outz/closures'?{statuses:[]}:p==='/api/nude-beaches'?{data:{}}:p.includes('/housing')?{posts:[]}:p.includes('/maps/v1/social/')?{profiles:[],gatherings:[],venues:[]}:[]});}
   if(url.pathname.startsWith('/outzide-map/'))return route.fulfill({json:url.pathname.endsWith('places.json')?{places:[]}:{}});
   if(!['127.0.0.1','localhost'].includes(url.hostname))return route.abort();return route.continue();
  });
  const page=await context.newPage();page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{localStorage.setItem('pdx-calm-mode',String(new URLSearchParams(location.search).get('calm')==='1'));});
  const open=async(id,width,mode)=>{await page.setViewportSize({width,height:844});await page.emulateMedia({reducedMotion:mode==='reduced'?'reduce':'no-preference'});await page.goto(`${server.resolvedUrls.local[0]}map?id=${id}&item=venue-${id}&mode=mapz&fallback=1&calm=${mode==='calm'?'1':'0'}`,{waitUntil:'networkidle'});await page.locator('.host-placez-card .pz-card--wide-map').waitFor();assert.equal(await page.locator('#map-fixture-error').textContent(),'');};
  for(const width of [320,390,1280])for(const mode of ['normal','reduced','calm']){
   await open(30,width,mode);const closed=page.locator('.host-placez-card .pz-card--wide-map');const before=await closed.boundingBox();assert.ok(before.x>=0&&before.x+before.width<=width+1,'Wide face fits viewport');
   const follow=closed.locator('.pz-heart button');assert.equal(await follow.isDisabled(),true);const heartBox=await follow.boundingBox();near(heartBox.width,44,'Follow touch target');
   const dismissBox=await page.locator('.mapz-map-close').boundingBox();assert.ok(dismissBox,'Closed map dismiss control is visible');
   assert.ok(dismissBox.x+dismissBox.width<=heartBox.x||heartBox.x+heartBox.width<=dismissBox.x||dismissBox.y+dismissBox.height<=heartBox.y||heartBox.y+heartBox.height<=dismissBox.y,'Map dismiss and heart touch targets must not overlap');
   await page.locator('.mapz-map-object').evaluate(el=>{window.__mapPlacezTransitions=[];el.addEventListener('transitionrun',event=>window.__mapPlacezTransitions.push(event.propertyName));});await closed.getByRole('button',{name:'View details for Holocene',exact:true}).click();const expanded=page.locator('.host-placez-card .pz-card--expanded');await expanded.waitFor();await page.waitForTimeout(350);const bounds=await expanded.boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width+1,'Expanded fits viewport');
   if(mode==='normal')assert.ok((await page.evaluate(()=>window.__mapPlacezTransitions)).includes('height'),'Persistent object visibly transitions height');
   assert.equal(await expanded.getByRole('tab',{name:'Info',exact:true}).getAttribute('aria-selected'),'true');assert.equal(await page.locator('.mapz-map-details').evaluate(el=>getComputedStyle(el).overflow),'visible','Outer wrapper preserves outward glow');assert.notEqual(await expanded.evaluate(el=>getComputedStyle(el).boxShadow),'none','Approved static glow is present');
   await expanded.getByRole('tab',{name:'Maps',exact:true}).click();await expanded.locator('.placez-map-tools').waitFor();await expanded.locator('.getting-there-card').waitFor();assert.ok(await expanded.getByRole('button',{name:'Show on map',exact:true}).count());
   await page.screenshot({path:path.join(shots,`${width}-${mode}-maps.png`),fullPage:true});
   await expanded.getByRole('button',{name:'Close Holocene',exact:true}).focus();await page.keyboard.press('Enter');await closed.waitFor();await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='View details for Holocene');await page.waitForTimeout(350);const after=await closed.boundingBox();near(after.width,before.width,'Reverse width');near(after.height,before.height,'Reverse height');assert.equal(new URL(page.url()).searchParams.get('item'),'venue-30');
   await closed.getByRole('button',{name:'View details for Holocene',exact:true}).click();await expanded.waitFor();await page.keyboard.press('Escape');await page.locator('.mapz-map-dialog').waitFor({state:'hidden'});assert.equal(new URL(page.url()).searchParams.get('item'),null);
   await page.locator('#reopen-map-place').click();await closed.waitFor();assert.equal(new URL(page.url()).searchParams.get('item'),'venue-30');
   if(mode!=='normal')assert.equal(await page.locator('.mapz-map-object').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
   if(mode==='normal'){await page.evaluate(()=>document.documentElement.classList.add('calm-mode'));assert.equal(await page.locator('.mapz-map-object').evaluate(el=>getComputedStyle(el).transitionDuration),'0s','Same-tab Calm class disables map transitions');await page.evaluate(()=>document.documentElement.classList.remove('calm-mode'));}
   evidence.push({width,mode,closed:before,expanded:bounds,readOnly:true,mapsTools:true});
  }
  for(const id of Object.keys(names).map(Number)){await open(id,390,'reduced');assert.equal(await page.locator('.host-placez-card .pz-card').getAttribute('aria-label'),names[id]);}
  assert.deepEqual(writes,[],'Map presentation sent no mutation');assert.deepEqual(errors,[],'No runtime errors');await writeFile(path.join(shots,'metrics.json'),JSON.stringify(evidence,null,2));await context.close();
 }finally{await browser?.close();await server?.close();await rm(cacheDir,{recursive:true,force:true});}
});
