import assert from 'node:assert/strict';
import {after,test} from 'node:test';
import {copyFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import path from 'node:path';

// All messages stay in a disposable database between synthetic accounts with no push subscriptions.
mkdirSync('.local',{recursive:true});
const directory=mkdtempSync(path.resolve('.local/event-drawer-messaging-'));
process.env.DATABASE_PATH=path.join(directory,'data.db');
copyFileSync('data.db',process.env.DATABASE_PATH);
const {storage,sqlite}=await import('./storage');
after(()=>{sqlite.close();rmSync(directory,{recursive:true,force:true});});
const user=(name:string)=>Number(sqlite.prepare('INSERT INTO users (username,email,password_hash) VALUES (?,?,?)').run(`drawer_${name}`,`drawer_${name}@example.invalid`,'not-a-password').lastInsertRowid);
const host=user('host'),owner=user('venue'),attendee=user('attendee');
const eventId=Number(sqlite.prepare("INSERT INTO events (title,description,venue_name,date_start,date_end,status,claimed_by) VALUES (?,?,?,?,?,'LIVE',?)").run('Synthetic drawer night','Fixture','Synthetic drawer venue','2026-01-01T20:00:00Z','2026-01-02T02:00:00Z','drawer_host').lastInsertRowid);
const venueId=Number(sqlite.prepare('INSERT INTO businesses (name,description,type,owner_id,active) VALUES (?,?,?,?,1)').run('Synthetic drawer venue','Fixture','venue',owner).lastInsertRowid);

test('explicit venue and host targets stay separate; old callers still prefer the host',()=>{
 assert.equal(storage.resolveEventMessageRecipient(eventId,'venue')?.user.id,owner);
 assert.equal(storage.resolveEventMessageRecipient(eventId,'host')?.user.id,host);
 assert.equal(storage.resolveEventMessageRecipient(eventId)?.user.id,host);
 sqlite.prepare('UPDATE businesses SET owner_id=NULL WHERE id=?').run(venueId);
 assert.equal(storage.resolveEventMessageRecipient(eventId,'venue'),undefined,'a venue message must never fall back to the party host');
 sqlite.prepare('UPDATE businesses SET owner_id=? WHERE id=?').run(owner,venueId);
 sqlite.prepare('DELETE FROM event_hosts WHERE event_id=?').run(eventId);
 sqlite.prepare('UPDATE events SET claimed_by=NULL, submitted_by=NULL WHERE id=?').run(eventId);
 assert.equal(storage.resolveEventMessageRecipient(eventId,'host'),undefined,'a host message must never fall back to the venue');
 assert.equal(storage.resolveEventMessageRecipient(eventId)?.user.id,owner);
 sqlite.prepare('UPDATE events SET claimed_by=? WHERE id=?').run('drawer_host',eventId);
});

test('venue and host replies arrive in the attendee inbox with the original event context',()=>{
 for(const target of ['venue','host'] as const){
  const recipient=storage.resolveEventMessageRecipient(eventId,target)!;
  const original=storage.sendMessage(attendee,recipient.user.id,`Event: Synthetic drawer night`,'Synthetic question',{contextType:'EVENT_HOST',contextId:eventId,contextLabel:'Synthetic drawer night'});
  assert.ok(storage.getInbox(recipient.user.id).some(message=>message.id===original.id));
  const reply=storage.sendMessage(recipient.user.id,attendee,original.subject,'Synthetic reply',{threadId:original.threadId,contextType:original.contextType,contextId:original.contextId,contextLabel:original.contextLabel});
  assert.ok(storage.getInbox(attendee).some(message=>message.id===reply.id));
  assert.equal(storage.getThread(original.threadId).length,2);
 }
});

test('Mizzed Connection replies use inbox threads and remain anonymous',()=>{
 const post=storage.createMissedConnection({userId:attendee,title:'Synthetic connection',body:'A synthetic moment',eventId:null,venueHint:'Synthetic drawer venue',dayOfWeek:'THU',closesAt:new Date(Date.now()+86400000).toISOString()});
 const reply=storage.sendMessage(host,attendee,'MIZZED CONNECTION: Synthetic connection','Synthetic reply',{contextType:'MISSED_CONNECTION',contextId:post.id,contextLabel:post.title});
 storage.createMissedConnectionThread(reply.threadId,post.id,attendee,host);
 const incoming=storage.getInbox(attendee).find(message=>message.id===reply.id)!;
 assert.ok(incoming);
 assert.equal(storage.maskMessageParty(incoming,attendee,'inbox').from_username,'Anonymous');
 assert.equal(storage.getThreadForViewer(reply.threadId,attendee)[0].masked,true);
});
