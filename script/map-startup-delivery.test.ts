import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {brotliCompressSync,gzipSync,brotliDecompressSync,gunzipSync} from 'node:zlib';
import {staticTextPrecompressed} from '../server/mapzStatic';

test('startup static text negotiates compression without changing content or caching mutable files forever',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'map-startup-'));
 const content='export const camera = [1,2];';
 for(const name of ['assets/app-abc.js','outzide-map/app.js','outzide-map/places.json','api/private.json']){
  const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);fs.writeFileSync(file+'.br',brotliCompressSync(content));fs.writeFileSync(file+'.gz',gzipSync(content));
 }
 const app=express();app.use(staticTextPrecompressed(root));app.use(express.static(root));
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));
 const port=(server.address() as {port:number}).port;
 const request=(url:string,encoding:string,method='GET')=>new Promise<{headers:http.IncomingHttpHeaders;body:Buffer;status:number}>((resolve,reject)=>{
  const req=http.request({host:'127.0.0.1',port,path:url,method,headers:{'Accept-Encoding':encoding}},res=>{const chunks:Buffer[]=[];res.on('data',chunk=>chunks.push(chunk));res.on('end',()=>resolve({headers:res.headers,body:Buffer.concat(chunks),status:res.statusCode!}));});req.on('error',reject);req.end();
 });
 try{
  for(const [encoding,decode] of [['br',brotliDecompressSync],['gzip',gunzipSync]] as const){
   const result=await request('/assets/app-abc.js',encoding);assert.equal(result.status,200);assert.equal(result.headers['content-encoding'],encoding);assert.equal(decode(result.body).toString(),content);assert.match(String(result.headers.vary),/Accept-Encoding/);assert.match(String(result.headers['cache-control']),/immutable/);
   const mutable=await request('/outzide-map/app.js?v=boot',encoding);assert.equal(decode(mutable.body).toString(),content);assert.doesNotMatch(String(mutable.headers['cache-control']),/immutable/);
  }
  const head=await request('/outzide-map/places.json','br','HEAD');assert.equal(head.headers['content-encoding'],'br');assert.equal(head.body.length,0);
  for(const [url,encoding] of [['/assets/app-abc.js','identity'],['/api/private.json','br']]){const result=await request(url,encoding);assert.equal(result.headers['content-encoding'],undefined);assert.equal(result.body.toString(),content);}
  assert.equal((await request('/assets/missing.js','br')).status,404);
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));fs.rmSync(root,{recursive:true,force:true});}
});
