import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import type { AddressInfo } from "node:net";
import express from "express";

test("the inbox honors housing consent for replies, typing and reactions", async t => {
  process.env.DATABASE_PATH=":memory:";
  process.env.LOCAL_PREVIEW="1";
  process.env.DISABLE_MAP_BACKFILL="1";
  process.env.NODE_ENV="test";
  const { storage,sqlite }=await import("../storage");
  const { registerRoutes }=await import("../routes");
  const { createHousingPost }=await import("./store");
  const app=express();
  app.use(express.json());
  const server=createServer(app);
  registerRoutes(server,app);
  await new Promise<void>((resolve,reject) => {server.once("error",reject);server.listen(0,"127.0.0.1",resolve);});
  t.after(async () => {await new Promise<void>(resolve => server.close(()=>resolve()));sqlite.close();});
  const origin="http://127.0.0.1:"+(server.address() as AddressInfo).port;
  async function call(method:string,route:string,body?:object,cookie="") {
    const res=await fetch(origin+route,{method,headers:{"Content-Type":"application/json",Cookie:cookie},body:body && JSON.stringify(body)});
    return {status:res.status,json:await res.json(),cookie:res.headers.getSetCookie()[0]?.split(";")[0]};
  }
  async function member(username:string) {
    const password=randomBytes(24).toString("hex");
    const account=storage.createUser({username,email:username+"@fixture.invalid",passwordHash:password});
    const login=await call("POST","/api/auth/login",{email:account.username,password});
    assert.equal(login.status,200);
    return {id:account.id,cookie:login.cookie!};
  }
  const lead=await member("consentlead"), requester=await member("consentrequester"), stranger=await member("consentoutsider");
  const postId=createHousingPost(sqlite,{userId:lead.id,type:"FORMING",headline:"Fixture house",seeking:2});
  const submitted=await call("POST","/api/housing/"+postId+"/request",{kind:"CHAT"},requester.cookie);
  assert.equal(submitted.status,200);
  const thread="/api/messages/thread/"+submitted.json.request.threadId;
  const messages=await call("GET",thread,undefined,lead.cookie);
  const reaction="/api/messages/"+messages.json.messages[0].id+"/reactions";
  assert.equal((await call("POST",thread+"/reply",{body:"Before consent"},stranger.cookie)).status,404);
  for (const actor of [lead,requester]) {
    assert.equal((await call("POST",thread+"/reply",{body:"Before consent"},actor.cookie)).status,409);
    assert.equal((await call("POST",thread+"/typing",{active:true},actor.cookie)).status,409);
    assert.equal((await call("POST",reaction,{emoji:"heart"},actor.cookie)).status,409);
    assert.deepEqual((await call("GET",thread+"/typing",undefined,actor.cookie)).json,{active:false});
  }
  const accepted=await call("POST","/api/housing/requests/"+submitted.json.request.id+"/accept",{},lead.cookie);
  assert.equal(accepted.json.kind,"CHAT");
  assert.equal((await call("POST",thread+"/reply",{body:"Thank you"},requester.cookie)).status,200);
  assert.equal((await call("POST",thread+"/typing",{active:true},lead.cookie)).status,200);
  assert.deepEqual((await call("GET",thread+"/typing",undefined,requester.cookie)).json,{active:true});
  assert.equal((await call("POST",reaction,{emoji:"heart"},requester.cookie)).status,200);
});
