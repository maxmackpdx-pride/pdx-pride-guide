/** Matched browser profiling of actual Eventz/Boardz React 19 card components.
 * An isolated fixture compares React Compiler disabled vs heuristic (infer) mode.
 * It never changes production Vite settings, card code, API data or live traffic.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {createServer} from 'vite';
import react,{reactCompilerPreset} from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import {chromium} from 'playwright';

const root=path.resolve(import.meta.dirname,'..');
const fixture='script/fixtures/card-api-browser.tsx';

async function sample(browser,compiled,t) {
  const cacheDir=await mkdtemp(path.join(tmpdir(),compiled?'zay-real-compiler-':'zay-real-uncompiled-'));
  t.after(()=>rm(cacheDir,{recursive:true,force:true}));
  const server=await createServer({
    configFile:false,root,cacheDir,
    publicDir:path.join(root,'client/public'),
    optimizeDeps:{entries:[fixture],include:['react/jsx-runtime','react/jsx-dev-runtime']},
    plugins:[
      react(),
      ...(compiled?[babel({presets:[reactCompilerPreset({compilationMode:'infer'})]})]:[]),
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
    const results=[];
    for(const family of ['event','board']) {
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
        await page.locator('#qa-grid > [data-card-size]').first().waitFor({state:'visible',timeout:30000});
        const before=await page.locator('#qa-grid > [data-card-size]').evaluateAll(els=>els.map(el=>({
          category:el.getAttribute('data-card-category'),size:el.getAttribute('data-card-size'),
          text:el.textContent?.replace(/\s+/g,' ').trim().slice(0,120),
        })));
        assert.equal(before.length,6,'Expected six actual production card components');
        await page.evaluate(()=>{window.__zayCardRenderProfile=[];});
        for(let tick=1;tick<=5;tick++){
          await page.evaluate(()=>window.dispatchEvent(new Event('zaylist-card-profile-tick')));
          await page.waitForFunction(n=>document.querySelector('[data-profile-tick]')?.textContent===String(n),tick,{timeout:15000});
          await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        }
        const after=await page.locator('#qa-grid > [data-card-size]').evaluateAll(els=>els.map(el=>({
          category:el.getAttribute('data-card-category'),size:el.getAttribute('data-card-size'),
          text:el.textContent?.replace(/\s+/g,' ').trim().slice(0,120),
        })));
        const commits=await page.evaluate(()=>window.__zayCardRenderProfile??[]);
        assert.deepEqual(after,before,compiled?'Compiler changed the card DOM':'Baseline changed the card DOM');
        assert.deepEqual(errors,[],'Uncaught browser errors');
        assert.ok(commits.every(c=>Number.isFinite(c.actualDurationMs)&&c.actualDurationMs>=0),'Invalid React Profiler duration');
        results.push({
          family,mode:compiled?'compiler-infer':'uncompiled',
          cards:before.length,parentUpdates:5,profilerCommits:commits.length,
          totalActualDurationMs:Number(commits.reduce((n,c)=>n+c.actualDurationMs,0).toFixed(3)),
          totalBaseDurationMs:Number(commits.reduce((n,c)=>n+c.baseDurationMs,0).toFixed(3)),
        });
      }finally{await context.close();}
    }
    return results;
  }finally{await server.close();}
}

test('same real Eventz and Boardz cards are intact with React Compiler enabled',{timeout:300000},async t=>{
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{
    const without=await sample(browser,false,t);
    const withCompiler=await sample(browser,true,t);
    for(let i=0;i<without.length;i++){
      assert.equal(withCompiler[i].family,without[i].family,'Must compare matching card families');
      assert.equal(withCompiler[i].cards,without[i].cards,'Card count must not change');
    }
    console.log('REACT_REAL_CARD_COMPILER_COMPARISON '+JSON.stringify({
      browser:browser.version(),without,withCompiler,
      note:'Diagnostic timings only; not a statistically powered production speedup claim.',
    }));
  }finally{await browser.close();}
});
