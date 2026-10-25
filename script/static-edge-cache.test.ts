import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {mutableStaticRevalidate,missingStaticNotFound,staticTextPrecompressed} from '../server/mapzStatic';

test('unfingerprinted card/map files revalidate; hashed assets stay immutable; missing static files 404 uncached',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'.edge-cache-'));
 for(const name of ['assets/app-abc.js','outzide-map/app.js','outzide-map/places.json','outzide-map/assets/blend-art.css','outzide-map/assets/art.png','map-foundation/title-emphasis.js']){
  const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,'x');
 }
 const app=express();
 app.use(mutableStaticRevalidate());app.use(staticTextPrecompressed(root));
 app.use('/assets',express.static(path.join(root,'assets'),{immutable:true,maxAge:'1y',fallthrough:true}));
 app.use(express.static(root));app.use(missingStaticNotFound());app.use((_req,res)=>res.type('html').send('<html>spa</html>'));
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));
 const port=(server.address() as {port:number}).port;
 const get=(url:string)=>new Promise<{status:number;headers:http.IncomingHttpHeaders;body:string}>((resolve,reject)=>{
  http.get({host:'127.0.0.1',port,path:url,headers:{'Accept-Encoding':'identity'}},res=>{let body='';res.on('data',d=>body+=d);res.on('end',()=>resolve({status:res.statusCode!,headers:res.headers,body}));}).on('error',reject);
 });
 try{
  for(const url of ['/outzide-map/app.js','/outzide-map/app.js?v=20261025','/outzide-map/places.json?v=1','/outzide-map/assets/blend-art.css?v=2','/outzide-map/assets/art.png','/map-foundation/title-emphasis.js']){
   const r=await get(url);assert.equal(r.status,200,url);assert.equal(r.headers['cache-control'],'no-cache',url);
  }
  assert.match(String((await get('/assets/app-abc.js')).headers['cache-control']),/immutable/);
  for(const url of ['/map-foundation/missing.js','/outzide-map/assets/missing.css','/outzide-map/nope.json']){
   const r=await get(url);assert.equal(r.status,404,url);assert.match(String(r.headers['cache-control']),/no-store/);assert.equal(r.headers['cdn-cache-control'],'no-store');assert.ok(!r.body.includes('spa'));
  }
  assert.equal((await get('/outzide')).body,'<html>spa</html>');
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));fs.rmSync(root,{recursive:true,force:true});}
});
