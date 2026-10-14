import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import {initializeBoardMapPlacement,placementWindow,savePlacement,readPlacement,validatePlacement,registerBoardPlacement} from "./boardMapPlacement";
const DAY=86400000,start=new Date("2026-10-01T12:00:00Z"),point={lat:45.51,lng:-122.64,days:14};
test("initial window survives moving, removing, restarting and five-day renewals",()=>{
 const db=new Database(":memory:");initializeBoardMapPlacement(db,start);
 savePlacement(db,"gigz",1,point,start);
 assert.equal(readPlacement(db,"gigz",1)?.expiresAt,"2026-10-15T12:00:00.000Z");
 savePlacement(db,"gigz",1,null,new Date(+start+4*DAY));
 assert.equal(readPlacement(db,"gigz",1)?.firstPlacedAt,start.toISOString());
 initializeBoardMapPlacement(db,new Date(+start+9*DAY));
 assert.throws(()=>savePlacement(db,"gigz",1,point,new Date(+start+9*DAY)),/up to 5 days/);
 savePlacement(db,"gigz",1,{...point,days:5},new Date(+start+9.5*DAY));
 assert.equal(readPlacement(db,"gigz",1)?.expiresAt,"2026-10-15T12:00:00.000Z");
 assert.equal(placementWindow(start.toISOString(),new Date(+start+14*DAY)).renewal,true);
 assert.throws(()=>savePlacement(db,"gigz",1,{...point,days:6},new Date(+start+14*DAY)),/up to 5 days/);
 for(const offset of [14,19,24]){
  savePlacement(db,"gigz",1,{...point,days:5},new Date(+start+offset*DAY));
  assert.equal(Date.parse(readPlacement(db,"gigz",1)!.expiresAt),+start+(offset+5)*DAY);
  assert.equal(readPlacement(db,"gigz",1)!.firstPlacedAt,start.toISOString());
 }
 db.close();
});
test("legacy shares receive one bounded window, once",()=>{
 const db=new Database(":memory:");db.exec("CREATE TABLE board_map_locations(board TEXT,post_id INTEGER,lat REAL,lng REAL,PRIMARY KEY(board,post_id)); INSERT INTO board_map_locations VALUES('giftz',1,45.5,-122.6)");
 initializeBoardMapPlacement(db,start);initializeBoardMapPlacement(db,new Date(+start+20*DAY));
 assert.equal(readPlacement(db,"giftz",1)!.expiresAt,"2026-10-15T12:00:00.000Z");db.close();
});
test("placement validates geography, durations and protects existing waypoints while permitting pin overlap",()=>{
 const waypoint={...point,name:"Venue",venueId:4};
 for(const invalid of [{...point,lat:NaN},{...point,lng:Infinity},{...point,lat:0},{...point,days:0},{...point,days:15},{...point,days:1.5}])assert.throws(()=>validatePlacement(invalid));
 assert.throws(()=>validatePlacement(point,[waypoint]),/existing waypoint/);
 assert.throws(()=>validatePlacement({...point,venueId:4},[waypoint],5),/not linked/);
 assert.throws(()=>validatePlacement({...point,lat:45.6,venueId:4},[waypoint],4),/linked venue/);
 assert.equal(validatePlacement({...point,venueId:4},[waypoint],4)?.venueId,4);
 assert.deepEqual(validatePlacement(point,[]),validatePlacement(point,[]));
 assert.equal(validatePlacement(null),null);
});
test("owner endpoints require authentication and never allow another poster or an unknown table",()=>{
 const db=new Database(":memory:");db.exec("CREATE TABLE gig_posts(id INTEGER,user_id INTEGER);INSERT INTO gig_posts VALUES(1,7);CREATE TABLE missed_connections(id INTEGER,place_id INTEGER,event_id INTEGER,status TEXT,created_at TEXT)");
 const handlers=new Map<string,any[]>(),auth=()=>{};
 const app={get:(path:string,...fns:any[])=>handlers.set("GET "+path,fns),put:(path:string,...fns:any[])=>handlers.set("PUT "+path,fns)};
 registerBoardPlacement(app as any,db,auth as any,{getBusinesses:()=>[],getEvents:()=>[]});
 const path="/api/boards/:board/posts/:id/map-location";
 for(const method of ["GET","PUT"]){
  const route=handlers.get(method+" "+path)!;assert.equal(route[0],auth);
  for(const [board,userId]of [["gigz",8],["users",7]]){
   let status=200;const res={status:(n:number)=>{status=n;return res;},json:()=>{},setHeader:()=>{}};
   route[1]({params:{board,id:"1"},session:{userId},body:{mapLocation:point}},res);assert.equal(status,404);
  }
 }
 assert.equal(readPlacement(db,"gigz",1),undefined);db.close();
});
test("opting out before first placement stays off across restarts and doesn't start the clock",()=>{
 const db=new Database(":memory:");initializeBoardMapPlacement(db,start);savePlacement(db,"mizzed",1,null,start);
 initializeBoardMapPlacement(db,new Date(+start+20*DAY));
 assert.equal(readPlacement(db,"mizzed",1)!.firstPlacedAt,"");
 savePlacement(db,"mizzed",1,point,new Date(+start+20*DAY));
 assert.equal(readPlacement(db,"mizzed",1)!.firstPlacedAt,new Date(+start+20*DAY).toISOString());
 assert.equal(readPlacement(db,"mizzed",1)!.expiresAt,new Date(+start+34*DAY).toISOString());db.close();
});
test("moving an active pin preserves its exact expiry without granting extra hours",()=>{
 const db=new Database(":memory:");initializeBoardMapPlacement(db,start);savePlacement(db,"giftz",1,{...point,days:5},start);
 const keepUntil=readPlacement(db,"giftz",1)!.expiresAt;
 savePlacement(db,"giftz",1,{...point,lat:45.55,days:4,keepUntil},new Date(+start+1.5*DAY));
 assert.equal(readPlacement(db,"giftz",1)!.expiresAt,keepUntil);
 assert.throws(()=>savePlacement(db,"giftz",1,{...point,days:4,keepUntil:"2026-12-01"},new Date(+start+2*DAY)),/placement changed/);db.close();
});
test("owner repinning an expired connection extends its public lifetime, but rejected posts cannot return",()=>{
 const db=new Database(":memory:");db.exec(`CREATE TABLE missed_connections(id INTEGER,user_id INTEGER,place_id INTEGER,event_id INTEGER,status TEXT,created_at TEXT,closes_at TEXT);
 INSERT INTO missed_connections VALUES(1,7,NULL,NULL,'ARCHIVED','2026-01-01','2026-01-08'),(2,7,NULL,NULL,'REJECTED','2026-01-01','2026-01-08')`);
 const handlers=new Map<string,any[]>(),app={get:(path:string,...fns:any[])=>handlers.set('GET '+path,fns),put:(path:string,...fns:any[])=>handlers.set('PUT '+path,fns)};
 registerBoardPlacement(app as any,db,(()=>{}) as any,{getBusinesses:()=>[],getEvents:()=>[]});
 savePlacement(db,'mizzed',1,{lat:45.7,lng:-122.9,days:14},new Date('2026-01-01'));
 const put=handlers.get('PUT /api/boards/:board/posts/:id/map-location')![1];
 let status=200,body:any;const res={status:(n:number)=>{status=n;return res;},json:(v:any)=>{body=v;},setHeader:()=>{}};
 put({params:{board:'mizzed',id:'1'},session:{userId:7},body:{mapLocation:{lat:45.7,lng:-122.9,days:5}}},res);
 assert.equal(status,200,JSON.stringify(body));
 const post=db.prepare('SELECT * FROM missed_connections WHERE id=1').get() as any;
 assert.equal(post.status,'ACTIVE');assert.equal(post.closes_at,readPlacement(db,'mizzed',1)!.expiresAt);
 put({params:{board:'mizzed',id:'2'},session:{userId:7},body:{mapLocation:{lat:45.7,lng:-122.9,days:5}}},res);
 assert.equal(status,400);assert.equal(readPlacement(db,'mizzed',2),undefined);db.close();
});
test("housing retains its established Salem corridor without widening other boards",()=>{
 const salem={lat:44.94,lng:-123.03,days:7};
 assert.throws(()=>validatePlacement(salem),/Portland metro/);
 assert.equal(validatePlacement(salem,[],null,true)?.lat,salem.lat);
 assert.throws(()=>validatePlacement({...salem,lat:44.7},[],null,true),/Salem/);
});
