import assert from 'node:assert/strict';
import { preview } from 'vite';
import { chromium, webkit } from 'playwright';
const server=await preview({preview:{host:'127.0.0.1',port:0}});
const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
try {
 for (const [name,engine] of [['chromium',chromium],['webkit',webkit]]) {
  if(process.env.BROWSER && process.env.BROWSER!==name)continue;
  const browser=await engine.launch({headless:true,...(name==='chromium'&&process.env.CHROME_CHANNEL?{channel:process.env.CHROME_CHANNEL}:{})});
  try {
   const page=await browser.newPage({viewport:{width:1440,height:1000}});
   page.setDefaultTimeout(15000);
   page.setDefaultNavigationTimeout(15000);
   const errors=[],scripts=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(r.resourceType()==='script')scripts.push(r.url());});
   await page.addInitScript(()=>{localStorage.setItem('pdxpg_community_standards_v','2026-07-15');localStorage.setItem('pgpdx:construction-nudge:v3-zaylist','1');});
   await page.route('**/api/**',route=>{
    const path=new URL(route.request().url()).pathname;
    let data=[];let status=200;
    if(path.includes('/auth/')||path.includes('/admin/')){data={error:'unauthorized'};status=401;}
    else if(path==='/api/housing')data={posts:[]};
    else if(path.includes('unread-count'))data={count:0};
    else if(path==='/api/outz')data={places:[]};
    return route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
   });
   await page.goto(origin);
   console.log(name+': homepage loaded');
   await page.screenshot({path:`/tmp/zaylist-home-${name}.png`});
   const inbox=page.getByRole('button',{name:'Open inbox. Drag up or down to reposition.',exact:true});
   await inbox.waitFor();
   await page.waitForLoadState('networkidle');
   assert.equal(scripts.some(url=>/maplibre|html2canvas|InboxOverlay/.test(url)),false,'heavy features loaded before interaction');
   await inbox.click();
   await page.waitForFunction(()=>document.querySelector('.inbox-sheet-host')?.textContent.includes('Loading inbox')===false);
   await page.waitForLoadState('networkidle');
   assert.ok(scripts.some(url=>url.includes('InboxOverlay')),'inbox chunk was not requested');
   assert.equal(errors.length,0,errors.join('\n'));
   await page.screenshot({path:`/tmp/zaylist-inbox-${name}.png`});
   console.log(name+': production homepage loads without map/export/inbox code; inbox opens on demand PASS');
  } finally {await browser.close();}
 }
} finally {server.httpServer.closeAllConnections();await new Promise(resolve=>server.httpServer.close(resolve));}
