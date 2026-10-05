import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {brotliDecompressSync,gunzipSync,brotliCompressSync,gzipSync} from 'node:zlib';
import express from 'express';
import {mapzPrecompressed} from '../server/mapzStatic.ts';

test('map delivery negotiates lossless Brotli/gzip and preserves identity fallback',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'mapz-delivery-'));
 const url='/assets/mapz-0123456789abcdef/models/test_lat45.52280_lon-122.67620.glb',file=path.join(root,url),bytes=Buffer.from('glTF unchanged geometry '.repeat(50));
 fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);fs.writeFileSync(file+'.br',brotliCompressSync(bytes));fs.writeFileSync(file+'.gz',gzipSync(bytes));
 const app=express();app.use(mapzPrecompressed(root));app.use(express.static(root));
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
 const base=`http://127.0.0.1:${server.address().port}`;
 try{
  for(const [accept,expected] of [['br, gzip','br'],['gzip','gzip'],['br;q=0, gzip;q=0','identity']]){
   const response=await fetch(base+url,{headers:{'Accept-Encoding':accept}});
   assert.equal(response.status,200);assert.equal(response.headers.get('content-encoding'),expected==='identity'?null:expected);
   assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes);
   if(expected!=='identity')assert.match(response.headers.get('cache-control'),/immutable/);
   assert.match(response.headers.get('vary'),/Accept-Encoding/i);
  }
  assert.equal((await fetch(base+'/assets/mapz-0123456789abcdef/missing.js')).status,404);
 }finally{await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true});}
});

test('built Mapz uses one canonical module, exact preload URLs, and lossless models',()=>{
 const root='dist/public';const {base,assets}=JSON.parse(fs.readFileSync(path.join(root,'mapz-manifest.json')));
 const html=fs.readFileSync(path.join(root,'mapz-map/index.html'),'utf8');
 assert.equal((html.match(/<script type="module"/g)||[]).length,1);
 assert.ok(html.includes(`rel="modulepreload" href="${assets.script}"`));
 for(const value of Object.values(assets))assert.ok(html.includes(value));
 assert.ok(!html.includes('river-flight.js'));assert.ok(!html.includes('mapz-roof-boot.js'));
 const bundle=fs.readFileSync(path.join(root,assets.script),'utf8');assert.ok(!/from\s*["']\.\.?\//.test(bundle));
 function verify(relative){for(const entry of fs.readdirSync(path.join('client/public/mapz-map',relative),{withFileTypes:true})){const name=path.join(relative,entry.name);if(entry.isDirectory())verify(name);else{const source=fs.readFileSync(path.join('client/public/mapz-map',name)),built=fs.readFileSync(path.join(root,base,name));assert.deepEqual(built,source);if(name.endsWith('.glb')){assert.deepEqual(brotliDecompressSync(fs.readFileSync(path.join(root,base,name+'.br'))),source);assert.deepEqual(gunzipSync(fs.readFileSync(path.join(root,base,name+'.gz'))),source);}}}}
 verify('models');
});
