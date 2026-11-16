// Local component fixtures only: the existing landscape is a test input,
// not a new photo assignment to any organization or a production data change.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import Module from 'node:module';
import path from 'node:path';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {chromium} from 'playwright';

const root=process.cwd(),out=path.resolve('.local/scenez-photo-logo-check');await mkdir(out,{recursive:true});
const code=await build({entryPoints:['client/src/components/scenez/SceneCardFace.tsx'],bundle:true,write:false,platform:'node',format:'cjs',packages:'external',jsx:'automatic'});
const mod=new Module(path.resolve('scene-browser-check.cjs'));mod.filename=path.resolve('scene-browser-check.cjs');mod.paths=Module._nodeModulePaths(root);mod._compile(code.outputFiles[0].text,mod.filename);
const {Art,Closed}=mod.exports;
const sheets=['scenezNative.css','nativeOverrides.css','sceneReference.css','sceneExpandedViewport.css'];
const css=await build({stdin:{contents:sheets.map(f=>`@import "./client/src/components/scenez/${f}";`).join('\n'),resolveDir:root,loader:'css'},bundle:true,write:false,plugins:[{name:'local-css',setup(b){b.onResolve({filter:/.*/},a=>a.kind==='url-token'?{path:a.path,external:true}:undefined);b.onResolve({filter:/^@\//},a=>({path:path.resolve('client/src',a.path.slice(2))}));}}]});
await writeFile(path.join(out,'fixture.css'),css.outputFiles[0].contents);
const cases=[];
for(const size of ['small','tall','square','wide-map','expanded'])for(const photo of [false,true])for(const logo of [false,true]){
 const id=`${size}-photo${Number(photo)}-logo${Number(logo)}`;
 const c={id:'fixture',page:'scenez',name:'Component test',kind:'Organization',short:'Fixture only',wordmark:'Fallback name',color:'#ffffff',image:photo?'/outzide-map/assets/photos/dayuse-or-smith-rock-state-park-640.webp':undefined,logo:logo?'/directory-logos/bearracuda-white.svg':undefined};
 const face=size==='expanded'?createElement('article',{className:'pz-card pz-card--expanded'},createElement(Art,{c})):createElement(Closed,{c,size,open:()=>{},toggle:()=>{}});
 cases.push({id,size,photo,logo,html:renderToStaticMarkup(face)});
}
const fonts="@font-face{font-family:Barlow;src:url('/__fonts/barlow-latin-400-normal.woff2')}@font-face{font-family:'Barlow Condensed';font-weight:800;src:url('/__fonts/barlow-condensed-latin-800-normal.woff2')}";
const html=`<!doctype html><link rel="stylesheet" href="/fixture.css"><style>${fonts}body{background:#101418;margin:24px}.case{margin:20px 0 40px;width:max-content}label{display:block;color:white;font:14px sans-serif;margin-bottom:10px}</style><main class="scenez-native">${cases.map(c=>`<section class="case" id="${c.id}"><label>${c.id} / test fixture</label>${c.html}</section>`).join('')}</main>`;
await writeFile(path.join(out,'fixture.html'),html);
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');const f=url.pathname.startsWith('/__fonts/')?path.resolve('node_modules/@fontsource',url.pathname.includes('condensed')?'barlow-condensed':'barlow','files',path.basename(url.pathname)):url.pathname==='/'?path.join(out,'fixture.html'):url.pathname==='/fixture.css'?path.join(out,'fixture.css'):path.resolve('client/public','.'+decodeURIComponent(url.pathname));if(!f.startsWith(out)&&!f.startsWith(path.resolve('node_modules/@fontsource')+path.sep)&&!f.startsWith(path.resolve('client/public')+path.sep)){res.writeHead(403).end();return}const mime={'.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'};res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.end(await readFile(f));}catch{res.writeHead(404).end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const results=[];
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:1200},reducedMotion:'reduce'});await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.evaluate(()=>document.fonts.ready);await page.locator('img').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));
  for(const c of cases){
   const card=page.locator(`#${c.id} article`);await card.scrollIntoViewIfNeeded();
   const result=await card.evaluate(e=>{const logo=e.querySelector('.scene-logo'),photo=e.querySelector('.landscape'),trace=e.querySelector('.traces');const z=x=>x?Number.parseInt(getComputedStyle(x).zIndex)||0:null;const identity=e.querySelector('.pz-content');const logoBottom=logo?.getBoundingClientRect().bottom,identityTop=identity?.getBoundingClientRect().top;return {logo:!!logo,photo:!!photo,wordmark:!!e.querySelector('.scene-wordmark'),logoZ:z(logo),photoZ:z(photo),traceZ:z(trace),logoBottom,identityTop,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}});
   assert.equal(result.logo,c.logo);assert.equal(result.photo,c.photo);assert.equal(result.wordmark,!c.photo&&!c.logo);
   if(c.photo&&c.logo){assert.ok(result.logoZ>result.photoZ&&result.logoZ>result.traceZ);if(c.size==='square')assert.ok(result.logoBottom<=result.identityTop,'square photo logo stays above identity');}
   await card.screenshot({path:path.join(out,`${width}-${c.id}.png`)});results.push({viewport:width,...c,html:undefined,...result});
  }
  await page.close();
 }
 await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log(`PASS ${results.length} browser cases; evidence: ${out}`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
