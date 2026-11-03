/** Isolated, offline Vite fixtures for incidental-map release regression checks. */
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {chromium} from 'playwright';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const minimalStyle={version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#102030'}}]};
const blankTile=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==','base64');
export async function mapFixture(fixture,{webgl=false,mobile=false,style='',prefix='/__map-qa',define={}}={}) {
 const cacheDir=await mkdtemp(path.join(tmpdir(),'zay-incidental-map-vite-'));
 const server=await createServer({configFile:false,root,cacheDir,publicDir:path.join(root,'client/public'),optimizeDeps:{entries:[fixture],include:['react/jsx-runtime','react/jsx-dev-runtime','leaflet','react-leaflet']},plugins:[react(),{name:'map-fixture',configureServer(s){s.middlewares.use(async(req,res,next)=>{
  if(!req.url?.startsWith(prefix))return next();res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml(req.url,`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}${style}</style></head><body><div id="root"></div><script type="module" src="/${fixture}"></script></body></html>`));
 });}}],resolve:{alias:{'@':path.join(root,'client/src'),'@shared':path.join(root,'shared'),'@assets':path.join(root,'attached_assets')}},server:{host:'127.0.0.1',port:0,hmr:false,watch:null},define:{__OUTZIDE_ASSETS__:JSON.stringify({script:'/outzide-map/app.js',maplibre:'/home-flight/vendor/maplibre-gl-5.6.2.js',maplibreCss:'/home-flight/vendor/maplibre-gl-5.6.2.css'}),__MAPZ_ASSETS__:'{}',__HOME_FLIGHT_BASE__:JSON.stringify('/home-flight'),...define}});
 let browser;
 try {
  await server.listen();await server.warmupRequest(`/${fixture}`);
  browser=await chromium.launch({headless:true,args:webgl?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:['--disable-webgl']});
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:500,height:800},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1,reducedMotion:'reduce'});
  await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.hostname==='127.0.0.1')return route.continue();if(url.pathname.endsWith('/style.json'))return route.fulfill({json:minimalStyle,headers:{'access-control-allow-origin':'*'}});if(url.pathname.endsWith('.png'))return route.fulfill({contentType:'image/png',body:blankTile});return route.abort();});
  const page=await context.newPage();page.setDefaultTimeout(20000);const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  return {page,context,errors,requests,base:server.resolvedUrls.local[0],async close(){await browser.close();await server.close();await rm(cacheDir,{recursive:true,force:true});}};
 }catch(error){await browser?.close();await server.close();await rm(cacheDir,{recursive:true,force:true});throw error;}
}
export async function installListenerEvidence(context){await context.addInitScript(()=>{
 const listeners={resize:new Set(),visibilitychange:new Set()};
 for(const [target,type] of [[window,'resize'],[document,'visibilitychange']]){
  const add=target.addEventListener.bind(target),remove=target.removeEventListener.bind(target);
  target.addEventListener=(event,callback,options)=>{if(event===type)listeners[type].add(callback);return add(event,callback,options);};
  target.removeEventListener=(event,callback,options)=>{if(event===type)listeners[type].delete(callback);return remove(event,callback,options);};
 }
 window.mapListeners=listeners;
});}
export async function installContextEvidence(context){await context.addInitScript(()=>{
 window.contexts=[];const get=HTMLCanvasElement.prototype.getContext;
 HTMLCanvasElement.prototype.getContext=function(...args){const gl=get.apply(this,args);if(gl&&/^webgl/.test(args[0])&&!window.contexts.some(r=>r.canvas===this))window.contexts.push({canvas:this,gl});return gl;};
});}
export async function visibility(page,hidden){await page.evaluate(hidden=>{Object.defineProperty(document,'hidden',{configurable:true,value:hidden});document.dispatchEvent(new Event('visibilitychange'));},hidden);}
