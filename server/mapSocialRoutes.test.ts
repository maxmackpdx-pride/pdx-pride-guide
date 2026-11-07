import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createServer} from 'node:http';
import express from 'express';
import session from 'express-session';
import {registerMapSocialRoutes} from './mapSocialRoutes';

async function setup(){
 const db=new DatabaseSync(':memory:');
 const users=new Map([[7,{id:7,status:'active'}],[8,{id:8,status:'active'}]]);
 const sessions=new session.MemoryStore();
 const app=express();app.use(express.json());app.use(session({secret:'only-local-test-session-secret',store:sessions,resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:'lax'}}));
 // Local harness only: production sign-in remains the site's existing auth API.
 app.post('/_test/login',(req,res)=>{req.session.userId=req.body.userId;req.session.save(()=>res.json({ok:true}));});
 registerMapSocialRoutes(app,{db:db as any,getUserById:id=>users.get(id)});
 const server=createServer(app);await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${(server.address() as any).port}`;let cookie='';
 const call=async(path:string,options:{method?:string;body?:any;origin?:string;headers?:Record<string,string>}={})=>{
  const res=await fetch(base+path,{method:options.method??'GET',headers:{...(cookie?{Cookie:cookie}:{}),...(options.body===undefined?{}:{'Content-Type':'application/json'}),...(options.origin===undefined?{}:{Origin:options.origin==='self'?base:options.origin}),...options.headers},...(options.body===undefined?{}:{body:JSON.stringify(options.body)})});
  const set=res.headers.get('set-cookie');if(set)cookie=set.split(';')[0];return res;
 };
 return {db,users,call,base,sessions,close:async()=>{await new Promise<void>(r=>server.close(()=>r()));db.close();}};
}
const consent='/api/maps/v1/zaydark/consent',profiles='/api/maps/v1/social/zaydark';
test('anonymous gate leaks no profiles and every status is no-store; public demo remains labeled',async()=>{
 const h=await setup();try{
  const state=await h.call(consent);assert.deepEqual(await state.json(),{signedIn:false,adultOptIn:false});
  const blocked=await h.call(profiles,{headers:{'x-adult-confirmed':'true'}});assert.equal(blocked.status,403);assert.equal(blocked.headers.get('cache-control'),'private, no-store');assert.doesNotMatch(await blocked.text(),/Alex Demo|profiles|albums/);
  const afterz=await h.call('/api/maps/v1/social/afterz');assert.equal(afterz.status,200);const payload=await afterz.json();assert.match(payload.demoLabel,/FICTIONAL DEMO/);assert.equal(payload.content.gatherings.length,4);assert.ok(payload.content.gatherings.every((g:any)=>g.schedule.kind==='fictional-demo-night'&&!('startAt'in g)&&!('address'in g)));
  const missing=await h.call('/api/maps/v1/social/nope');assert.equal(missing.status,404);assert.equal(missing.headers.get('cache-control'),'private, no-store');
 }finally{await h.close();}
});
test('strict explicit consent requires actual account and exact same origin, then is persisted before response',async()=>{
 const h=await setup();try{
  assert.equal((await h.call(consent,{method:'POST',body:{confirmed18:true},origin:'self'})).status,401);
  await h.call('/_test/login',{method:'POST',body:{userId:7}});
  for(const options of [{origin:'https://other.example',body:{confirmed18:true}},{body:{confirmed18:true}},{origin:'self',body:{confirmed18:'true'}},{origin:'self',body:{confirmed18:false}}]){
   const denied=await h.call(consent,{method:'POST',...options});assert.ok([400,403].includes(denied.status));assert.equal(denied.headers.get('cache-control'),'private, no-store');
  }
  assert.deepEqual(await (await h.call(consent)).json(),{signedIn:true,adultOptIn:false});
  const accepted=await h.call(consent,{method:'POST',body:{confirmed18:true},origin:'self'});assert.equal(accepted.status,200);assert.deepEqual(await accepted.json(),{signedIn:true,adultOptIn:true});
  // New HTTP request reads the saved server session, not a local request flag.
  assert.deepEqual(await (await h.call(consent)).json(),{signedIn:true,adultOptIn:true});
  const content=await (await h.call(profiles)).json();assert.equal(content.content.profiles.length,16);assert.equal(content.content.mapDemos.length,4);assert.equal(content.adultGateRequired,true);
 }finally{await h.close();}
});
test('changing account, suspension and deletion revoke stale user-bound consent',async()=>{
 const h=await setup();try{
  const accept=async(id:number)=>{await h.call('/_test/login',{method:'POST',body:{userId:id}});return h.call(consent,{method:'POST',body:{confirmed18:true},origin:'self'});};
  await accept(7);await h.call('/_test/login',{method:'POST',body:{userId:8}});
  assert.deepEqual(await (await h.call(consent)).json(),{signedIn:true,adultOptIn:false});assert.equal((await h.call(profiles)).status,403);
  await accept(8);h.users.get(8)!.status='suspended';assert.deepEqual(await (await h.call(consent)).json(),{signedIn:false,adultOptIn:false});assert.equal((await h.call(profiles)).status,403);
  h.users.get(8)!.status='active';await accept(8);h.users.delete(8);assert.equal((await h.call(profiles)).status,403);assert.deepEqual(await (await h.call(consent)).json(),{signedIn:false,adultOptIn:false});
 }finally{await h.close();}
});
test('post-seed malformed/private content fails closed without exposing its payload',async()=>{
 const h=await setup();try{
  const row=h.db.prepare("SELECT payload FROM map_social_content WHERE mode='afterz'").get() as {payload:string};const value=JSON.parse(row.payload);value.content.gatherings[0].address='not allowed';h.db.prepare("UPDATE map_social_content SET payload=? WHERE mode='afterz'").run(JSON.stringify(value));
  const res=await h.call('/api/maps/v1/social/afterz');assert.equal(res.status,503);assert.doesNotMatch(await res.text(),/not allowed|address|Snacks/);
 }finally{await h.close();}
});
test('a mis-keyed ZayDark data row can never leak through the public Afterz endpoint',async()=>{
 const h=await setup();try{
  const row=h.db.prepare("SELECT payload FROM map_social_content WHERE mode='zaydark'").get() as {payload:string};
  h.db.prepare("UPDATE map_social_content SET payload=? WHERE mode='afterz'").run(row.payload);
  const res=await h.call('/api/maps/v1/social/afterz');assert.equal(res.status,503);assert.doesNotMatch(await res.text(),/profiles|Alex Demo|albums/);
 }finally{await h.close();}
});
