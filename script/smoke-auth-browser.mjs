import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium, webkit } from 'playwright';

// Exercise the real auth provider and query client in a browser, with isolated
// HTTP fixtures. No app database or real account is read or changed.
const html = `<!doctype html><html><body><div id="root"></div><script type="module">
import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '/src/context/AuthContext.tsx';
import { queryClient } from '/src/lib/queryClient.ts';
import { Toaster } from '/src/components/ui/toaster.tsx';
const h = React.createElement;
function Probe() {
 const auth = useAuth();
 const [draft, setDraft] = React.useState('');
 const messages = useQuery({queryKey:['/api/messages/inbox'], enabled:!!auth.user});
 const late = useQuery({queryKey:['/api/late'], enabled:!!auth.user});
 return h('main', null,
  h('output',{id:'identity'},auth.user?.username || 'anonymous'),
  h('output',{id:'messages'},JSON.stringify(messages.data || [])),
  h('output',{id:'late'},JSON.stringify(late.data || [])),
  h('input',{id:'draft',value:draft,onChange:e=>setDraft(e.target.value)}),
  ...['A','B'].map(name=>h('button',{id:'login'+name,onClick:()=>auth.login(name,'fixture').catch(()=>{})},'Login '+name)),
  h('button',{id:'logout',onClick:()=>auth.logout().catch(()=>{})},'Sign out'),
  h(Toaster));
}
createRoot(document.getElementById('root')).render(h(QueryClientProvider,{client:queryClient},h(AuthProvider,null,h(Probe))));
</script></body></html>`;
const server = await createServer({
 server: { host:'127.0.0.1',port:0 },
 plugins: [{name:'auth-browser-fixture',configureServer(server) {
  server.middlewares.use('/__auth-check', async (_req,res,next)=>{
   try { res.setHeader('Content-Type','text/html'); res.end(await server.transformIndexHtml('/__auth-check',html)); } catch(e) { next(e); }
  });
 }}],
});
await server.listen();
const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
try {
 for (const [name, engine] of [['chromium',chromium],['webkit',webkit]]) {
  if (process.env.BROWSER && process.env.BROWSER !== name) continue;
  const browser = await engine.launch({headless:true, ...(name === 'chromium' && process.env.CHROME_CHANNEL ? {channel:process.env.CHROME_CHANNEL} : {})});
  try {
   const page = await browser.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   let account=null, failLogout=false, networkLogout=false;
   let releaseLate;
   const lateReady = new Promise(resolve=>{releaseLate=resolve;});
   await page.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    const reply=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
    if(path==='/api/auth/login') {account=route.request().postDataJSON().email;return reply({id:account==='A'?101:202,username:account});}
    if(path==='/api/auth/me') return account?reply({id:account==='A'?101:202,username:account}):reply({error:'unauthorized'},401);
    if(path==='/api/auth/logout') {
     if(networkLogout)return route.abort('failed');
     if(failLogout)return reply({error:'failure'},500);
     account=null;return reply({ok:true});
    }
    if(path==='/api/messages/inbox')return reply([account+' private message']);
    if(path==='/api/late') {const owner=account;if(owner==='A')await lateReady;return reply([owner+' late message']).catch(()=>{});}
    return reply({});
   });
   await page.goto(origin+'/__auth-check');
   await page.locator('#loginA').click();
   await page.waitForFunction(()=>document.querySelector('#messages')?.textContent.includes('A private'));
   await page.locator('#draft').fill('A private draft');
   // Identity change while A's request is outstanding must reset data + local state.
   await page.locator('#loginB').click();
   await page.waitForFunction(()=>document.querySelector('#messages')?.textContent.includes('B private'));
   releaseLate();
   await page.waitForFunction(()=>document.querySelector('#late')?.textContent.includes('B late'));
   assert.equal(await page.locator('#draft').inputValue(),'');
   assert.equal((await page.locator('main').innerText()).includes('A private'),false);
   for (const failure of ['http','network']) {
    failLogout=failure==='http';networkLogout=failure==='network';
    await page.locator('#logout').click();
    await page.getByText('Could not sign out',{exact:true}).waitFor();
    assert.equal(await page.locator('#identity').textContent(),'B');
    assert.match(await page.locator('#messages').textContent(),/B private/);
   }
   failLogout=false;networkLogout=false;
   await page.locator('#logout').click();
   await page.waitForFunction(()=>document.querySelector('#identity')?.textContent==='anonymous');
   assert.equal(await page.locator('#messages').textContent(),'[]');
   await page.locator('#loginA').click();
   await page.waitForFunction(()=>document.querySelector('#messages')?.textContent.includes('A private'));
   assert.equal(errors.length,0,errors.join('\n'));
   console.log(name+': account switch, late response, draft reset, failed logout, successful logout, re-login PASS');
  } finally { await browser.close(); }
 }
} finally { await server.close(); }
