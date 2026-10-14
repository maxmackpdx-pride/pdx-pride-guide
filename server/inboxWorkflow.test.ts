import test from 'node:test';import assert from 'node:assert/strict';import Database from 'better-sqlite3';import {createInboxWorkflow,inboxCaseForMutation} from './inboxWorkflow';
test('workflow persists atomic versioned history and rejects stale or unauthorized transitions',()=>{
 const db=new Database(':memory:'),store=createInboxWorkflow(db);
 const item={kind:'submission',entityId:1,status:'waiting',reason:'Confirm time',version:0,actor:'reviewer',primaryOwner:false};
 assert.equal(store.change(item).version,1);
 assert.throws(()=>store.change(item),/changed/);
 assert.equal(store.history('submission',1).length,1);
 store.change({...item,status:'escalated',reason:'Ownership dispute',version:1});
 assert.throws(()=>store.change({...item,status:'review',version:2}),/primary owner/);
 assert.equal(store.get('submission',1)?.status,'escalated');
 assert.equal(store.change({...item,status:'review',version:2,primaryOwner:true}).version,3);
 assert.equal(store.history('submission',1).length,3);
 assert.throws(()=>store.change({...item,entityId:2,reason:''}),/reason/);
 assert.equal(store.get('submission',2),undefined);
 db.close();
});
test('guard resolves case identity across all decision routes and ignores unrelated routes',()=>{
 for(const [path,kind] of [['submissions/1/approve','submission'],['gifting/reports/2/resolve','gifting_report'],['gifting/3/reject','gifting_flagged'],['river-brats/reports/4/resolve','river_brats'],['gigs/5/status','gig_pending']])assert.equal(inboxCaseForMutation('/api/admin/'+path)?.kind,kind);
 assert.equal(inboxCaseForMutation('/api/admin/team'),null);
});
