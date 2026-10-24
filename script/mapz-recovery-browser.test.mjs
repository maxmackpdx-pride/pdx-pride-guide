import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import fs from 'node:fs';
let server,browser,base;
test.before(async()=>{
 const result=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import MapzCanvas from './client/src/components/MapzCanvas';function App(){const [active,setActive]=React.useState(true);window.setActive=setActive;return <MapzCanvas active={active} rows={[{key:'fixture',coordinates:[-122.67,45.52],name:'Fixture',color:'#ff7900',logo:''}]} selected="fixture" labelsEnabled={false} viewTime={12345} onSelect={()=>{}} onView={()=>{}}/>}createRoot(document.getElementById('root')).render(<App/>);`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',loader:{'.css':'empty'}});
 const bridge=fs.readFileSync('client/public/mapz-map/index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
 const app=express();app.get('/',(_req,res)=>res.send('<div id="root"></div><script src="/host.js"></script>'));
 app.get('/host.js',(_req,res)=>res.type('js').send(result.outputFiles[0].text));
 const mapHtml=fs.readFileSync('client/public/mapz-map/index.html','utf8'),credit=mapHtml.match(/<div class="credit">.*?<\/div>/)[0];
 app.get('/credit-host',(_req,res)=>res.send('<style>body{margin:0}iframe{width:100vw;height:100vh;border:0}#dock{position:fixed;bottom:8px;left:8px;right:8px;height:82px;background:black}@media(min-width:960px){#dock{display:none}}</style><iframe src="/credit-frame"></iframe><nav id="dock"></nav>'));
 app.get('/credit-frame',(_req,res)=>res.send('<html data-embedded="1"><head><style>'+fs.readFileSync('client/public/mapz-map/studio.css','utf8')+'</style></head><body>'+credit+'</body></html>'));
 app.get('/mapz-map/index.html',(_req,res)=>res.send(`<script>${bridge}</script><script>window.messages=[];window.addEventListener('message',e=>{if(e.data.source==='mapz-host')messages.push(e.data)});setTimeout(()=>{if(parent.__failBoot)window.__mapzStartup.fatal('injected boot failure');else {window.__mapzStartup.phase('first-frame');parent.postMessage({source:'mapz-demo',type:'first-frame'},location.origin);if(window.__mapzStartup.ready)window.__mapzStartup.ready();else parent.postMessage({source:'mapz-demo',type:'ready'},location.origin);}},25);</script>`));
 server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
});
test.after(async()=>{await browser?.close();server?.closeAllConnections();await new Promise(resolve=>server?.close(resolve));});
const child=page=>page.frames().find(f=>f.url().includes('/mapz-map/index.html'));
test('Mapz provider attribution stays above the mobile dock and remains tappable',{timeout:30000},async()=>{
 const page=await browser.newPage();try{
  await page.goto(base+'/credit-host');const frame=page.frames().find(f=>f.url().endsWith('/credit-frame'));
  for(const width of [320,390,768,959,1280]){
   await page.setViewportSize({width,height:844});
   const rect=await frame.locator('.credit').boundingBox();
   assert.ok(rect.x>=0&&rect.x+rect.width<=width);
   if(width<960){const dock=await page.locator('#dock').boundingBox();assert.ok(rect.y+rect.height<dock.y,'attribution obscured at '+width);}
   await frame.locator('.credit a').first().click({trial:true});
  }
 }finally{await page.close();}
});
async function boot(page){await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.messages?.some(m=>m.type==='data'));}
test('Mapz resends listings, selection and controls after its existing iframe reloads',{timeout:30000},async()=>{
 const page=await browser.newPage();try{
  await page.goto(base);await boot(page);
  await child(page).evaluate(()=>parent.postMessage({source:'mapz-demo',type:'view',center:[45.55,-122.71],zoom:14.25,pitch:0,bearing:23,bounds:{south:45,north:46,west:-123,east:-122}},location.origin));
  await page.waitForTimeout(50);
  await child(page).evaluate(()=>location.reload());await boot(page);
  const messages=await child(page).evaluate(()=>messages);
  for(const type of ['data','select','visibility','labels','time'])assert.ok(messages.some(m=>m.type===type),'missing '+type+' after reload');
  const view=messages.find(m=>m.type==='view');assert.deepEqual(view.center,[45.55,-122.71]);assert.equal(view.zoom,14.25);assert.equal(view.pitch,0);
 }finally{await page.close();}
});
test('healthy map visits reset the consecutive recovery budget, while a boot loop is bounded',{timeout:60000},async()=>{
 const page=await browser.newPage();try{
  await page.clock.install();await page.goto(base);await boot(page);
  for(let i=0;i<4;i++){
   await page.clock.fastForward(31000);
   const old=child(page);await old.evaluate(()=>window.__mapzStartup.fatal('injected graphics failure'));
   await page.waitForFunction(attempt=>new URL(document.querySelector('iframe').src).searchParams.get('attempt')===String(attempt),i+1);
   await boot(page);
  }
  await page.evaluate(()=>window.__failBoot=true);
  await child(page).evaluate(()=>window.__mapzStartup.fatal('injected graphics failure'));
  await page.getByRole('alert').waitFor();
  assert.match(await page.getByRole('alert').textContent(),/couldn’t load/);
  await page.evaluate(()=>window.__failBoot=false);
  await page.getByRole('button',{name:'Reload map'}).click();await boot(page);
 }finally{await page.close();}
});
test('hidden Mapz defers recovery until the room returns',{timeout:30000},async()=>{
 const page=await browser.newPage();try{
  await page.goto(base);await boot(page);const before=await page.locator('iframe').getAttribute('src');
  await page.evaluate(()=>setActive(false));
  await child(page).evaluate(()=>window.__mapzStartup.fatal('injected hidden failure'));
  assert.equal(await page.locator('iframe').getAttribute('src'),before);
  await page.evaluate(()=>setActive(true));
  await page.waitForFunction(before=>document.querySelector('iframe').getAttribute('src')!==before,before);await boot(page);
 }finally{await page.close();}
});
