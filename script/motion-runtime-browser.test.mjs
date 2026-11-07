import assert from 'node:assert/strict';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { chromium } from 'playwright';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('application uses one Motion React runtime; no direct legacy dependency', async () => {
  const pkg = JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
  const lock = JSON.parse(await readFile(path.join(root,'package-lock.json'),'utf8'));
  assert.equal(pkg.dependencies['framer-motion'],undefined);
  assert.equal(lock.packages['node_modules/framer-motion'],undefined);
  assert.equal(lock.packages['node_modules/motion/node_modules/framer-motion'].version,'12.43.0');
  async function walk(dir) {
    for(const entry of await readdir(dir,{withFileTypes:true})) {
      const file=path.join(dir,entry.name);
      if(entry.isDirectory()) await walk(file);
      else if(/\.[jt]sx?$/.test(entry.name)) assert.doesNotMatch(await readFile(file,'utf8'),/from\s+['"]framer-motion['"]/);
    }
  }
  await walk(path.join(root,'client/src'));
});

test('real dock, navigation and auth transitions work with normal and reduced motion', {timeout:120000}, async () => {
  const cacheDir=await mkdtemp(path.join(tmpdir(),'motion-runtime-vite-'));
  const fixture='script/fixtures/motion-runtime-browser.tsx';
  const server=await createServer({configFile:false,root,cacheDir,publicDir:false,
    optimizeDeps:{entries:[fixture],include:['react/jsx-runtime','react/jsx-dev-runtime','motion/react']},
    plugins:[react(),{name:'motion-fixture',configureServer(s){s.middlewares.use(async(req,res,next)=>{
      if(!req.url?.startsWith('/__motion-qa'))return next();
      res.setHeader('Content-Type','text/html');
      res.end(await s.transformIndexHtml(req.url,`<!doctype html><html><head><style>
        body{margin:20px}
        .z-mobile-dock{position:fixed;bottom:10px;left:20px;right:20px}.hub-mobile-bar__dock{display:flex;position:relative}
        .hub-mobile-bar__dock>button{width:120px;height:48px}.z-mobile-dock__indicator{position:absolute;height:4px}
      </style></head><body><div id="root"></div><script type="module" src="/${fixture}"></script></body></html>`));
    });}}],resolve:{alias:{'@':path.join(root,'client/src'),'@shared':path.join(root,'shared')}},server:{host:'127.0.0.1',port:0,hmr:false,watch:null}});
  let browser;
  try {
    await server.listen();await server.warmupRequest('/'+fixture);
    browser=await chromium.launch({headless:true});
    for(const reducedMotion of ['no-preference','reduce']) {
      const context=await browser.newContext({viewport:{width:500,height:800},reducedMotion});
      await context.route('**/api/**', route => {
        const url=new URL(route.request().url());
        if(url.pathname==='/api/auth/login')return route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({error:'Fixture rejected credentials'})});
        return route.fulfill({status:401,contentType:'application/json',body:'{}'});
      });
      const page=await context.newPage();page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(server.resolvedUrls.local[0]+'__motion-qa');
      // The retired MapzLayerSheet is not part of the shared Motion runtime.
      // Five-mode map drawer coverage belongs to the pinned map engine tests.
      await page.getByRole('button',{name:'Second',exact:true}).click();await page.waitForTimeout(700);
      assert.equal(await page.getByRole('button',{name:'Second',exact:true}).getAttribute('data-dock-selected'),'true');
      assert.equal(await page.locator('.z-mobile-dock').getAttribute('data-quiet'),String(reducedMotion==='reduce'));
      await page.evaluate(()=>document.documentElement.dataset.calm='true');await page.waitForTimeout(100);
      assert.equal(await page.locator('.z-mobile-dock').getAttribute('data-quiet'),'true');
      // Nav and auth use actual application styles, not a fixture display override.
      await page.evaluate(()=>delete document.documentElement.dataset.calm);
      const eventNav=page.locator('#navigation').getByRole('link',{name:'Eventz',exact:true});
      await eventNav.hover();await page.waitForTimeout(500);
      assert.ok(await eventNav.locator('.znav-expanding-label').evaluate(el=>el.getBoundingClientRect().width)>60);
      await page.locator('#open-auth').hover();await page.waitForTimeout(500);
      assert.ok(await eventNav.locator('.znav-expanding-label').evaluate(el=>el.getBoundingClientRect().width)<1);
      await page.locator('#navigation').getByRole('button',{name:'Boards',exact:true}).click();
      await page.getByRole('menuitem',{name:'All Boards'}).waitFor();
      await page.keyboard.press('Escape');await page.getByRole('menuitem',{name:'All Boards'}).waitFor({state:'hidden'});
      await page.locator('#open-auth').click();
      await page.getByRole('group',{name:'Account',exact:true}).getByRole('button',{name:'Join',exact:true}).click();
      await page.getByRole('textbox',{name:'Username',exact:true}).fill('fixture-user');
      await page.getByRole('textbox',{name:'Email address',exact:true}).fill('fixture@example.invalid');
      await page.getByRole('button',{name:'Continue',exact:true}).click();
      await page.getByLabel('Repeat password',{exact:true}).waitFor();
      assert.equal(await page.getByRole('textbox',{name:'Username',exact:true}).count(),0);
      await page.getByRole('button',{name:'Back',exact:true}).click();
      await page.getByRole('textbox',{name:'Username',exact:true}).waitFor();
      assert.equal(await page.getByRole('textbox',{name:'Username',exact:true}).inputValue(),'fixture-user');
      await page.getByRole('group',{name:'Account',exact:true}).getByRole('button',{name:'Log in',exact:true}).click();
      await page.getByPlaceholder('Password',{exact:true}).fill('fixture-not-real');
      await page.locator('.pdx-auth-scrim button[type="submit"]').click();
      await page.getByText('Fixture rejected credentials',{exact:true}).waitFor();
      await page.getByRole('button',{name:'Close',exact:true}).click();
      await page.locator('.pdx-auth-scrim').waitFor({state:'hidden'});
      assert.equal(await page.locator('#auth-close').textContent(),'closed');
      assert.deepEqual(errors,[]);await context.close();
    }
  } finally {await browser?.close();await server.close();await rm(cacheDir,{recursive:true,force:true});}
});
