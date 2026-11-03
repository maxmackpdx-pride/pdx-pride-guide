import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import express from 'express';
import { createServer } from 'node:http';
import { createPosterVariantProcessor, registerPosterVariants } from './posterVariants';

async function setup() {
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'poster-forward-')),uploadsDir=path.join(dir,'uploads'),publicDir=path.join(dir,'public'),outputDir=path.join(dir,'derivatives');
 await fs.mkdir(uploadsDir);await fs.mkdir(publicDir);const db=new Database(path.join(dir,'data.db'));
 db.exec('CREATE TABLE events(id INTEGER PRIMARY KEY,poster_image_url TEXT,status TEXT,is_public INTEGER,is_private INTEGER)');
 const image=await sharp({create:{width:1500,height:1800,channels:3,background:'#773355'}}).png().toBuffer();await fs.writeFile(path.join(uploadsDir,'new.png'),image);
 const add=(id:number,source='/uploads/new.png',status='LIVE',pub=1,priv=0)=>db.prepare('INSERT INTO events VALUES(?,?,?,?,?)').run(id,source,status,pub,priv);
 const options={uploadsDir,publicDir,outputDir};return {db,dir,options,add,close:async()=>{db.close();await fs.rm(dir,{recursive:true,force:true});}};
}
test('forward only; new public poster ready, original preserved, replacement invalidates and persisted queue resumes',async()=>{
 const x=await setup();try{
 x.add(1);let processor=createPosterVariantProcessor(x.db,x.options);x.db.exec("UPDATE events SET poster_image_url='/uploads/new.png',status='LIVE' WHERE id=1");await processor.tick();assert.deepEqual(Object.keys(processor.manifest()),[],'no historical backfill');
 const before=await fs.readFile(path.join(x.options.uploadsDir,'new.png'));x.add(2);await processor.tick();let entry=processor.manifest()['/uploads/new.png'];assert.equal(entry.width,1500);assert.equal(entry.variants.length,2);assert.ok(processor.canServe(path.basename(entry.variants[0].src)));
 assert.deepEqual(await fs.readFile(path.join(x.options.uploadsDir,'new.png')),before);
 const count=(await fs.readdir(x.options.outputDir)).length;x.add(3);await processor.tick();assert.equal((await fs.readdir(x.options.outputDir)).length,count,'content deduplicated');
 x.db.prepare('UPDATE events SET poster_image_url=? WHERE id=2').run('/uploads/later.png');assert.equal((x.db.prepare('SELECT state FROM poster_variant_jobs WHERE event_id=2').get() as any).state,'pending');
 processor.stop();await fs.copyFile(path.join(x.options.uploadsDir,'new.png'),path.join(x.options.uploadsDir,'later.png'));processor=createPosterVariantProcessor(x.db,x.options);await processor.tick();assert.ok(processor.manifest()['/uploads/later.png']);
 }finally{await x.close();}
});
test('privacy is checked before work, metadata and every derivative delivery; deletion revokes',async()=>{
 const x=await setup();try{const p=createPosterVariantProcessor(x.db,x.options);x.add(1,'/uploads/new.png','HIDDEN',0,1);await p.tick();assert.deepEqual(Object.keys(p.manifest()),[]);
 x.db.exec("UPDATE events SET status='LIVE',is_public=1,is_private=0 WHERE id=1");x.db.exec('UPDATE events SET is_private=1 WHERE id=1');await p.tick();assert.equal((x.db.prepare('SELECT state FROM poster_variant_jobs').get() as any).state,'pending');
 x.db.exec('UPDATE events SET is_private=0 WHERE id=1');await p.tick();const name=path.basename(p.manifest()['/uploads/new.png'].variants[0].src);assert.ok(p.canServe(name));x.db.exec('UPDATE events SET is_private=1 WHERE id=1');assert.deepEqual(Object.keys(p.manifest()),[]);assert.equal(p.canServe(name),false);
 x.db.exec('UPDATE events SET is_private=0 WHERE id=1');await p.tick();assert.ok(p.canServe(name));x.db.exec('DELETE FROM events');assert.equal(p.canServe(name),false);
 }finally{await x.close();}
});
test('malformed, remote, symlink, small originals and failures stay safe; bounded retries',async()=>{
 const x=await setup();let now=0;try{const p=createPosterVariantProcessor(x.db,{...x.options,now:()=>now});x.add(1,'https://example.com/private.jpg');x.add(2,'/uploads/../../secret.png');await p.tick();assert.deepEqual(Object.keys(p.manifest()),[]);
 await fs.symlink('/etc/passwd',path.join(x.options.uploadsDir,'escape.png'));x.add(3,'/uploads/escape.png');x.add(4,'/uploads/missing.png');await p.tick();
 await fs.writeFile(path.join(x.options.uploadsDir,'tiny.png'),await sharp({create:{width:20,height:20,channels:3,background:'red'}}).png().toBuffer());x.add(5,'/uploads/tiny.png');await p.tick();assert.equal((x.db.prepare('SELECT state FROM poster_variant_jobs WHERE event_id=5').get() as any).state,'original');
 for(let i=0;i<8;i++){now+=180_000;await p.tick();}assert.ok((x.db.prepare('SELECT MAX(attempts) AS n FROM poster_variant_jobs').get() as any).n<=3);assert.deepEqual(Object.keys(p.manifest()),[]);assert.equal(p.canServe('../secret'),false);
 }finally{await x.close();}
});

test('HTTP metadata and image routes are no-store and revoke access after visibility change',async()=>{
 const x=await setup(),app=express(),server=createServer(app);let p: ReturnType<typeof registerPosterVariants>|undefined;
 try{
  p=registerPosterVariants(app,server,x.db,x.options.uploadsDir);await new Promise(resolve=>setImmediate(resolve));x.add(1);await p.tick();
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address() as {port:number};const base=`http://127.0.0.1:${address.port}`;
  const response=await fetch(base+'/api/poster-variants');assert.match(response.headers.get('cache-control')!,/no-store/);const manifest=await response.json();const url=manifest['/uploads/new.png'].variants[0].src;
  const image=await fetch(base+url);assert.equal(image.status,200);assert.match(image.headers.get('cache-control')!,/no-store/);assert.ok((await image.arrayBuffer()).byteLength>0);
  x.db.exec('UPDATE events SET is_private=1 WHERE id=1');const denied=await fetch(base+url);assert.equal(denied.status,404);assert.match(denied.headers.get('cache-control')!,/no-store/);assert.deepEqual(await (await fetch(base+'/api/poster-variants')).json(),{});
 }finally{p?.stop();server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));await x.close();}
});
