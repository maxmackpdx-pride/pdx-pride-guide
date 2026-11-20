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
    INSERT INTO users VALUES(1),(2),(3),(4),(5),(6),(7);
    INSERT INTO events VALUES(10),(11);
    CREATE TABLE attendances(event_id INTEGER,user_id INTEGER,is_active INTEGER,expires_at TEXT);
    INSERT INTO attendances VALUES(10,3,1,NULL),(10,4,1,NULL),(10,5,1,NULL),(10,6,0,NULL);
  `);
  let visible=true, simulateOffline=false;
  const users=[1,2,3,4,5,6,7].map(id=>({id,username:`member${id}`,status:"active"}));
  const push = [3,4,5,6,7].map(id => ({id,userId:id,endpoint:"fixture",auth:"test",p256dh:"test"}));
  const sent:number[]=[];
  const storage = {
    getUserById:(id:number)=>users.find(x=>x.id===id),getUserByUsername:(name:string)=>users.find(x=>x.username===name),
    isPrimarySiteOwner:(user:{id:number})=>user.id===1,getAllActivePushSubscriptions:()=>push,
    isMemberInteractionBlocked:(_:number,id:number)=>id===5,getFollowerUserIds:()=>[3,4,5],
    getNotificationPrefs:(id:number)=>({my_events:id!==4,account:true}),
    isUserEventHost:(event:number,user:number)=>event===10 && user===2,
    getEvent:(id:number)=>({id,status:"LIVE",isPublic:visible,isPrivate:false}),
    touchPushSubscription:()=>{},deactivatePushSubscription:()=>{},
  } as unknown as IStorage;
  const app=express();app.use(express.json());
  const ops=registerHostPush(app,db,storage,(req,res,next)=>{
    req.session={userId:Number(req.header("fixture-viewer"))} as typeof req.session;next();
  },()=>false,()=>false,{configured:()=>true,send:async sub=>{if(simulateOffline) return {ok:false,gone:false};sent.push((sub as {id:number}).id);return {ok:true,gone:false};}});
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
});
