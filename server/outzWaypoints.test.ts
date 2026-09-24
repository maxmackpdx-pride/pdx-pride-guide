import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import {createWaypointStore,waypointExpiry} from './outzWaypoints.ts';

test('expiry honors days, weeks and clamped calendar months',()=>{
 const now=new Date('2026-08-31T12:00:00Z');
 assert.equal(waypointExpiry('day',now),'2026-09-01T12:00:00.000Z');
 assert.equal(waypointExpiry('week',now),'2026-09-07T12:00:00.000Z');
 assert.equal(waypointExpiry('month',now),'2026-09-30T12:00:00.000Z');
 assert.equal(waypointExpiry('six-months',now),'2027-02-28T12:00:00.000Z');
 assert.throws(()=>waypointExpiry('forever',now));
});
test('saved waypoints expire, stay scoped to a place, and only their author can remove them',()=>{
 const db=new Database(':memory:');const store=createWaypointStore(db as any);
 const now=new Date('2026-09-22T12:00:00Z');
 const id=Number(store.add('trail',42,{title:'Creek crossing',note:'Wet rocks',lat:45,lng:-122,duration:'day'},now));
 assert.equal(store.list('trail',42,now)[0].canDelete,true);
 assert.equal(store.list('trail',43,now)[0].canDelete,false);
 assert.equal('user_id' in store.list('trail',43,now)[0],false);
 assert.equal(store.list('beach',42,now).length,0);
 assert.equal(store.list('trail',42,new Date('2026-09-23T12:00:00Z')).length,0);
 assert.equal(store.remove(id,43),false);assert.equal(store.remove(id,42),true);
 assert.equal(store.list('trail',42,now).length,0);db.close();
});
test('invalid locations, text and expiry never persist',()=>{
 const db=new Database(':memory:');const store=createWaypointStore(db as any);
 const input={title:'Water',note:'',lat:45,lng:-122,duration:'week'};
 for(const patch of [{lat:NaN},{lat:91},{lng:181},{title:''},{title:'x'.repeat(81)},{note:'x'.repeat(501)},{duration:'forever'}])assert.throws(()=>store.add('trail',1,{...input,...patch}));
 assert.equal(store.list('trail').length,0);db.close();
});
