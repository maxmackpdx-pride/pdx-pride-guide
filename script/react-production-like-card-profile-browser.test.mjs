/** Paired production-optimized React 19 Profiler measurements on existing
 * Eventz/Boardz/Placez card faces. The isolated build uses react-dom/profiling
 * instead of silently disabling React.Profiler in production.
 * No app build settings, production assets or API contracts are changed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {build,preview} from 'vite';
import react,{reactCompilerPreset} from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import {chromium} from 'playwright';
import sharp from 'sharp';
import {cardSourcePatterns,cardCompilerExcludedPatterns} from './react-compiler-card-scope.mjs';

const root=path.resolve(import.meta.dirname,'..');
const fixtureHtml='script/fixtures/production-card-profiler.html';
const families=['event','board','place'];
const isProfilerRecord=c=>Number.isFinite(c.actualDurationMs)&&c.actualDurationMs>=0&&Number.isFinite(c.baseDurationMs)&&c.baseDurationMs>=0;

async function makeBuiltFixture(compiled,t){
  const outDir=await mkdtemp(path.join(tmpdir(),compiled?'zay-prod-card-infer-':'zay-prod-card-off-'));
  t.after(()=>rm(outDir,{recursive:true,force:true}));
  const config={
    configFile:false,
    root,
    publicDir:path.join(root,'client/public'),
    plugins:[
      react(),
      ...(compiled?[babel({
        presets:[reactCompilerPreset({compilationMode:'infer'})],
        include:cardSourcePatterns,
        exclude:cardCompilerExcludedPatterns,
      })]:[]),
    ],
    resolve:{alias:[
      // React 19 disables onRender in ordinary optimized production bundles.
      // Its dedicated profiling build retains callbacks without dev-only behavior.
      {find:/^react-dom\\/client$/,replacement:'react-dom/profiling'},
      {find:/^@\\/$/,replacement:path.join(root,'client/src')+'/'},
      {find:/^@shared\\/$/,replacement:path.join(root,'shared')+'/'},
      {find:/^@assets\\/$/,replacement:path.join(root,'attached_assets')+'/'},
    ]},
    define:{
      __OUTZIDE_ASSETS__:JSON.stringify({script:'/outzide-map/app.js',maplibre:'/home-flight/vendor/maplibre-gl-5.6.2.js',maplibreCss:'/home-flight/vendor/maplibre-gl-5.6.2.css'}),
      __MAPZ_ASSETS__:'{}',
      __HOME_FLIGHT_BASE__:JSON.stringify('/home-flight'),
    },
    build:{
      target:['chrome107','edge107','firefox104','safari16','ios16'],
      outDir,
      emptyOutDir:true,
      rollupOptions:{input:path.join(root,fixtureHtml)},
    },
    logLevel:'error',
  };
  await build(config);
  const server=await preview({...config,preview:{host:'127.0.0.1',port:0,strictPort:false}});
  t.after(()=>new Promise(resolve=>server.httpServer.close(resolve)));
  const address=server.httpServer.address();
  assert.ok(address&&typeof address!=='string','Production fixture preview must bind a TCP port');
  return 'http://127.0.0.1:'+address.port+'/'+fixtureHtml;
}

async function measure(browser,url,mode,family){
  const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  try {
    await context.route('**/api/**',route=>{
      const request=route.request(),pathname=new URL(request.url()).pathname;
      if(request.method()!=='GET')return route.fulfill({status:403,json:{error:'Profiling fixture is read-only'}});
      if(pathname==='/api/auth/me')return route.fulfill({json:{id:123,username:'profiling',email:'profile@example.invalid'}});
      return route.fulfill({json:[]});
    });
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    await page.goto(url+'?family='+family+'&size=small',{waitUntil:'domcontentloaded'});
    await page.locator('#qa-grid > *').first().waitFor({state:'visible',timeout:30000});
    await page.waitForFunction(()=>window.__zayCardProfileListenerReady===true,null,{timeout:30000});
    const snapshot=()=>page.locator('#qa-grid > *').evaluateAll(elements=>elements.map(element=>({
      category:(element.matches('[data-card-category]')?element:element.querySelector('[data-card-category]'))?.getAttribute('data-card-category'),
      size:(element.matches('[data-card-size]')?element:element.querySelector('[data-card-size]'))?.getAttribute('data-card-size'),
      text:element.textContent?.replace(/\\s+/g,' ').trim(),
    })));
    const before=await snapshot();
    assert.equal(before.length,6,mode+'/'+family+': expected six actual cards');
    assert.ok(before.every(card=>card.category&&card.size),mode+'/'+family+': card identity or size missing');
    await page.evaluate(()=>{window.__zayCardRenderProfile=[];});
    for(let tick=1;tick<=5;tick++){
      await page.evaluate(()=>window.dispatchEvent(new Event('zaylist-card-profile-tick')));
      await page.waitForFunction(n=>document.querySelector('[data-profile-tick]')?.textContent===String(n),tick,{timeout:15000});
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    }
    const after=await snapshot();
    const commits=await page.evaluate(()=>window.__zayCardRenderProfile??[]);
    assert.deepEqual(after,before,mode+'/'+family+': parent updates changed rendered card content');
    assert.deepEqual(errors,[],mode+'/'+family+': uncaught browser errors');
    assert.ok(commits.length>=5,mode+'/'+family+': profiling build did not observe every parent update');
    for(let tick=1;tick<=5;tick++){
      assert.ok(commits.some(commit=>commit.tick===tick&&commit.phase!=='mount'),mode+'/'+family+': missing Profiler callback for update '+tick);
    }
    assert.ok(commits.every(isProfilerRecord),mode+'/'+family+': invalid Profiler durations');
    await page.evaluate(async()=>{
      await document.fonts.ready;
      await Promise.all([...document.images].map(img=>img.decode().catch(()=>null)));
    });
    const screenshot=await page.locator('#qa-grid').screenshot({animations:'disabled',caret:'hide',scale:'css'});
    const {data,info}=await sharp(screenshot).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    return {
      result:{
        family,mode,cards:before.length,parentUpdates:5,profilerCommits:commits.length,
        fingerprint:createHash('sha256').update(JSON.stringify(before)).digest('hex').slice(0,16),
        actualDurationMs:Number(commits.reduce((sum,c)=>sum+c.actualDurationMs,0).toFixed(3)),
        baseDurationMs:Number(commits.reduce((sum,c)=>sum+c.baseDurationMs,0).toFixed(3)),
      },
      pixels:data,width:info.width,height:info.height,
    };
  }finally{await context.close();}
}

test('production-optimized existing cards retain output and report balanced Profiler measurements with card-scoped infer',{timeout:600000},async t=>{
  const [offUrl,inferUrl]=await Promise.all([makeBuiltFixture(false,t),makeBuiltFixture(true,t)]);
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{
    const rounds=[],visuals=[];
    // Balance execution order, including browser cache/context differences.
    for(const [round,first] of [[1,'off'],[2,'card-infer'],[3,'off'],[4,'card-infer']]){
      const modes=first==='off'?['off','card-infer']:['card-infer','off'];
      const perRound={};
      for(const mode of modes){
        const records=[];
        for(const family of families){
          const measurement=await measure(browser,mode==='off'?offUrl:inferUrl,mode,family);
          records.push(measurement);
        }
        perRound[mode]=records;
      }
      for(let i=0;i<families.length;i++){
        const a=perRound.off[i],b=perRound['card-infer'][i];
        assert.equal(b.result.fingerprint,a.result.fingerprint,'Production build card content changed: '+families[i]);
        assert.equal(b.width,a.width,'Production build card screenshot width changed: '+families[i]);
        assert.equal(b.height,a.height,'Production build card screenshot height changed: '+families[i]);
        assert.equal(b.pixels.length,a.pixels.length,'Production build card screenshot byte count changed: '+families[i]);
        let changed=0;
        for(let p=0;p<b.pixels.length;p+=4){
          if(Math.max(Math.abs(b.pixels[p]-a.pixels[p]),Math.abs(b.pixels[p+1]-a.pixels[p+1]),Math.abs(b.pixels[p+2]-a.pixels[p+2]))>16)changed++;
        }
        const ratio=changed/(a.width*a.height);
        visuals.push({round,family:families[i],changedPixels:changed,totalPixels:a.width*a.height,changedRatio:Number(ratio.toFixed(6))});
        assert.ok(ratio<=0.0025,`Production build ${families[i]} round ${round} screenshot differs by ${(ratio*100).toFixed(3)}% (limit 0.25%)`);
      }
      rounds.push({round,off:perRound.off.map(x=>x.result),'card-infer':perRound['card-infer'].map(x=>x.result)});
    }
    console.log('REACT_PRODUCTION_LIKE_CARD_PROFILE '+JSON.stringify({
      browser:browser.version(),rounds,visuals,
      note:'Isolated Vite optimized production fixture with React 19 react-dom/profiling alias, actual existing card faces, exact production card-only Compiler allowlist, four order-balanced trials and five parent updates each. Profiling instrumentation adds overhead. Not live Railway/app-route latency evidence, and not proof of end-user speedup.',
    }));
  }finally{await browser.close();}
});
