import test from 'node:test';
import assert from 'node:assert/strict';
import {clusterWaypoints} from '../client/public/outzide-map/assets/waypoint-clusters.js';
const points=[{id:'a',kind:'trail',lat:45,lng:-122},{id:'b',kind:'trail',lat:45.1,lng:-122},{id:'c',kind:'beach',lat:45,lng:-122}];
const project=([lng,lat])=>({x:lng*100,y:lat*100});
test('regional clusters merge nearby kinds without losing destinations',()=>{
 const groups=clusterWaypoints(points,project,6);
 assert.deepEqual(groups.map(g=>g.members.map(p=>p.id)),[['a','b','c']]);
 assert.equal(groups[0].kind,'mixed');
 assert.ok(Math.abs(groups[0].lat-45.033333)<.00001);
 assert.deepEqual(clusterWaypoints([...points].reverse(),project,6),groups);
});
test('selected destinations stay individual and close zoom separates all pins',()=>{
 const selected=clusterWaypoints(points,project,6,'a');
 assert.equal(selected.length,2);assert.deepEqual(selected.find(g=>g.members[0].id==='a').members.map(p=>p.id),['a']);
 assert.equal(clusterWaypoints(points,project,14).length,3);
});
test('wider views merge geographically separated destinations',()=>{
 const far=[...points,{id:'d',kind:'trail',lat:48,lng:-122}];
 assert.equal(clusterWaypoints(far,project,10).length,3);
 assert.equal(clusterWaypoints(far,([lng,lat])=>({x:lng*10,y:lat*10}),5).length,1);
 assert.equal(clusterWaypoints([...far,{id:'invalid',lat:NaN,lng:0}],project,10).flatMap(g=>g.members).length,4);
});
test('regional mobile views collapse overlapping activity kinds but preserve selected markers',()=>{
 const spread=[{id:'trail',kind:'trail',lat:45,lng:-122},{id:'beach',kind:'beach',lat:45.3,lng:-122},{id:'stay',kind:'stay',lat:45.5,lng:-122}];
 const project=([lng,lat])=>({x:lng*100,y:lat*100});
 const regional=clusterWaypoints(spread,project,6,undefined,{mobile:true});
 assert.equal(regional.length,1);assert.equal(regional[0].kind,'mixed');
 assert.deepEqual(regional[0].members.map(p=>p.id),['beach','stay','trail']);
 assert.equal(clusterWaypoints(spread,project,6,'stay',{mobile:true}).length,2);
 assert.equal(clusterWaypoints(spread,project,14,undefined,{mobile:true}).length,3);
});
test('mobile grouping uses a larger screen radius near city zoom',()=>{
 const spaced=[{id:'a',kind:'trail',lat:45,lng:-122},{id:'b',kind:'trail',lat:45,lng:-120.98}];
 const project=([lng])=>({x:lng*100,y:0});
 assert.equal(clusterWaypoints(spaced,project,9).length,2);
 assert.equal(clusterWaypoints(spaced,project,9,undefined,{mobile:true}).length,1);
});
