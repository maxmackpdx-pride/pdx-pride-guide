/** Compare compiler-on and compiler-off behavior for the same opt-in React 19
 * experimental card boundary. Not a production integration or a latency guarantee.
 * Run: node --test script/react-compiler-comparison-browser.test.mjs
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
const fixture='script/fixtures/react-compiler-card-benchmark.tsx';
const compiledModule='/client/src/components/cards/experimental/React19CardBoundaries.tsx';

async function measure(browser,compilerEnabled,t) {
  const cacheDir=await mkdtemp(path.join(tmpdir(),compilerEnabled?'zay-compiler-on-':'zay-compiler-off-'));
  t.after(()=>rm(cacheDir,{recursive:true,force:true}));
  const server=await createServer({
    configFile:false, root, cacheDir,
    publicDir:path.join(root,'client/public'),
    optimizeDeps:{entries:[fixture],include:['react/jsx-runtime','react/jsx-dev-runtime']},
    plugins:[
      react(),
      ...(compilerEnabled?[babel({presets:[reactCompilerPreset({compilationMode:'annotation'})]})]:[]),
      {name:'compiler-benchmark-html',configureServer(vite){vite.middlewares.use(async(req,res,next)=>{
        if(!req.url?.startsWith('/__compiler-benchmark'))return next();
        const html=await vite.transformIndexHtml(req.url,
          '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/script/fixtures/react-compiler-card-benchmark.tsx"></script></body></html>');
        res.setHeader('Content-Type','text/html');res.end(html);
      });}},
    ],
    resolve:{alias:{'@':path.join(root,'client/src'),'@shared':path.join(root,'shared'),'@assets':path.join(root,'attached_assets')}},
    server:{host:'127.0.0.1',port:0,hmr:false,watch:null},
  });
  let context;
  try {
    await server.listen();
    const output=await server.transformRequest(compiledModule);
    assert.ok(output?.code,'Vite did not transform the actual experimental module');
    const usesCompiler=/react\/compiler-runtime|useMemoCache|memo_cache_sentinel/.test(output.code);
    assert.equal(usesCompiler,compilerEnabled,'The build transform must match the enabled Compiler setting');
    context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',err=>errors.push(String(err)));
    await page.goto(server.resolvedUrls.local[0]+'__compiler-benchmark');
    await page.locator('[data-card-record]').first().waitFor({state:'visible',timeout:30000});
    assert.equal(await page.locator('[data-card-record]').count(),120,'All 120 cards must render');
    assert.equal(await page.locator('[data-card-record]').last().textContent(),'Sample Place 120');
    await page.evaluate(()=>{
      const m=window.__zayCompilerBenchmark;
      m.renderCalls=0;
      m.samples=[];
    });
    for(let n=1;n<=6;n++){
      await page.evaluate(()=>window.dispatchEvent(new Event('zaylist-compiler-benchmark-tick')));
      await page.waitForFunction(n=>document.getElementById('benchmark-tick')?.textContent===String(n),n,{timeout:15000});
    }
    const metrics=await page.evaluate(()=>({
      ...window.__zayCompilerBenchmark,
      tick:document.getElementById('benchmark-tick')?.textContent,
      cards:document.querySelectorAll('[data-card-record]').length,
    }));
    assert.deepEqual(errors,[],'Browser errors in the card fixture');
    assert.equal(metrics.tick,'6','Parent state updates must complete');
    assert.equal(metrics.cards,120,'Cards remain intact after parent updates');
    assert.ok(metrics.samples.every(s=>Number.isFinite(s.actualDurationMs)&&s.actualDurationMs>=0),'Invalid profiler durations');
    return {
      mode:compilerEnabled?'compiler-annotation':'no-compiler',
      cards:metrics.cards,parentUpdates:Number(metrics.tick),
      childRenderCalls:metrics.renderCalls,
      profilerCommits:metrics.samples.length,
      totalActualDurationMs:Number(metrics.samples.reduce((acc,s)=>acc+s.actualDurationMs,0).toFixed(3)),
      totalBaseDurationMs:Number(metrics.samples.reduce((acc,s)=>acc+s.baseDurationMs,0).toFixed(3)),
      browser:browser.version(),
      compiledTransform:usesCompiler,
    };
  }finally{
    await context?.close();
    await server.close();
  }
}

test('same opt-in card boundaries compare with and without React Compiler',{timeout:300000},async t=>{
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const without=await measure(browser,false,t);
    const withCompiler=await measure(browser,true,t);
    console.log('REACT_COMPILER_CARD_COMPARISON '+JSON.stringify({without,withCompiler}));
    assert.ok(without.childRenderCalls>0,'Uncompiled baseline must show meaningful child rendering');
    // A deterministic render-call reduction is required. Browser duration is
    // reported for context, never converted into an unsupported speedup claim.
    assert.ok(withCompiler.childRenderCalls<without.childRenderCalls,
      'Annotated compiler boundary must avoid more redundant child renders than baseline');
  }finally{await browser.close();}
});
