/** Real Eventz/Needz/Boardz/Placez whole-page interaction profiler.
 * Vite production-optimized isolated route fixture + React 19 profiling build,
 * with strictly scoped Compiler off/on. Synthetic read-only API responses.
 * These measurements exclude live network, device, hydration and production
 * Railway behavior. Never treat Profiler actualDuration as wall clock latency.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {build,preview} from 'vite';
import react,{reactCompilerPreset} from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import {chromium} from 'playwright';
import {cardSourcePatterns,cardCompilerExcludedPatterns} from './react-compiler-card-scope.mjs';

const root=path.resolve(import.meta.dirname,'..');
const html='script/fixtures/production-page-profiler.html';
const kinds=['events','resources','boards','directory'];
const events=Array.from({length:8},(_,i)=>({
 id:300+i,title:'QA Event '+(i+1),description:'Synthetic event for Compiler route profiling',
 venueName:'QA Venue '+(i+1),address:'123 Fictional Street',neighborhood:'Portland',
 dateStart:'2099-07-'+String(15+i).padStart(2,'0')+'T20:00:00',
 dateEnd:'2099-07-'+String(15+i).padStart(2,'0')+'T23:00:00',
 dayOfWeek:['WED','THU','FRI','SAT','SUN','MON','TUE','WED'][i],
 eventType:'NIGHTLIFE',admission:'FREE',ageRequirement:'21_PLUS',
 posterUrl:null,imageUrl:null,ticketUrl:null,website:null,lat:null,lng:null,status:'PUBLISHED',isFeatured:false,
}));
const gifts=Array.from({length:8},(_,i)=>({
 id:i+1,userId:1,postType:'GIFT',title:'QA Gift '+(i+1),description:'Useful gift',
 category:'Other',neighborhood:'Portland',pickupPreference:'Pickup',photoUrls:[],
 status:'OPEN',createdAt:'2026-11-01T00:00:00Z',expiresAt:'2027-01-01T00:00:00Z',
 username:'qa',interestCount:0,
}));
const businesses=Array.from({length:8},(_,i)=>({
 id:100+i,name:'QA Cafe '+(i+1),type:'cafe',description:'A welcoming local cafe',
 address:'123 Main St',neighborhood:'Portland',website:null,instagram:null,donateUrl:null,
 hours:null,phone:null,queerOwned:true,queerFriendly:true,imageUrl:null,
 lat:null,lng:null,isNew:false,
}));
businesses.push(...Array.from({length:4},(_,i)=>({...businesses[i],id:200+i,name:'QA Tavern '+(i+1),type:'bar'})));

async function productionFixture(compiled,t){
 const outDir=await mkdtemp(path.join(tmpdir(),compiled?'zay-page-infer-':'zay-page-off-'));
 t.after(()=>rm(outDir,{recursive:true,force:true}));
 const config={
  configFile:false,root,publicDir:path.join(root,'client/public'),logLevel:'error',
  plugins:[react(),...(compiled?[babel({presets:[reactCompilerPreset({compilationMode:'infer'})],include:cardSourcePatterns,exclude:cardCompilerExcludedPatterns})]:[])],
  resolve:{alias:[
   {find:'react-dom/client',replacement:'react-dom/profiling'},
   {find:'@shared',replacement:path.join(root,'shared')},
   {find:'@assets',replacement:path.join(root,'attached_assets')},
   {find:'@',replacement:path.join(root,'client/src')},
  ]},
  define:{
   __OUTZIDE_ASSETS__:JSON.stringify({script:'/outzide-map/app.js',maplibre:'/home-flight/vendor/maplibre-gl-5.6.2.js',maplibreCss:'/home-flight/vendor/maplibre-gl-5.6.2.css'}),
   __MAPZ_ASSETS__:'{}',__HOME_FLIGHT_BASE__:JSON.stringify('/home-flight'),
  },
  build:{target:['chrome107','edge107','firefox104','safari16','ios16'],outDir,emptyOutDir:true,rollupOptions:{input:path.join(root,html)}},
 };
 await build(config);
 const server=await preview({...config,preview:{host:'127.0.0.1',port:0,strictPort:false}});
 t.after(()=>new Promise(resolve=>server.httpServer.close(resolve)));
 const address=server.httpServer.address();
 assert.ok(address&&typeof address!=='string','Optimized profile preview must bind TCP port');
 return 'http://127.0.0.1:'+address.port+'/'+html;
}
async function measure(browser,url,mode,kind,round){
 const context=await browser.newContext({viewport:{width:1280,height:1000},reducedMotion:'reduce'});
 try{
  await context.addInitScript(()=>{localStorage.setItem('pdx-calm-mode','true');Math.random=()=>0.1;});
  await context.route('**/outzide-map/places.json*',route=>route.fulfill({json:{places:[]}}));
  await context.route('**/api/**',route=>{
   const request=route.request(),p=new URL(request.url()).pathname;
   if(request.method()!=='GET')return route.abort('blockedbyclient');
   if(p==='/api/auth/me')return route.fulfill({status:401,json:{}});
   if(p==='/api/events')return route.fulfill({json:events});
   if(/^\/api\/events\/\d+$/.test(p)){const e=events.find(item=>item.id===Number(p.split('/').pop()));return route.fulfill({status:e?200:404,json:e??{error:'Not found'}});}
   if(p==='/api/directory')return route.fulfill({json:businesses});
   if(/^\/api\/directory\/\d+$/.test(p)){const b=businesses.find(item=>item.id===Number(p.split('/').pop()));return route.fulfill({status:b?200:404,json:b?{...b,description:'Fresh detail for '+b.name}:{error:'Not found'}});}
   if(p==='/api/housing')return route.fulfill({json:{posts:[]}});
   if(p.startsWith('/api/gifting'))return route.fulfill({json:p==='/api/gifting'?gifts:gifts[0]});
   return route.fulfill({json:[]});
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  const params=kind==='events'?'&window=ALL':kind==='directory'?'&type=ALL&layout=grid':'&layout=grid';
  await page.goto(url+'?qaRoute='+kind+params,{waitUntil:'networkidle'});
  const settle=async()=>{await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.waitForTimeout(450);};
  await settle();
  const selector=kind==='events'?'.events-poster-grid [data-card-category="eventz"]':kind==='resources'?'.rd-card[data-card-category="needz"]':kind==='boards'?'.boardz-production-card':'.eb-grid .rd-card[data-card-category="placez"]';
  const card=page.locator(selector).first();
  await card.waitFor({state:'visible',timeout:30000});
  await card.scrollIntoViewIfNeeded();await settle();
  const texts=async()=>page.locator(selector).allTextContents().then(items=>items.map(item=>item.replace(/\s+/g,' ').trim()));
  const before=await texts();
  assert.ok(before.length>=1,mode+'/'+kind+'/'+round+': no real production cards');
  const fingerprint=createHash('sha256').update(JSON.stringify(before)).digest('hex').slice(0,16);
  await page.evaluate(()=>{window.__zayWholePageProfiler=[];window.__zayWholePageProfilerEnabled=true;});
  if(kind==='events')await card.locator('.tonight-card__open').click();
  else if(kind==='boards')await card.locator('.punk-open-target').click();
  else await card.click({position:{x:kind==='resources'?80:60,y:kind==='resources'?90:75}});
  const detail=page.locator(kind==='events'?'[data-testid="event-modal"]':'.zay-card-expanded');
  await detail.waitFor({state:'visible',timeout:20000});await settle();
  await page.keyboard.press('Escape');
  await detail.waitFor({state:'hidden',timeout:20000});await settle();
  const samples=await page.evaluate(()=>{window.__zayWholePageProfilerEnabled=false;return window.__zayWholePageProfiler||[];});
  assert.deepEqual(await texts(),before,mode+'/'+kind+': card text changed on open/close');
  assert.deepEqual(errors,[],mode+'/'+kind+': browser errors');
  assert.ok(samples.length>=2,mode+'/'+kind+': missing open/close Profiler commits');
  assert.ok(samples.every(s=>s.phase!=='mount'&&Number.isFinite(s.actualDurationMs)&&s.actualDurationMs>=0&&Number.isFinite(s.baseDurationMs)&&s.baseDurationMs>=0),mode+'/'+kind+': invalid Profiler updates');
  return {mode,kind,round,cards:before.length,commits:samples.length,fingerprint,
   actualDurationMs:Number(samples.reduce((sum,item)=>sum+item.actualDurationMs,0).toFixed(3))};
 }finally{await context.close();}
}

test('production-optimized real Eventz, Resources, Boardz and Placez routes preserve content and report four order-balanced Profiler trials',{timeout:1200000},async t=>{
 // Do not parallelize the two large Vite production builds.
 const offUrl=await productionFixture(false,t);
 const inferUrl=await productionFixture(true,t);
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const records=[],comparisons=[];
  for(let round=1;round<=4;round++){
   const modes=round%2?['off','card-infer']:['card-infer','off'];
   for(const mode of modes)for(const kind of kinds){
    const item=await measure(browser,mode==='off'?offUrl:inferUrl,mode,kind,round);
    records.push(item);console.log('REACT_PRODUCTION_WHOLE_PAGE_SAMPLE '+JSON.stringify(item));
   }
  }
  for(const kind of kinds){
   const pairs=[];
   for(let round=1;round<=4;round++){
    const a=records.filter(r=>r.mode==='off'&&r.kind===kind&&r.round===round);
    const b=records.filter(r=>r.mode==='card-infer'&&r.kind===kind&&r.round===round);
    assert.equal(a.length,1,'Missing off sample: '+kind+' '+round);
    assert.equal(b.length,1,'Missing infer sample: '+kind+' '+round);
    assert.equal(a[0].fingerprint,b[0].fingerprint,kind+': compiled content fingerprint mismatch');
    assert.equal(a[0].cards,b[0].cards,kind+': compiled card count mismatch');
    pairs.push({round,offMs:a[0].actualDurationMs,inferMs:b[0].actualDurationMs,offCommits:a[0].commits,inferCommits:b[0].commits});
   }
   const mean=key=>Number((pairs.reduce((sum,p)=>sum+p[key],0)/4).toFixed(3));
   comparisons.push({kind,offMeanMs:mean('offMs'),inferMeanMs:mean('inferMs'),pairs});
  }
  console.log('REACT_PRODUCTION_WHOLE_PAGE_COMPARISON '+JSON.stringify({
   browser:browser.version(),comparisons,
   limitations:'Vite production-optimized isolated page fixture, React 19 react-dom/profiling, actual existing page trees, synthetic read-only API data, open/close interactions, four order-balanced trials. Profiler instrumentation adds overhead. No real users, live network, physical Safari, production Railway route latency, or statistically powered inference. Do not infer end-user speedup from these measurements.',
  }));
 }finally{await browser.close();}
});
