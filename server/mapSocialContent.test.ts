import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import express from 'express';
import { DatabaseSync as Database } from 'node:sqlite';
import { assertSafeSeed, createMapSocialContentStore, registerMapSocialContentRoutes, type ContentEnvelope } from './mapSocialContent';
const seed = (mode:string) => JSON.parse(readFileSync(new URL(`./data/maps/${mode}.json`, import.meta.url),'utf8')) as ContentEnvelope;

test('migrates the existing four Afterz and sixteen ZayDark fixtures without addresses or old dates', () => {
  const a=seed('afterz'), z=seed('zaydark'); assertSafeSeed(a); assertSafeSeed(z);
  assert.equal(a.content.gatherings.length,4); assert.equal(z.content.profiles.length,16);
  assert.equal(a.content.gatherings[0].title,'Demo: Snacks and quiet music');
  const text=JSON.stringify([a,z]);
  assert.doesNotMatch(text,/2323|97215|87215|fictionalAddress|"address"|2026-11-06|2026-11-07/);
  assert.equal(a.content.gatherings[0].schedule.startLocal,'22:30');
});
test('idempotent seeding does not overwrite content edits; reads updates without rebuilding', () => {
  const db=new Database(':memory:'); const a=seed('afterz'), z=seed('zaydark');
  const store=createMapSocialContentStore(db,[a,z]);
  a.revision=2; a.content.gatherings[0].description='Updated fictional demo content';
  db.prepare('UPDATE map_social_content SET revision=?,payload=? WHERE mode=?').run(2,JSON.stringify(a),'afterz');
  createMapSocialContentStore(db,[seed('afterz'),z]);
  assert.equal(store.read('afterz')?.revision,2);
  assert.equal(store.read('afterz')?.content.gatherings[0].description,'Updated fictional demo content'); db.close();
});
test('privacy, adult and visible fixture-label safeguards fail closed', () => {
  for (const mutate of [
    (x:any)=>{x.content.gatherings[0].address='hidden street';},
    (x:any)=>{x.content.hosts[0].age=17;},
    (x:any)=>{x.demoLabel='';},
    (x:any)=>{x.content.gatherings[0].synthetic=false;},
    (x:any)=>{x.content.gatherings[0].startAt='2026-11-06T22:30:00-08:00';},
  ]) { const x=seed('afterz'); mutate(x); assert.throws(()=>assertSafeSeed(x)); }
  const z=seed('zaydark'); delete z.adultGateRequired; assert.throws(()=>assertSafeSeed(z));
});
test('API denies ZayDark without server-side adult grant and ignores client assertions', async () => {
  const db=new Database(':memory:'), app=express(); let grant=false;
  registerMapSocialContentRoutes(app,{store:createMapSocialContentStore(db,[seed('afterz'),seed('zaydark')]),hasAdultAccess:()=>grant});
  const server=app.listen(0,'127.0.0.1'); await new Promise<void>(r=>server.once('listening',r));
  const address=server.address() as {port:number}; const url=`http://127.0.0.1:${address.port}/api/maps/v1/social/`;
  try {
    let res=await fetch(url+'zaydark?adult=true',{headers:{'x-adult-confirmed':'true'}});
    assert.equal(res.status,403); const denied=await res.text(); assert.doesNotMatch(denied,/Alex Demo|profiles|album/);
    res=await fetch(url+'afterz'); assert.equal(res.status,200); assert.equal(res.headers.get('cache-control'),'private, no-store');
    grant=true; res=await fetch(url+'zaydark'); assert.equal(res.status,200); assert.equal((await res.json()).demoLabel,seed('zaydark').demoLabel);
  } finally { await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve())); db.close(); }
});
test('real content can replace demos through data only while retaining adult/privacy rules', () => {
  const db=new Database(':memory:'); const store=createMapSocialContentStore(db,[seed('zaydark')]);
  const live=seed('zaydark'); live.revision=2; live.contentKind='live'; delete live.demoLabel;
  live.content.profiles=live.content.profiles.slice(0,1).map(p=>({...p,synthetic:false,displayName:'Consenting adult launch record'}));
  live.content.albums=[]; live.content.topics=[];
  db.prepare('UPDATE map_social_content SET revision=?,payload=? WHERE mode=?').run(2,JSON.stringify(live),'zaydark');
  assert.equal(store.read('zaydark')?.contentKind,'live');
  assert.equal(store.read('zaydark')?.content.profiles[0].synthetic,false); db.close();
});
