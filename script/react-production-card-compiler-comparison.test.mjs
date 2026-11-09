/** Matched browser profiling of actual Eventz/Boardz/Placez React 19 card components.
 * An isolated, uncompiled fixture compares baseline, production-candidate annotation mode, and exploratory infer mode.
 * It never changes production Vite settings, card code, API data or live traffic.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import react,{reactCompilerPreset} from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import {chromium} from 'playwright';

const root=path.resolve(import.meta.dirname,'..');
const fixture='script/fixtures/card-api-browser.tsx';

// Keep the profiling parent fixture uncompiled. Otherwise the Compiler could
// cache its children and produce a misleading "card optimization" result.

async function sample(browser,mode,t) {
  const compiled=mode!=='off';
  const cacheDir=await mkdtemp(path.join(tmpdir(),compiled?`zay-real-${mode}-`:'zay-real-uncompiled-'));
  t.after(()=>rm(cacheDir,{recursive:true,force:true}));
  const server=await createServer({
    configFile:false,root,cacheDir,
    publicDir:path.join(root,'client/public'),
    optimizeDeps:{entries:[fixture],include:['react/jsx-runtime','react/jsx-dev-runtime']},
    plugins:[
      react(),
      ...(compiled?[babel({presets:[reactCompilerPreset({compilationMode:mode})],exclude:[/[\\/]node_modules[\\/]/,/\x00rolldown\/runtime\.js/ ,/[\\/]script[\\/]fixtures[\\/]/]})]:[]),
      {name:'real-card-profile-html',configureServer(vite){vite.middlewares.use(async(req,res,next)=>{
        if(!req.url?.startsWith('/__real-card-compiler-profile'))return next();
        const html=await vite.transformIndexHtml(req.url,
          '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/script/fixtures/card-api-browser.tsx"></script></body></html>');
        res.setHeader('Content-Type','text/html');res.end(html);
      });}},
    ],
    resolve:{alias:{
      '@':path.join(root,'client/src'),
      '@shared':path.join(root,'shared'),
      '@assets':path.join(root,'attached_assets'),
    }},
    server:{host:'127.0.0.1',port:0,hmr:false,watch:null},
    define:{
      __OUTZIDE_ASSETS__:JSON.stringify({script:'/outzide-map/app.js',maplibre:'/home-flight/vendor/maplibre-gl-5.6.2.js',maplibreCss:'/home-flight/vendor/maplibre-gl-5.6.2.css'}),
      __MAPZ_ASSETS__:'{}',
      __HOME_FLIGHT_BASE__:JSON.stringify('/home-flight'),
    },
  });
  try {
    await server.listen();
    await server.warmupRequest('/'+fixture);
    if(compiled){
      // Vite rewrites "react/compiler-runtime" to "react_compiler-runtime"
      // in dev-server output. Check both rather than reporting false negatives.
      const isCompiled=code=>/react(?:\/|_)compiler-runtime|useMemoCache|memo_cache_sentinel/.test(code);
      const fixtureCode=await server.transformRequest('/'+fixture);
      assert.ok(!isCompiled(fixtureCode?.code??''),
        'Profile harness must remain uncompiled to avoid parent memoization bias');
      const transformed=[],probes=[];
      for(const name of ['EventCard','BoardCard','PlaceCard']){
        const module=await server.transformRequest('/client/src/components/cards/'+name+'.tsx');
        const code=module?.code??'';
        const hit=isCompiled(code);
        probes.push({name,compiled:hit,bytes:code.length,
          runtimeReference:code.match(/.{0,40}(?:compiler-runtime|useMemoCache|memo_cache_sentinel).{0,80}/)?.[0]??null});
        if(hit)transformed.push(name);
      }
      console.log('COMPILER_PRODUCTION_CARD_MODULES '+JSON.stringify({mode,transformed,probes}));
      assert.ok(transformed.length>0,'Compiler did not transform any actual production card module');
    }
    const results=[];
    for(const family of ['event','board','place']) {
      const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
      try {
        await context.route('**/api/**',route=>{
          const req=route.request(),pathname=new URL(req.url()).pathname;
          if(req.method()!=='GET')return route.fulfill({status:403,json:{error:'Read-only profiling fixture'}});
          if(pathname==='/api/auth/me')return route.fulfill({json:{id:123,username:'profiling',email:'profile@example.invalid'}});
          return route.fulfill({json:[]});
        });
        const page=await context.newPage(),errors=[];
        page.on('pageerror',error=>errors.push(String(error)));
        await page.goto(server.resolvedUrls.local[0]+'__real-card-compiler-profile?family='+family+'&size=small');
        await page.locator('#qa-grid > *').first().waitFor({state:'visible',timeout:30000});
        const before=await page.locator('#qa-grid > *').evaluateAll(els=>els.map(el=>({
          category:(el.matches('[data-card-category]')?el:el.querySelector('[data-card-category]'))?.getAttribute('data-card-category'),size:(el.matches('[data-card-size]')?el:el.querySelector('[data-card-size]'))?.getAttribute('data-card-size'),
          text:el.textContent?.replace(/\s+/g,' ').trim().slice(0,120),
        })));
        assert.equal(before.length,6,'Expected six top-level production card slots');
        assert.ok(before.every(card=>card.category&&card.size),'Each card slot must contain an identifiable production card');
        await page.evaluate(()=>{window.__zayCardRenderProfile=[];});
        for(let tick=1;tick<=5;tick++){
          await page.evaluate(()=>window.dispatchEvent(new Event('zaylist-card-profile-tick')));
          await page.waitForFunction(n=>document.querySelector('[data-profile-tick]')?.textContent===String(n),tick,{timeout:15000});
          await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        }
        const after=await page.locator('#qa-grid > *').evaluateAll(els=>els.map(el=>({
          category:(el.matches('[data-card-category]')?el:el.querySelector('[data-card-category]'))?.getAttribute('data-card-category'),
          size:(el.matches('[data-card-size]')?el:el.querySelector('[data-card-size]'))?.getAttribute('data-card-size'),
          text:el.textContent?.replace(/\s+/g,' ').trim().slice(0,120),
        })));
        const commits=await page.evaluate(()=>window.__zayCardRenderProfile??[]);
        assert.ok(after.every(card=>card.category&&card.size),'Card identity and size must persist across parent updates');
        assert.deepEqual(after,before,compiled?'Compiler changed the card DOM':'Baseline changed the card DOM');
        assert.deepEqual(errors,[],'Uncaught browser errors');
        assert.ok(commits.every(c=>Number.isFinite(c.actualDurationMs)&&c.actualDurationMs>=0),'Invalid React Profiler duration');
        results.push({
          family,mode:compiled?`compiler-${mode}`:'uncompiled',
          cards:before.length,parentUpdates:5,profilerCommits:commits.length,
          contentFingerprint:createHash('sha256').update(JSON.stringify(before)).digest('hex').slice(0,16),
          totalActualDurationMs:Number(commits.reduce((n,c)=>n+c.actualDurationMs,0).toFixed(3)),
          totalBaseDurationMs:Number(commits.reduce((n,c)=>n+c.baseDurationMs,0).toFixed(3)),
        });
      }finally{await context.close();}
    }
    return results;
  }finally{await server.close();}
}

test('matched real Eventz, Boardz and Placez cards render identically with Compiler enabled',{timeout:600000},async t=>{
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{
    // Reverse the execution order in the second pair to reduce browser warmup bias.
    const rounds=[];
    for(const [round,mode] of [[1,'off'],[1,'annotation'],[1,'infer'],[2,'infer'],[2,'annotation'],[2,'off']]){
      rounds.push({round,mode,results:await sample(browser,mode,t)});
    }
    const reference=rounds[0].results;
    for(const trial of rounds){
      assert.equal(trial.results.length,reference.length,'Must compare the same card families');
      for(let i=0;i<reference.length;i++){
        assert.equal(trial.results[i].family,reference[i].family,'Must compare matching card families');
        assert.equal(trial.results[i].cards,6,'Must render six top-level production cards');
        assert.equal(trial.results[i].contentFingerprint,reference[i].contentFingerprint,
          `${trial.results[i].family}: Compiler or trial changed visible card output`);
      }
    }
    console.log('REACT_REAL_CARD_COMPILER_COMPARISON '+JSON.stringify({
      browser:browser.version(),rounds,
      note:'Exploratory dev-server timings over five parent updates per trial. Two order-balanced trials for each mode. The annotation case matches the experimental Vite compilation setting; not a production speedup claim.',
    }));
  }finally{await browser.close();}
});
