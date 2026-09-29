import {build} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {brotliCompressSync,gzipSync} from 'node:zlib';

// Keep the authored source modules for development; production downloads one
// module, with the roof constructor patch evaluated before the renderer.
export async function prepareMapz(publicRoot:string) {
 const mapRoot=path.join(publicRoot,'zaydar-map');
 const result=await build({stdin:{contents:"import './mapz-roof-boot.js'; import './river-flight.js';",resolveDir:mapRoot,sourcefile:'boot.js'},bundle:true,write:false,format:'esm',target:'es2022',minify:true,metafile:true,
  plugins:[{name:'canonical-map-modules',setup(builder){builder.onResolve({filter:/^\./},args=>({path:path.resolve(args.resolveDir,args.path.split('?')[0])}));}}]});
 const files=new Map<string,Uint8Array>([
  ['boot.js',result.outputFiles[0].contents],
  ['maplibre.js',fs.readFileSync(path.join(publicRoot,'home-flight/vendor/maplibre-gl-5.6.2.js'))],
  ['maplibre.css',fs.readFileSync(path.join(publicRoot,'home-flight/vendor/maplibre-gl-5.6.2.css'))],
  ['contour.js',fs.readFileSync(path.join(mapRoot,'vendor/maplibre-contour-0.1.0.js'))],
  ['studio.css',fs.readFileSync(path.join(mapRoot,'studio.css'))],
  ['perf.js',fs.readFileSync(path.join(mapRoot,'mapz-perf-preload.js'))],
 ]);
 function collect(directory:string,relative:string){for(const entry of fs.readdirSync(directory,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const source=path.join(directory,entry.name),name=relative+'/'+entry.name;if(entry.isDirectory())collect(source,name);else files.set(name,fs.readFileSync(source));}}
 // import.meta.url in bundled model loaders resolves next to boot.js.
 collect(path.join(mapRoot,'models'),'models');
 collect(path.join(mapRoot,'fonts'),'fonts');
 const hash=createHash('sha256');for(const [name,bytes] of files)hash.update(name).update('\0').update(bytes);
 const base='/assets/mapz-'+hash.digest('hex').slice(0,16);
 const assets={script:base+'/boot.js',maplibre:base+'/maplibre.js',maplibreCss:base+'/maplibre.css',contour:base+'/contour.js',style:base+'/studio.css',perf:base+'/perf.js'};
 return {base,assets,inputs:Object.keys(result.metafile.inputs),write(output:string){
  for(const [name,bytes] of files){const dest=path.join(output,base,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);if(/\.(js|css|glb)$/.test(name)){fs.writeFileSync(dest+'.br',brotliCompressSync(bytes));fs.writeFileSync(dest+'.gz',gzipSync(bytes));}}
  const htmlPath=path.join(output,'zaydar-map/index.html');
  let html=fs.readFileSync(htmlPath,'utf8');
  html=html.replace(/<link rel="modulepreload"[^>]+>/g,'');
  html=html.replace(/<script type="module"[^>]+><\/script>/g,'');
  const replacements:Array<[RegExp,string]>=[[/\.\.\/home-flight\/vendor\/maplibre-gl-5\.6\.2\.js/g,assets.maplibre],[/\.\.\/home-flight\/vendor\/maplibre-gl-5\.6\.2\.css/g,assets.maplibreCss],[/\.\/vendor\/maplibre-contour-0\.1\.0\.js/g,assets.contour],[/\.\/studio\.css\?[^" ]+/g,assets.style],[/\.\/mapz-perf-preload\.js\?[^" ]+/g,assets.perf]];
  for(const [pattern,value] of replacements)html=html.replace(pattern,value);
  html=html.replace('</head>',`<link rel="modulepreload" href="${assets.script}"></head>`).replace('</body>',`<script type="module" src="${assets.script}"></script></body>`);
  fs.writeFileSync(htmlPath,html);
  fs.writeFileSync(path.join(output,'mapz-manifest.json'),JSON.stringify({base,assets}));
 }};
}
