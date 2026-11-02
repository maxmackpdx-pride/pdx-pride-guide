import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer, get as httpGet } from 'node:http';
import express from 'express';
import Database from 'better-sqlite3';
import { expandMultiDayEvents } from '../shared/multiDayEvents';
import { dedupeEvents } from '../shared/eventDedupe';
import { buildVenueWebsiteIndex, resolveVenueWebsite } from '../shared/venueLinks';
import { resolveEventPosterUrl } from '../shared/eventPoster';

// storage runs schema migrations on import. Copy the seed BEFORE that import;
// neither the tracked seed nor a developer's local runtime is ever writable here.
const directory = mkdtempSync(join(tmpdir(), 'zaylist-feed-http-'));
process.env.DATABASE_PATH = join(directory, 'test.db');
process.env.NODE_ENV = 'test';
copyFileSync(resolve('data.db'), process.env.DATABASE_PATH);
const { sqlite, storage } = await import('./storage');
const { enrichEventForMap } = await import('./mapCoordinateSync');
const { registerPublicEventFeedRoute } = await import('./routes');
const app = express();
// Deliberately differing sessions must never change this public feed.
app.use((req, _res, next) => { (req as any).session = { userId: req.header('x-test-user'), isAdmin: req.header('x-test-admin') === 'true' }; next(); });
const server = createServer(app);
registerPublicEventFeedRoute(app, server);
app.use((error: Error, _req: unknown, res: any, _next: unknown) => res.status(500).json({ error: error.message }));
await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${(server.address() as any).port}`;
after(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  assert.equal((sqlite.prepare("SELECT count(*) AS count FROM sqlite_temp_master WHERE name LIKE 'public_feed_%'").get() as any).count,0);
  sqlite.close();
  rmSync(directory, { recursive: true, force: true });
});

function fixture() {
  sqlite.exec('PRAGMA foreign_keys=OFF; DELETE FROM events; DELETE FROM businesses; DELETE FROM event_talent; DELETE FROM submissions;');
  sqlite.prepare(`INSERT INTO businesses (id,name,description,website,lat,lng) VALUES (900001,'Fixture Venue','fixture','https://fixture.example',45.52,-122.65)`).run();
  const insert = sqlite.prepare(`INSERT INTO events (id,title,description,venue_name,date_start,date_end,day_of_week,status,admin_notes,submitted_by,claimed_by,is_public,is_private,poster_image_url) VALUES (?,?,?,?,?,?,?,'LIVE','secret note','secret submitter','secret owner',1,0,?)`);
  for (let i = 0; i < 12; i++) insert.run(900001+i, `Fixture ${i}`, 'description', 'Fixture Venue', `2025-01-${String(i+1).padStart(2,'0')}T18:00:00`, `2025-01-${String(i+1).padStart(2,'0')}T20:00:00`, 'FRI', null);
  insert.run(900020, 'Multi fixture', 'multi-day', 'Fixture Venue', '2025-02-01T10:00:00', '2025-02-03T18:00:00', 'SAT', null);
  insert.run(900021, 'Fixture 0', 'richer duplicate wins', 'Fixture Venue', '2025-01-01T18:00:00', '2025-01-01T20:00:00', 'FRI', 'https://fixture.example/poster.jpg');
  sqlite.prepare(`INSERT OR REPLACE INTO users (id,username,email,password_hash,display_name) VALUES (900001,'fixture_talent','fixture@example.test','test','Fixture Artist')`).run();
  sqlite.prepare(`INSERT INTO event_talent (event_id,user_id,role,status) VALUES (900021,900001,'DJ','LIVE'),(900002,900001,'Secret pending','PENDING')`).run();
  sqlite.prepare(`INSERT INTO submissions (type,event_id,title,description,venue_name,date_start,date_end,submitter_name,submitter_email,status) VALUES ('CLAIM',900021,'claim','claim','Fixture Venue','2025-01-01','2025-01-01','Secret claimant','secret@example.test','PENDING')`).run();
}

// Independent transcription of the pre-cache route, including its operation order.
function originalPayload(day?: string) {
  let events = dedupeEvents(expandMultiDayEvents(storage.getEvents({ status: 'LIVE' })));
  if (typeof day === 'string' && day.length > 0) events = events.filter(event => event.dayOfWeek === day);
  const claims = new Set(storage.getPendingClaimEventIds());
  const websites = buildVenueWebsiteIndex(storage.getBusinesses() as any);
  const talent = new Map<number,string[]>();
  for (const row of sqlite.prepare(`SELECT et.event_id AS eventId, et.role, u.username, u.display_name AS displayName FROM event_talent et JOIN users u ON u.id=et.user_id JOIN events e ON e.id=et.event_id WHERE et.status='LIVE' AND e.status='LIVE'`).all() as any[]) {
    const names = talent.get(row.eventId) ?? []; names.push(row.role,row.username,row.displayName ?? ''); talent.set(row.eventId,names);
  }
  const businesses = storage.getBusinesses();
  return JSON.parse(JSON.stringify(events.map(event => {
    const { adminNotes,submittedBy,claimedBy,...safe } = enrichEventForMap(event,businesses);
    return { ...safe, posterImageUrl: resolveEventPosterUrl(event.id,event.posterImageUrl,event.dayOfWeek),hasPendingClaim:claims.has(event.id),venueWebsite:(event as any).venueWebsite || resolveVenueWebsite(event.venueName,websites) || null,searchTalent:talent.get(event.id) ?? [] };
  })));
}
async function get(query = '', headers: Record<string,string> = {}) { return fetch(`${base}/api/events${query}`, { headers }); }
function conditionalGet(etag: string) {
  // Undici fetch adds Cache-Control:no-cache to conditional requests, deliberately
  // defeating Express freshness. Raw HTTP tests actual If-None-Match semantics.
  return new Promise<{status:number;headers:Record<string,any>;body:string}>((resolve,reject)=>{
    httpGet(`${base}/api/events`,{headers:{'If-None-Match':etag}},response=>{
      let body=''; response.setEncoding('utf8'); response.on('data',chunk=>body+=chunk);
      response.on('end',()=>resolve({status:response.statusCode!,headers:response.headers,body}));
      response.on('error',reject);
    }).on('error',reject);
  });
}

test('actual public feed preserves old payload, history, expansion, dedupe, mapping and privacy; warm calls skip enrichment', async () => {
  fixture();
  const expected = originalPayload();
  assert.equal(expected.length, 15);
  assert.equal(expected.filter((row:any) => row.id === 900020).length,3);
  assert.ok(!expected.some((row:any) => row.id === 900001));
  const winner = expected.find((row:any) => row.id === 900021);
  assert.equal(winner.lat,45.52); assert.equal(winner.venueWebsite,'https://fixture.example');
  assert.deepEqual(winner.searchTalent,['DJ','fixture_talent','Fixture Artist']); assert.equal(winner.hasPendingClaim,true);
  assert.deepEqual(expected.find((row:any)=>row.id===900002).searchTalent,[]);
  assert.ok(expected.every((row:any)=>row.dateStart.startsWith('2025-')));
  const first = await get(); assert.equal(first.status,200); assert.equal(first.headers.get('x-event-feed-cache'),'MISS');
  assert.equal(first.headers.get('cache-control'),'private, no-cache');
  assert.deepEqual(await first.json(),expected);
  const original = storage.getEvents;
  storage.getEvents = (() => { throw new Error('warm request recomputed feed'); }) as typeof original;
  try {
    const warm = await get('', {'x-test-user':'900001','x-test-admin':'true'});
    assert.equal(warm.status,200); assert.equal(warm.headers.get('x-event-feed-cache'),'HIT');
    const rows = await warm.json(); assert.deepEqual(rows,expected);
    for (const row of rows) for (const field of ['adminNotes','submittedBy','claimedBy']) assert.equal(field in row,false);
    const conditional = await conditionalGet(first.headers.get('etag')!);
    assert.equal(conditional.status,304); assert.equal(conditional.body,'');
    assert.equal(conditional.headers['x-event-feed-cache'],'HIT');
    const forced=await get('',{'If-None-Match':first.headers.get('etag')!,'Cache-Control':'no-cache'});
    assert.equal(forced.status,200); assert.deepEqual(await forced.json(),expected);
  } finally { storage.getEvents = original; }
});

test('actual route filters then paginates, preserving malformed day/unknown parameter behavior and rejecting bad pagination', async () => {
  fixture(); const expected=originalPayload();
  assert.deepEqual(await (await get('?limit=1')).json(),expected.slice(0,1));
  const day=expected[0].dayOfWeek;
  assert.deepEqual(await (await get(`?day=${day}&offset=1&limit=2`)).json(),originalPayload(day).slice(1,3));
  assert.deepEqual(await (await get('?offset=2')).json(),expected.slice(2));
  assert.deepEqual(await (await get('?limit=0')).json(),[]);
  assert.deepEqual(await (await get('?day=FRI&day=SAT&ignored=anything')).json(),expected);
  for (const query of ['?limit=-1','?limit=501','?limit=1.5','?offset=no','?limit=1&limit=2','?offset=9007199254740992']) {
    const response=await get(query); assert.equal(response.status,400,query); assert.equal(response.headers.get('cache-control'),'private, no-store');
  }
});

test('actual route invalidates edits/hiding/claims/businesses/talent and never reuses private payloads', async () => {
  fixture(); const before=await get(); const etag=before.headers.get('etag')!; await before.arrayBuffer();
  sqlite.prepare("UPDATE events SET title='Edited live title' WHERE id=900002").run();
  const edited=await conditionalGet(etag); assert.equal(edited.status,200); assert.notEqual(edited.headers.etag,etag);
  assert.ok(JSON.parse(edited.body).some((row:any)=>row.title==='Edited live title'));
  sqlite.prepare("UPDATE events SET status='HIDDEN' WHERE id=900002").run();
  sqlite.prepare("UPDATE submissions SET status='APPROVED'").run();
  sqlite.prepare("UPDATE businesses SET website='https://new.example',lat=45.53 WHERE id=900001").run();
  sqlite.prepare("UPDATE users SET display_name='Renamed Artist' WHERE id=900001").run();
  const changed=await get(); const rows=await changed.json();
  assert.equal(changed.headers.get('x-event-feed-cache'),'MISS'); assert.ok(!rows.some((row:any)=>row.id===900002));
  const winner=rows.find((row:any)=>row.id===900021); assert.equal(winner.hasPendingClaim,false); assert.equal(winner.lat,45.53); assert.equal(winner.venueWebsite,'https://new.example'); assert.ok(winner.searchTalent.includes('Renamed Artist'));
  sqlite.prepare('UPDATE events SET is_private=1 WHERE id=900021').run();
  for (const headers of [{}, {'x-test-user':'other'}]) {
    const privateResponse=await get('',headers); assert.equal(privateResponse.headers.get('x-event-feed-cache'),'BYPASS'); assert.equal(privateResponse.headers.get('cache-control'),'private, no-store');
    assert.ok((await privateResponse.json()).some((row:any)=>row.id===900021)); // Existing LIVE-list semantics, not a new visibility policy.
  }
});

test('actual asynchronous enrichment cannot publish an event hidden during its first yield', async () => {
  fixture(); const original=storage.getEvents; let scheduled=false; let builds=0;
  storage.getEvents = ((...args: Parameters<typeof original>) => {
    builds++; const rows=original.apply(storage,args);
    if (!scheduled) { scheduled=true; setImmediate(()=>sqlite.prepare("UPDATE events SET status='HIDDEN' WHERE id=900021").run()); }
    return rows;
  }) as typeof original;
  try {
    const responses=await Promise.all([get(),get(),get()]);
    assert.equal(builds,2, 'concurrent callers coalesce into one build plus the invalidated retry');
    for(const response of responses) {
      assert.equal(response.status,200); const rows=await response.json();
      assert.ok(!rows.some((row:any)=>row.id===900021)); assert.deepEqual(rows,originalPayload());
    }
  } finally { storage.getEvents=original; }
});

test('actual HTTP feed invalidates commits from a second SQLite connection', async () => {
  fixture(); const first=await get(); const etag=first.headers.get('etag')!; await first.arrayBuffer();
  const external=new Database(process.env.DATABASE_PATH!);
  try { external.prepare("UPDATE events SET title='External editor' WHERE id=900002").run(); }
  finally { external.close(); }
  const changed=await conditionalGet(etag);
  assert.equal(changed.status,200); assert.equal(changed.headers['x-event-feed-cache'],'MISS');
  assert.notEqual(changed.headers.etag,etag);
  assert.ok(JSON.parse(changed.body).some((row:any)=>row.title==='External editor'));
});

test('actual route returns retryable no-store 503 during a transaction, then recovers', async () => {
  fixture(); sqlite.exec('BEGIN');
  try {
    const response=await get(); assert.equal(response.status,503);
    assert.equal(response.headers.get('retry-after'),'1');
    assert.equal(response.headers.get('cache-control'),'private, no-store');
  } finally { sqlite.exec('ROLLBACK'); }
  const recovered=await get(); assert.equal(recovered.status,200); assert.deepEqual(await recovered.json(),originalPayload());
});

// Opt-in bounded benchmark uses the real legacy algorithm, including its eight-row
// yield, on exactly the same immutable DB as the production cached handler.
test('bounded same-dataset legacy/cached HTTP timings', { skip: process.env.EVENT_FEED_BENCHMARK !== '1' }, async t => {
  fixture();
  const insert=sqlite.prepare(`INSERT INTO events (id,title,description,venue_name,date_start,date_end,status) VALUES (?,?,?,'Fixture Venue','2025-03-01T18:00:00','2025-03-01T20:00:00','LIVE')`);
  sqlite.transaction(()=>{ for(let i=0;i<1391;i++) insert.run(910000+i,`Benchmark ${i}`,'Historical fixture description '.repeat(10)); })();
  app.get('/test-only-legacy-events',async (_req,res)=>{
    const events=dedupeEvents(expandMultiDayEvents(storage.getEvents({status:'LIVE'})));
    const claims=new Set(storage.getPendingClaimEventIds());
    const websites=buildVenueWebsiteIndex(storage.getBusinesses() as any);
    const talent=new Map<number,string[]>();
    for(const row of sqlite.prepare(`SELECT et.event_id AS eventId,et.role,u.username,u.display_name AS displayName FROM event_talent et JOIN users u ON u.id=et.user_id JOIN events e ON e.id=et.event_id WHERE et.status='LIVE' AND e.status='LIVE'`).all() as any[]) {
      const names=talent.get(row.eventId)??[]; names.push(row.role,row.username,row.displayName??''); talent.set(row.eventId,names);
    }
    const businesses=storage.getBusinesses(); const payload=[];
    for(const event of events) {
      const {adminNotes,submittedBy,claimedBy,...safe}=enrichEventForMap(event,businesses);
      payload.push({...safe,posterImageUrl:resolveEventPosterUrl(event.id,event.posterImageUrl,event.dayOfWeek),hasPendingClaim:claims.has(event.id),venueWebsite:(event as any).venueWebsite||resolveVenueWebsite(event.venueName,websites)||null,searchTalent:talent.get(event.id)??[]});
      if(payload.length%8===0) await new Promise<void>(resolve=>setImmediate(resolve));
    }
    res.json(payload);
  });
  const {monitorEventLoopDelay}=await import('node:perf_hooks');
  const sample=async(path:string,count:number)=>{
    const monitor=monitorEventLoopDelay({resolution:10}); monitor.enable();
    await new Promise(resolve=>setTimeout(resolve,20));
    const milliseconds:number[]=[]; let bytes=0; let rows=0; let status:string|null=null;
    for(let i=0;i<count;i++) {
      const start=performance.now(); const response=await fetch(base+path); const text=await response.text();
      assert.equal(response.status,200); milliseconds.push(performance.now()-start); bytes=Buffer.byteLength(text); rows=JSON.parse(text).length; status=response.headers.get('x-event-feed-cache');
    }
    await new Promise(resolve=>setTimeout(resolve,20)); monitor.disable();
    return {milliseconds,bytes,rows,status,eventLoopP99Ms:monitor.percentile(99)/1e6,eventLoopMaxMs:monitor.max/1e6};
  };
  const legacy=await sample('/test-only-legacy-events',4);
  const cold=await sample('/api/events',1);
  const warm=await sample('/api/events',4);
  const page=await sample('/api/events?limit=1',4);
  assert.equal(legacy.rows,1406); assert.equal(cold.rows,1406); assert.equal(warm.bytes,legacy.bytes); assert.equal(page.rows,1);
  assert.deepEqual(await(await fetch(base+'/test-only-legacy-events')).json(),await(await get()).json());
  t.diagnostic(JSON.stringify({legacy,cold,warm,page}));
});
