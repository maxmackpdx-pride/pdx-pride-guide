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
import sharp from 'sharp';
import {cardFaceModules,cardSourcePatterns,cardCompilerExcludedPatterns} from './react-compiler-card-scope.mjs';

const root=path.resolve(import.meta.dirname,'..');
const fixture='script/fixtures/card-api-browser.tsx';

// A bounded infer experiment including the actual dedicated card faces and
// Boardz artwork renderers, not merely thin EventCard/BoardCard/PlaceCard wrappers.
// Only these exact components are included, not page routes, auth, modal, Mapz,
// or consent UI. The profiling parent remains deliberately uncompiled.
// The fixture parent remains uncompiled so its updates cannot be memoized away.
// Keep the profiling parent fixture uncompiled. Otherwise the Compiler could
// cache its children and produce a misleading "card optimization" result.

async function sample(browser,mode,t) {
  const compiled=mode!=='off';
  const scoped=mode==='card-infer';
  const compilerMode=scoped?'infer':mode;
  const cacheDir=await mkdtemp(path.join(tmpdir(),compiled?`zay-real-${mode}-`:'zay-real-uncompiled-'));
  t.after(()=>rm(cacheDir,{recursive:true,force:true}));
  const server=await createServer({
    configFile:false,root,cacheDir,
    publicDir:path.join(root,'client/public'),
    optimizeDeps:{entries:[fixture],include:['react/jsx-runtime','react/jsx-dev-runtime']},
    plugins:[
      react(),
      ...(compiled?[babel({presets:[reactCompilerPreset({compilationMode:compilerMode})],...(scoped?{include:cardSourcePatterns}:{}),exclude:cardCompilerExcludedPatterns})]:[]),
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
      if(scoped){
        assert.deepEqual(transformed,['EventCard','BoardCard','PlaceCard'],
          'Card-scoped infer must transform all three real card components');
        const compiledFaces=[];
        for(const face of cardFaceModules){
          const module=await server.transformRequest('/client/src/components/'+face+(face.startsWith('board/punk/')?'.jsx':'.tsx'));
          if(isCompiled(module?.code??''))compiledFaces.push(face);
        }
        assert.deepEqual(compiledFaces,cardFaceModules,
          'Card-scoped infer must transform each real face renderer, not just the wrapper');
        const excluded=[
          '/client/src/components/cards/NeedzCard.tsx',
          '/client/src/components/cards/OutzCard.tsx',
          '/client/src/components/cards/CardAPI.tsx',
          '/client/src/components/cards/react19Card.tsx',
          '/client/src/components/cards/cardLayout.ts',
          '/client/src/components/cards/experimental/React19CardBoundaries.tsx',
          '/client/src/components/discovery/EventzBrowse.tsx',
          '/client/src/components/VenueFollowButton.tsx',
          '/client/src/components/PlaceModal.tsx',
        ];
        for(const path of excluded){
          const module=await server.transformRequest(path);
          assert.ok(!isCompiled(module?.code??''),`Card-scoped infer must not compile ${path}`);
        }
        console.log('COMPILER_CARD_SCOPE '+JSON.stringify({
          compiledCards:transformed,compiledFaces,excluded,parentFixtureCompiled:false,
          sourcePatterns:cardSourcePatterns.map(pattern=>pattern.source),
        }));
      }
    }
    const results=[],visuals=[];
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
        // A visible card does not guarantee the fixture's useEffect listener is attached.
        // Handshake before ticks so CI load cannot silently drop the first update.
        await page.waitForFunction(()=>window.__zayCardProfileListenerReady===true,null,{timeout:30000});
        const before=await page.locator('#qa-grid > *').evaluateAll(els=>els.map(el=>({
          category:(el.matches('[data-card-category]')?el:el.querySelector('[data-card-category]'))?.getAttribute('data-card-category'),size:(el.matches('[data-card-size]')?el:el.querySelector('[data-card-size]'))?.getAttribute('data-card-size'),
          text:el.textContent?.replace(/\s+/g,' ').trim(),
        })));
        assert.equal(before.length,6,'Expected six top-level production card slots');
        assert.ok(before.every(card=>card.category&&card.size),'Each card slot must contain an identifiable production card');
        await page.evaluate(()=>{window.__zayCardRenderProfile=[];});
        for(let tick=1;tick<=5;tick++){
          await page.evaluate(()=>window.dispatchEvent(new Event('zaylist-card-profile-tick')));
          try {
            await page.waitForFunction(n=>document.querySelector('[data-profile-tick]')?.textContent===String(n),tick,{timeout:15000});
          } catch(error) {
            const state=await page.evaluate(()=>({
              listenerReady:window.__zayCardProfileListenerReady===true,
              observedTick:document.querySelector('[data-profile-tick]')?.textContent??null,
              cardCount:document.querySelectorAll('#qa-grid > *').length,
              profilerCommits:window.__zayCardRenderProfile?.length??0,
            })).catch(e=>({diagnosticError:String(e)}));
            console.error('REACT_CARD_PROFILE_TICK_TIMEOUT '+JSON.stringify({mode,family,tick,state,errors}));
            throw error;
          }
          await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        }
        const after=await page.locator('#qa-grid > *').evaluateAll(els=>els.map(el=>({
          category:(el.matches('[data-card-category]')?el:el.querySelector('[data-card-category]'))?.getAttribute('data-card-category'),
          size:(el.matches('[data-card-size]')?el:el.querySelector('[data-card-size]'))?.getAttribute('data-card-size'),
          text:el.textContent?.replace(/\s+/g,' ').trim(),
        })));
        const commits=await page.evaluate(()=>window.__zayCardRenderProfile??[]);
        assert.ok(after.every(card=>card.category&&card.size),'Card identity and size must persist across parent updates');
        assert.deepEqual(after,before,compiled?'Compiler changed the card DOM':'Baseline changed the card DOM');
        assert.deepEqual(errors,[],'Uncaught browser errors');
        assert.ok(commits.length>=5,'Profiler must record every requested parent update');
        for(let tick=1;tick<=5;tick++){
          assert.ok(commits.some(commit=>commit.tick===tick&&commit.phase!=='mount'),
            `Profiler missed requested parent update ${tick}`);
        }
        assert.ok(commits.every(c=>Number.isFinite(c.actualDurationMs)&&c.actualDurationMs>=0
          &&Number.isFinite(c.baseDurationMs)&&c.baseDurationMs>=0),'Invalid React Profiler duration');
        // Compare actual rendered pixels, not only card text. Wait for fonts
        // and images, then disable CSS animations during the screenshot.
        await page.evaluate(async()=>{
          await document.fonts.ready;
          await Promise.all([...document.images].map(image=>image.decode().catch(()=>null)));
        });
        const screenshot=await page.locator('#qa-grid').screenshot({animations:'disabled',caret:'hide',scale:'css'});
        const {data,info}=await sharp(screenshot).ensureAlpha().raw().toBuffer({resolveWithObject:true});
        visuals.push({family,width:info.width,height:info.height,pixels:data});
        results.push({
          family,mode:compiled?`compiler-${mode}`:'uncompiled',
          cards:before.length,parentUpdates:5,profilerCommits:commits.length,
          contentFingerprint:createHash('sha256').update(JSON.stringify(before)).digest('hex').slice(0,16),
          totalActualDurationMs:Number(commits.reduce((n,c)=>n+c.actualDurationMs,0).toFixed(3)),
          totalBaseDurationMs:Number(commits.reduce((n,c)=>n+c.baseDurationMs,0).toFixed(3)),
        });
      }finally{await context.close();}
    }
    return {results,visuals};
  }finally{await server.close();}
}

test('matched real Eventz, Boardz and Placez cards render identically with Compiler enabled',{timeout:600000},async t=>{
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{
    // Four balanced trials put each mode in every execution position once.
    const rounds=[];
    for(const [round,mode] of [[1,'off'],[1,'annotation'],[1,'card-infer'],[1,'infer'],[2,'infer'],[2,'card-infer'],[2,'annotation'],[2,'off'],[3,'annotation'],[3,'infer'],[3,'off'],[3,'card-infer'],[4,'card-infer'],[4,'off'],[4,'infer'],[4,'annotation']]){
      const {results,visuals}=await sample(browser,mode,t);
      rounds.push({round,mode,results,visuals});
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
    // The matching uncompiled sample from the same balanced round is the
    // screenshot reference. Material image differences fail the release gate.
    const visualComparisons=[];
    for(const trial of rounds.filter(item=>item.mode!=='off')){
      const baseline=rounds.find(item=>item.round===trial.round&&item.mode==='off');
      assert.ok(baseline,`Missing uncompiled screenshot reference for round ${trial.round}`);
      for(let index=0;index<trial.visuals.length;index++){
        const expected=baseline.visuals[index],actual=trial.visuals[index];
        assert.equal(actual.family,expected.family,'Visual comparison changed card family');
        assert.equal(actual.width,expected.width,`${actual.family}: screenshot width changed`);
        assert.equal(actual.height,expected.height,`${actual.family}: screenshot height changed`);
        assert.equal(actual.pixels.length,expected.pixels.length,'Screenshot channel count changed');
        let changedPixels=0;
        for(let pixel=0;pixel<actual.pixels.length;pixel+=4){
          if(Math.max(...[0,1,2].map(channel=>Math.abs(actual.pixels[pixel+channel]-expected.pixels[pixel+channel])))>16)changedPixels++;
        }
        const totalPixels=actual.width*actual.height;
        const changedRatio=changedPixels/totalPixels;
        visualComparisons.push({round:trial.round,mode:trial.mode,family:actual.family,changedPixels,totalPixels,changedRatio:Number(changedRatio.toFixed(6))});
        assert.ok(changedRatio<=0.0025,
          `${actual.family} ${trial.mode} round ${trial.round}: screenshots differ in ${(changedRatio*100).toFixed(3)}% of pixels (max 0.25%; RGB threshold 16)`);
      }
    }
    console.log('REACT_REAL_CARD_COMPILER_COMPARISON '+JSON.stringify({
      browser:browser.version(),rounds:rounds.map(({visuals,...rest})=>rest),visualComparisons,
      note:'Exploratory dev-server timings over five parent updates per trial. Four order-balanced trials for each mode; each requested update must have a Profiler callback. Screenshot comparison allows at most 0.25% of pixels to differ by more than 16 RGB units after font and image loads with animations disabled; not pixel-perfect certification. The annotation case matches experimental Vite, while card-infer limits infer to card API and an exact allowlist of existing card face renderers. These measurements do not establish a production speedup.',
    }));
  }finally{await browser.close();}
});
