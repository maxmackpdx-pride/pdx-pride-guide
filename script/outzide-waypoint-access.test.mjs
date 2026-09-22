import test from 'node:test';import assert from 'node:assert/strict';
import {createWaypointAccess} from '../client/public/outzide-map/assets/waypoint-access.js';
test('guests cannot open individual or clustered waypoints; sign-in resumes only latest intent',()=>{
 const requests=[],opened=[];const gate=createWaypointAccess({requestSignup:id=>requests.push(id),onRevoke(){}});
 assert.equal(gate.run(()=>opened.push('trail'),'trail'),false);
 gate.run(()=>opened.push('cluster'),'cluster');assert.deepEqual(opened,[]);assert.deepEqual(requests,['trail','cluster']);
 gate.update(false);assert.deepEqual(opened,[]);gate.update(true);assert.deepEqual(opened,['cluster']);
 gate.run(()=>opened.push('signed-in'),'signed-in');assert.deepEqual(opened,['cluster','signed-in']);
});
test('dismissal drops pending intent; logout revokes open-card access',()=>{
 let opened=0,revoked=0;const gate=createWaypointAccess({requestSignup(){},onRevoke(){revoked++;}});
 gate.run(()=>opened++,'trail');gate.cancel();gate.update(true);assert.equal(opened,0);
 gate.update(false);gate.run(()=>opened++,'beach');assert.equal(opened,0);assert.equal(revoked,1);
 gate.update('true');assert.equal(opened,0,'only an actual boolean grants access');
});
test('a shared destination opens for guests without granting access to other destinations',()=>{
 const requested=[],opened=[];const gate=createWaypointAccess({guestPlaceId:'shared-trail',requestSignup:id=>requested.push(id),onRevoke(){}});
 assert.equal(gate.run(()=>opened.push('shared'),'shared-trail'),true);
 assert.equal(gate.run(()=>opened.push('other'),'another-trail'),false);
 assert.deepEqual(opened,['shared']);assert.deepEqual(requested,['another-trail']);
 gate.cancel();gate.update(false);
 assert.equal(gate.run(()=>opened.push('shared-again'),'shared-trail'),true);
 assert.equal(gate.run(()=>opened.push('cluster'),'cluster:shared-trail,another-trail'),false);
 assert.deepEqual(opened,['shared','shared-again']);
});
