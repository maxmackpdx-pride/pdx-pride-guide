import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import Database from "better-sqlite3";
import type { AddressInfo } from "node:net";
import type { IStorage } from "./storage";
import { registerHostPush } from "./hostPush";

test("host push enforces audience, consent, permissions, tier, cooldown and request idempotency",async t => {
  const db = new Database(":memory:");
  t.after(() => db.close());
  db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY);
    CREATE TABLE events(id INTEGER PRIMARY KEY);
    CREATE TABLE follows(following_user_id INTEGER, follower_user_id INTEGER);
    INSERT INTO follows VALUES(2,3),(2,4),(2,5);
    INSERT INTO users VALUES(1),(2),(3),(4),(5),(6),(7);
    INSERT INTO events VALUES(10),(11);
    CREATE TABLE attendances(event_id INTEGER,user_id INTEGER,is_active INTEGER,expires_at TEXT);
    INSERT INTO attendances VALUES(10,3,1,NULL),(10,4,1,NULL),(10,5,1,NULL),(10,6,0,NULL);
  `);
  let visible=true, simulateOffline=false, loseReply=false, touchFails=false;
  let pauseSend: Promise<void> | null = null, attempts=0;
  const users=[1,2,3,4,5,6,7].map(id=>({id,username:`member${id}`,status:"active"}));
  const push = [3,4,5,6,7].map(id => ({id,userId:id,endpoint:"fixture",auth:"test",p256dh:"test"}));
  const sent:number[]=[];
  const storage = {
    getUserById:(id:number)=>users.find(x=>x.id===id),getUserByUsername:(name:string)=>users.find(x=>x.username===name),
    isPrimarySiteOwner:(user:{id:number})=>user.id===1,getAllActivePushSubscriptions:()=>push,
    getActivePushSubscriptions:(id:number)=>push.filter(s=>s.userId===id),
    isMemberInteractionBlocked:(_:number,id:number)=>id===5,getFollowerUserIds:(id:number)=>db.prepare("SELECT follower_user_id FROM follows WHERE following_user_id=?").pluck().all(id),
    getNotificationPrefs:(id:number)=>({my_events:id!==4,account:true}),
    isUserEventHost:(event:number,user:number)=>event===10 && user===2,
    getEvent:(id:number)=>({id,status:"LIVE",isPublic:visible,isPrivate:false}),
    touchPushSubscription:()=>{if(touchFails) throw Error("Simulated accounting interruption");},deactivatePushSubscription:()=>{},
  } as unknown as IStorage;
  const app=express();app.use(express.json());
  const ops=registerHostPush(app,db,storage,(req,res,next)=>{
    req.session={userId:Number(req.header("fixture-viewer"))} as typeof req.session;next();
  },()=>false,()=>false,{configured:()=>true,send:async sub=>{attempts++; if(simulateOffline) return {ok:false,gone:false,statusCode:429};
    if (pauseSend) await pauseSend;
    sent.push((sub as {id:number}).id);
    if (loseReply) throw Error("Provider reply lost");
    return {ok:true,gone:false,statusCode:201};}});
  const http=app.listen(0,"127.0.0.1");await new Promise(resolve=>http.once("listening",resolve));
  t.after(()=>new Promise<void>(resolve=>http.close(()=>resolve())));
  const url=`http://127.0.0.1:${(http.address() as AddressInfo).port}/api/hub/push`;
  const req=async (id:number,method="GET",suffix="",body?:unknown)=>{
    const r=await fetch(url+suffix,{method,headers:{"Content-Type":"application/json","fixture-viewer":String(id)},body:body ? JSON.stringify(body):undefined});
    return {status:r.status,data:await r.json().catch(()=>null)};
  };
  const message=(audience:string,eventId?:number)=>({audience,eventId,requestKey:crypto.randomUUID(),title:"Doors",body:"9 pm"});
  assert.equal((await req(7)).data.allowed,false);
  assert.equal((await req(7,"PUT","/access",{tier:"paid",username:"member7"})).status,403);
  await req(1,"PUT","/access",{tier:"standard",username:"member2"});
  const before=(await req(2,"GET","?eventId=10")).data;
  assert.equal(before.tier,"standard");
  assert.equal(before.audiences.find((a:{key:string})=>a.key==="followers").reachable,1);
  assert.equal(before.audiences.find((a:{key:string})=>a.key==="rsvps").reachable,1);
  assert.equal((await req(2,"POST","",message("everyone"))).status,403);
  assert.equal((await req(2,"POST","",message("rsvps",11))).status,403);
  for (const body of ["Doors at nine!", "The night is called off", "   "]) {
    assert.equal((await req(2,"POST","",{...message("followers"),body})).status,400);
  }
  const first=message("followers");
  const result=await req(2,"POST","",first);
  assert.equal(result.status,202);
  assert.equal((await req(2,"POST","",first)).data.id,result.data.id);
  assert.equal((await req(2,"POST","",message("followers"))).status,429);
  assert.equal((await req(7,"GET",`/${result.data.id}/receipt`)).status,404);
  assert.equal((await req(2,"POST","",message("rsvps",10))).status,202);
  assert.equal((await req(2,"POST","",message("rsvps",10))).status,429);
  await req(1,"PUT","/access",{tier:"paid",username:"member2"});
  assert.equal((await req(2)).data.tier,"paid");
  assert.equal((await req(2,"POST","",message("rsvps",10))).status,202);
  assert.equal((await req(2,"POST","",message("rsvps",10))).status,202);
  assert.equal((await req(2,"POST","",message("rsvps",10))).status,429);
  await ops.drain();
  assert.deepEqual(sent,[3,3,3,3]);
  assert.equal((await req(2,"GET",`/${result.data.id}/receipt`)).data.sent,1);
  assert.equal((await req(1,"POST","",message("everyone"))).status,202);
  assert.equal((await req(1,"POST","",message("everyone"))).status,202);
  db.prepare("UPDATE host_push_campaigns SET created=created-? WHERE sender=?").run(86400000*3,2);
  assert.equal((await req(2,"POST","",message("followers"))).status,202);
  simulateOffline=true;
  const eventPush=await req(2,"POST","",message("rsvps",10));
  assert.equal(eventPush.status,202);
  visible=false;
  db.prepare("UPDATE host_push_deliveries SET lease=0 WHERE campaign=?").run(eventPush.data.id);
  assert.equal((await req(2,"GET","?eventId=10")).status,403);
  await ops.drain();
  assert.equal((await req(2,"GET",`/${eventPush.data.id}/receipt`)).data.skipped,1);
  visible=true; simulateOffline=false;
  let release!:()=>void;
  pauseSend=new Promise<void>(resolve=>{release=resolve;});
  const delayed=await req(2,"POST","",message("rsvps",10));
  assert.equal(delayed.status,202);
  const started=attempts;
  db.prepare("UPDATE host_push_deliveries SET lease=0 WHERE campaign=?").run(delayed.data.id);
  await ops.drain();
  assert.equal(attempts,started,"an expired in-flight lease cannot submit a duplicate");
  assert.equal((await req(2,"GET",`/${delayed.data.id}/receipt`)).data.unconfirmed,1);
  release();pauseSend=null;
  assert.equal((await req(2,"GET",`/${delayed.data.id}/receipt`)).data.sent,1);
  loseReply=true;
  const uncertain=await req(2,"POST","",message("rsvps",10));
  const amb=await req(2,"GET",`/${uncertain.data.id}/receipt`);
  assert.equal(amb.data.unconfirmed,1);
  assert.equal(amb.data.sent,0);
  const beforeRetry=attempts;
  await ops.drain();
  assert.equal(attempts,beforeRetry,"a lost provider reply never triggers another handoff");
  loseReply=false; touchFails=true;
  const bookkeeping=await req(1,"POST","",message("everyone"));
  await req(1,"GET",`/${bookkeeping.data.id}/receipt`);
  touchFails=false;
  const handedOff=sent.length;
  await ops.drain();
  assert.equal(sent.length-handedOff,bookkeeping.data.devices-1,"bookkeeping failure preserves the acknowledged device");
  db.prepare("UPDATE host_push_campaigns SET created=created-? WHERE sender=2").run(86400000*6);
  db.prepare("INSERT INTO follows VALUES(2,7)").run();
  push.push({...push[0],id:13});
  const distinct=(await req(2,"GET","?eventId=10")).data.audiences;
  assert.equal(distinct.find((a:{key:string})=>a.key==="followers").reachable,2);
  assert.equal(distinct.find((a:{key:string})=>a.key==="rsvps").reachable,1);
  const followers=await req(2,"POST","",message("followers"));
  const rsvps=await req(2,"POST","",message("rsvps",10));
  await ops.drain();
  const acceptedDevices=(id:number)=>db.prepare("SELECT device FROM host_push_deliveries WHERE campaign=? AND status='sent' ORDER BY device").pluck().all(id);
  assert.deepEqual(acceptedDevices(followers.data.id),[3,7,13]);
  assert.deepEqual(acceptedDevices(rsvps.data.id),[3,13]);
  simulateOffline=true;
  const rebound=await req(1,"POST","",message("everyone"));
  await req(1,"GET",`/${rebound.data.id}/receipt`);
  push.find(sub=>sub.id===13)!.userId=7;
  simulateOffline=false;
  db.prepare("UPDATE host_push_deliveries SET lease=0 WHERE campaign=?").run(rebound.data.id);
  await ops.drain();
  assert.equal((await req(1,"GET",`/${rebound.data.id}/receipt`)).data.skipped,1);
  assert.ok(!acceptedDevices(rebound.data.id).includes(13),"a re-registered device cannot receive the original account's push");
});

test("upgrading prior device queues preserves settled receipts and never replays an ambiguous attempt", t => {
  const db = new Database(":memory:");
  t.after(() => db.close());
  db.exec(`
    CREATE TABLE users(id INTEGER PRIMARY KEY);
    CREATE TABLE events(id INTEGER PRIMARY KEY);
    CREATE TABLE host_push_campaigns(id INTEGER PRIMARY KEY,sender INTEGER,audience TEXT,event_id INTEGER,title TEXT,body TEXT,created INTEGER,request_key TEXT);
    CREATE TABLE host_push_deliveries(campaign INTEGER,device INTEGER,status TEXT,lease INTEGER,attempts INTEGER,PRIMARY KEY(campaign,device));
    CREATE TABLE push_subscriptions(id INTEGER,user_id INTEGER,active INTEGER,last_used_at TEXT);
    INSERT INTO host_push_campaigns VALUES(1,1,'followers',NULL,'A','B',1740787200000,'x');
    INSERT INTO host_push_deliveries VALUES(1,1,'queued',0,1),(1,2,'queued',0,0),(1,3,'queued',0,0),(1,4,'sent',0,1);
    INSERT INTO push_subscriptions VALUES(1,9,1,'2025-01-01'),(2,8,1,'2025-01-01'),(3,7,1,'2025-04-01');
  `);
  const init = () => registerHostPush(express(),db,{} as IStorage,(_req,_res,next)=>next(),()=>false,()=>false);
  init();
  init();
  assert.deepEqual(db.prepare("SELECT device,status,recipient FROM host_push_deliveries ORDER BY device").raw().all(),[
    [1,"unconfirmed",null],[2,"queued",8],[3,"skipped",null],[4,"sent",null],
  ]);
});
