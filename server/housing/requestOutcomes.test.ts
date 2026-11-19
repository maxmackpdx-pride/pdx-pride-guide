import test from "node:test";
import assert from "node:assert/strict";
import { createHousingPost, getHousingPost, countHousingWaitlist, housingConversationLocked, HOUSING_CONVERSATION_LOCKED, updateHousingPost } from "./store";
import { registerHousingRoutes } from "./routes";

process.env.DATABASE_PATH = ":memory:";
const { sqlite: db, storage } = await import("../storage");
const lead = storage.createUser({username:"leadfixture",email:"lead@fixture.invalid",passwordHash:"fixture"}).id;
const members = ["waiter","chatter","joiner","latejoiner","outsider"].map(username =>
  storage.createUser({username,email:username+"@fixture.invalid",passwordHash:"fixture"}).id);
const [waiter,chatter,joiner,late,outsider] = members;
const handlers = new Map<string, Function>();
const app = Object.fromEntries(["get","post","patch","delete"].map(method => [method,
  (path:string, ...chain: Function[]) => handlers.set(method+path,chain.at(-1)!) ]));
let failDelivery = false;
registerHousingRoutes(app as any, {db,requireAuth(){},requireAdmin(){},uploadPhotos(){},boardPlacement:{},
  getUserById:storage.getUserById,isPrimaryOwner(){return false;},
  sendMessage(from:number,to:number,subject:string,body:string,opts:any) {
    if(failDelivery) throw Error("Fixture delivery interrupted");
    return storage.sendMessage(from,to,subject,body,opts);
  },
} as any);

function call(method:string,path:string,userId:number,params:object,body:object={}) {
  let status=200;
  let data:any;
  const res={setHeader(){},status(code:number){status=code;return this;},json(value:unknown){data=value;}};
  handlers.get(method+path)!({session:{userId},params,body},res);
  return {status,data};
}
const post=(userId:number,id:number,kind:string) => call("post","/api/housing/:id/request",userId,{id},{kind});
const accept=(userId:number,requestId:number) => call("post","/api/housing/requests/:requestId/accept",userId,{requestId});
const roster=(id:number,member:number) => !!db.prepare("SELECT 1 FROM housing_members WHERE post_id=? AND user_id=?").get(id,member);
const messages=(id:number,member:number) => db.prepare("SELECT body,thread_id FROM messages WHERE context_type='HOUSING' AND context_id=? AND to_user_id=? ORDER BY id").all(id,member) as {body:string;thread_id:string}[];

test("housing requests repair missing conversations and distinguish chat, waitlist and membership", () => {
  const full=createHousingPost(db,{userId:lead,type:"FORMING",headline:"Full fixture",seeking:0});
  updateHousingPost(db,full,{isFull:true});
  failDelivery=true;
  const first=post(waiter,full,"JOIN");
  assert.equal(first.status,200);
  assert.equal(first.data.request.kind,"WAITLIST");
  assert.equal(first.data.conversationPending,true);
  assert.equal(first.data.request.threadId,null);
  failDelivery=false;
  const repaired=post(waiter,full,"JOIN").data.request;
  assert.equal(repaired.id,first.data.request.id);
  assert.ok(repaired.threadId);
  assert.equal(post(waiter,full,"JOIN").data.request.threadId,repaired.threadId);
  assert.equal(messages(full,lead).length,1);
  const firstMessage = db.prepare("SELECT id FROM messages WHERE thread_id=?").get(repaired.threadId) as {id:number};
  assert.equal(housingConversationLocked(db,repaired.threadId),true);
  assert.equal(storage.toggleMessageReaction(firstMessage.id,waiter,"heart").error,HOUSING_CONVERSATION_LOCKED);
  assert.equal(call("get","/api/housing/requests/:requestId",outsider,{requestId:repaired.id}).status,404);
  assert.equal(accept(outsider,repaired.id).status,403);
  for(let i=0;i<2;i++) assert.equal(accept(lead,repaired.id).data.kind,"WAITLIST");
  assert.equal(housingConversationLocked(db,repaired.threadId),false);
  assert.equal(storage.toggleMessageReaction(firstMessage.id,waiter,"heart").error,undefined);
  assert.equal(countHousingWaitlist(db,full),1);
  assert.equal(roster(full,waiter),false);
  assert.equal(messages(full,waiter).length,1);
  assert.match(messages(full,waiter)[0].body,/waitlist/);
  assert.equal(messages(full,waiter)[0].thread_id,repaired.threadId);

  const chat=post(chatter,full,"CHAT").data.request;
  assert.equal(accept(lead,chat.id).data.kind,"CHAT");
  assert.equal(roster(full,chatter),false);
  const closed=post(outsider,full,"CHAT").data.request;
  assert.equal(call("post","/api/housing/requests/:requestId/decline",lead,{requestId:closed.id}).status,200);
  assert.equal(housingConversationLocked(db,closed.threadId),true);
  assert.equal(housingConversationLocked(db,"ordinary-private-thread"),false);
  assert.match(messages(full,chatter)[0].body,/request to chat/);

  const open=createHousingPost(db,{userId:lead,type:"FORMING",headline:"One room",seeking:1});
  const a=post(joiner,open,"JOIN").data.request, b=post(late,open,"JOIN").data.request;
  assert.equal(a.kind,"JOIN");
  failDelivery=true;
  assert.equal(accept(lead,a.id).status,409);
  assert.equal(roster(open,joiner),false);
  assert.equal(getHousingPost(db,open,lead)?.seeking,1);
  failDelivery=false;
  for(let i=0;i<2;i++) assert.equal(accept(lead,a.id).data.kind,"JOIN");
  assert.equal(roster(open,joiner),true);
  assert.equal(getHousingPost(db,open,lead)?.seeking,0);
  assert.equal(accept(lead,b.id).data.kind,"WAITLIST");
  assert.equal(roster(open,late),false);
  assert.match(messages(open,joiner)[0].body,/joined the household/);
});
