import test from "node:test";
import assert from "node:assert/strict";
import { runSubmissionIntent } from "./submissionIntent";
import { pickupPending, reservePickup } from "./pickupReservation";

process.env.DATABASE_PATH = ":memory:";
const { sqlite, storage } = await import("./storage");
const { ensureCommunityTables } = await import("./communities");

function user(username:string) {
  return storage.createUser({username, email:username+"@fixture.invalid", passwordHash:"fixture"});
}
function submission(type:string, who:ReturnType<typeof user>, title:string, eventId?:number) {
  const now = new Date().toISOString();
  return storage.createSubmission({type, title, eventId, description:"Fixture", venueName:"Fixture Hall", dateStart:now,
    dateEnd:now, submitterName:who.username, submitterEmail:who.email});
}
function notices(id:number) {
  return sqlite.prepare("SELECT subject,body FROM messages WHERE to_user_id=? ORDER BY id").all(id) as {subject:string;body:string}[];
}

test("retries preserve the approved listing, promoter decision and both hosts of a corrected event", () => {
  const owner = user("originalhost"), cohost = user("fixturecohost"), tipper = user("fixturetipper");
  const listing = storage.approveSubmission(submission("NEW_EVENT", owner, "Doors at eight").id, "reviewer")!;
  const eventId = listing.eventId!;
  assert.ok(storage.getEvent(eventId));
  sqlite.prepare("INSERT INTO event_hosts(event_id,user_id,role) VALUES (?,?,'COHOST')").run(eventId,cohost.id);
  const hosts = () => sqlite.prepare("SELECT * FROM event_hosts WHERE event_id=? ORDER BY id").all(eventId);
  const before = hosts();
  const beforeTips = notices(tipper.id).length;
  const tip = submission("SUGGEST",tipper,"Doors at nine");
  for (let i=0;i<2;i++) assert.equal(storage.mergeSubmissionIntoEvent(tip.id,eventId,"reviewer").submission?.eventId,eventId);
  assert.deepEqual(hosts(),before);
  assert.equal(storage.getEvent(eventId)?.claimedBy,owner.username);
  assert.equal(storage.getEvent(eventId)?.submittedBy,owner.email);
  assert.equal(storage.getUserById(tipper.id)?.promoterStatus,tipper.promoterStatus);
  assert.equal(notices(tipper.id).length,beforeTips+1);
  assert.equal(storage.approveSubmission(listing.id,"reviewer")?.eventId,eventId);
  assert.match(notices(owner.id).at(-1)!.body,new RegExp("/events/"+eventId+"$"));

  const published = storage.approveSubmission(submission("SUGGEST",tipper,"Community find").id,"reviewer")!;
  const claim = submission("CLAIM",cohost,"Community find",published.eventId!);
  const competingClaim = submission("CLAIM",owner,"Community find",published.eventId!);
  assert.ok(storage.getEvent(published.eventId!)?.isClaimable);
  assert.equal(storage.resolveEventPrimaryHostUser(published.eventId!),undefined);
  assert.equal(storage.isUserEventHost(published.eventId!,tipper.id),false);
  assert.deepEqual(storage.getEventTalentApproverUserIds(published.eventId!),[]);
  assert.deepEqual(storage.getEventHosts(published.eventId!),[]);
  assert.match(notices(tipper.id).at(-1)!.body,/unclaimed/);
  storage.approveSubmission(claim.id,"reviewer");
  assert.equal(storage.getEvent(published.eventId!)?.claimedBy,cohost.username);
  assert.equal(storage.isUserEventHost(published.eventId!,tipper.id),false);
  assert.throws(() => storage.approveSubmission(competingClaim.id,"reviewer"), /no longer available/);

  const countBefore = notices(tipper.id).length;
  const application = submission("PROMOTER_APPLICATION",tipper,"Promoter application");
  const secondApplication = submission("PROMOTER_APPLICATION",tipper,"Legacy duplicate");
  for (const id of [application.id,secondApplication.id,application.id]) assert.equal(storage.approveSubmission(id,"reviewer")?.eventId,null);
  assert.equal(notices(tipper.id).length,countBefore+1);
  assert.match(notices(tipper.id).at(-1)!.body,/promoter application/i);
  assert.equal(storage.getUserById(tipper.id)?.promoterStatus,"approved");
  assert.throws(() => storage.rejectSubmission(application.id,"stale decision"),/already resolved/);
});

test("one authenticated submission intent commits once, rejects mismatches and can retry after rollback", () => {
  let attempts=0;
  const key="test_request_2026";
  const receipt = () => ({id:++attempts});
  assert.throws(() => runSubmissionIntent(sqlite,1,key,{title:"A"},() => {throw Error("interrupted");}));
  assert.deepEqual(runSubmissionIntent(sqlite,1,key,{title:"A"},receipt), {id:1});
  assert.deepEqual(runSubmissionIntent(sqlite,1,key,{title:"A"},receipt), {id:1});
  assert.throws(() => runSubmissionIntent(sqlite,1,key,{title:"B"},receipt), /changed/);
  assert.deepEqual(runSubmissionIntent(sqlite,2,key,{title:"A"},receipt), {id:2});
});

test("competing venue representatives get one private outcome each and the existing linked owner is respected", () => {
  const winner=user("venuewinner"), other=user("venueother");
  const add = (name:string) => Number(sqlite.prepare("INSERT INTO businesses(name,type,description) VALUES (?,'group','fixture')").run(name).lastInsertRowid);
  const venue = add("Fixture venue"), owned = add("Fixture existing owner");
  ensureCommunityTables();
  const community = (id:number) => (sqlite.prepare("SELECT id FROM communities WHERE source_business_id=?").get(id) as {id:string}).id;
  const claim = (venue:number,member:number) => storage.createBusinessClaim(venue,member,"I represent this venue").claim!.id;
  const first=claim(venue,winner.id), second=claim(venue,other.id);
  const winnerCount=notices(winner.id).length, otherCount=notices(other.id).length;
  for(let i=0;i<2;i++) assert.ok(storage.approveBusinessClaim(first,"reviewer").ok);
  assert.match(storage.approveBusinessClaim(second,"reviewer").error!,/already resolved/);
  assert.equal(storage.getBusiness(venue)?.ownerId,winner.id);
  assert.deepEqual(sqlite.prepare("SELECT user_id,role FROM community_memberships WHERE community_id=?").all(community(venue)), [{user_id:winner.id,role:"owner"}]);
  assert.equal(notices(winner.id).length,winnerCount+1);
  assert.match(notices(winner.id).at(-1)!.body,/linked community/);
  assert.equal(notices(other.id).length,otherCount+1);
  assert.match(notices(other.id).at(-1)!.body,/another representative/);
  sqlite.prepare("INSERT INTO community_memberships(community_id,user_id,role) VALUES (?,?,'owner')").run(community(owned),other.id);
  assert.match(storage.approveBusinessClaim(claim(owned,winner.id),"reviewer").error!,/different owner/);
  assert.equal(storage.getBusiness(owned)?.ownerId,null);
});

test("event chat pages start at the newest message, keep stable cursors and honor membership and masks", () => {
  const host=user("chatfixturehost"), member=user("chatfixtureother");
  const event = storage.approveSubmission(submission("NEW_EVENT",host,"Fixture chat").id,"reviewer")!.eventId!;
  const add = sqlite.prepare("INSERT INTO event_chat_messages(event_id,user_id,body,created_at,is_anonymous) VALUES(?,?,?,?,1)");
  const now=new Date().toISOString();
  for(let i=1;i<=205;i++) add.run(event,member.id,"Fixture "+i,now);
  const page=storage.getEventChatMessages(event,host.id);
  assert.ok(page.chatOpen);
  assert.equal(page.messages[0].body,"Fixture 6");
  assert.equal(page.messages.at(-1)!.body,"Fixture 205");
  assert.ok(page.messages.every((m:any) => m.userId===null && m.username==="anonymous"));
  add.run(event,member.id,"Fixture 206",now);
  const earlier=storage.getEventChatMessages(event,host.id,page.nextBeforeId!);
  assert.deepEqual(earlier.messages.map((m:any)=>m.body),["Fixture 1","Fixture 2","Fixture 3","Fixture 4","Fixture 5"]);
  assert.equal(earlier.nextBeforeId,null);
  assert.deepEqual(storage.getEventChatMessages(event,member.id).messages,[]);
});

test("a performer can withdraw their own credit and cannot remove another member's credit", () => {
  const host=user("talentfixturehost"), artist=user("talentfixtureartist"), other=user("talentfixtureother");
  const event=storage.approveSubmission(submission("NEW_EVENT",host,"Lineup fixture").id,"reviewer")!.eventId!;
  const add=(who:number,by:number) => Number(sqlite.prepare("INSERT INTO event_talent(event_id,user_id,role,added_by_user_id) VALUES(?,?,'DJ',?)").run(event,who,by).lastInsertRowid);
  const own=add(artist.id,artist.id), assigned=add(other.id,host.id);
  assert.equal(storage.removeEventTalent(own,other.id).error,"Not authorized");
  assert.ok(storage.removeEventTalent(own,artist.id).ok);
  assert.equal(storage.removeEventTalent(assigned,artist.id).error,"Not authorized");
  assert.equal(storage.removeEventTalent(assigned,other.id).error,"Not authorized");
  assert.ok(storage.removeEventTalent(assigned,host.id).ok);
});

for (const board of ["GIFTING","SELLZ"] as const) test(board+" preserves the chosen person and original pickup note through a failed delivery and retries", () => {
  const poster=user(board+"poster"), receiver=user(board+"receiver"), other=user(board+"other");
  const fields={userId:poster.id,title:"Fixture item",description:"Fixture",category:"home",neighborhood:"Fixture",pickupPreference:"Arrange pickup"};
  const gift=board==="GIFTING";
  const post = gift ? storage.createGiftingPost(fields) : storage.createSellzPost({...fields,condition:"new",priceCents:100});
  const respond=(userId:number) => {
    const fields={postId:post.id,userId,note:"Interested"};
    return (gift ? storage.addGiftingInterest(fields) : storage.addSellzInterest(fields)).id;
  };
  const chosen=respond(receiver.id), competitor=respond(other.id);
  let fail=true;
  const reserve=(id:number,note:string) => reservePickup(sqlite,board,post.id,id,poster.id,note,
    ()=>gift ? storage.chooseGiftingInterest(post.id,id,poster.id) : storage.chooseSellzInterest(post.id,id,poster.id),
    (to,subject,body) => {
      if(fail) throw Error("fixture delivery interrupted");
      return storage.sendMessage(poster.id,to,subject,body,{contextType:board,contextId:post.id});
    });
  assert.equal(reserve(chosen,"Original private instructions").pickupNoticePending,true);
  assert.equal(pickupPending(sqlite,board,chosen),true);
  assert.throws(()=>reserve(competitor,"Another attempt"),/no longer available/);
  fail=false;
  const before=notices(receiver.id).length;
  for(let i=0;i<2;i++) assert.equal(reserve(chosen,"Changed note on retry").pickupNoticePending,false);
  assert.equal(notices(receiver.id).length,before+1);
  assert.equal(notices(receiver.id).at(-1)!.body,"Original private instructions");
  assert.equal(pickupPending(sqlite,board,chosen),false);
  sqlite.prepare("DELETE FROM pickup_notices WHERE board=? AND interest_id=?").run(board,chosen);
  assert.equal(pickupPending(sqlite,board,chosen),false,"legacy delivered notice should not be duplicated");
  assert.equal(reserve(chosen,"legacy retry").pickupNoticePending,false);
  assert.equal(notices(receiver.id).length,before+1);
  sqlite.prepare("DELETE FROM pickup_notices WHERE board=? AND interest_id=?").run(board,chosen);
  sqlite.prepare("DELETE FROM messages WHERE from_user_id=? AND to_user_id=? AND context_type=? AND context_id=?")
    .run(poster.id,receiver.id,board,post.id);
  assert.equal(pickupPending(sqlite,board,chosen),true,"a selected legacy response with no message must expose the repair action");
  fail=true;
  assert.equal(reserve(chosen,"Pending legacy note").pickupNoticePending,true);
  if (gift) storage.reopenGiftingPost(post.id,poster.id);
  else storage.setSellzStatus(post.id,poster.id,"ACTIVE");
  assert.equal(pickupPending(sqlite,board,chosen),false);
  assert.equal(sqlite.prepare("SELECT 1 FROM pickup_notices WHERE board=? AND interest_id=?").get(board,chosen),undefined);
  assert.throws(()=>reserve(chosen,"Closed reservation"),/no longer available/);
});
