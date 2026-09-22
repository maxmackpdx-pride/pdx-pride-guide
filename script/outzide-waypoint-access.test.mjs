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
