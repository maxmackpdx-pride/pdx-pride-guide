import test from 'node:test';
import assert from 'node:assert/strict';
import {clusterWaypoints} from '../client/public/outzide-map/assets/waypoint-clusters.js';
const points=[{id:'a',kind:'trail',lat:45,lng:-122},{id:'b',kind:'trail',lat:45.1,lng:-122},{id:'c',kind:'beach',lat:45,lng:-122}];
const project=([lng,lat])=>({x:lng*100,y:lat*100});
test('nearby matching kinds cluster without losing or mixing destinations',()=>{
 const groups=clusterWaypoints(points,project,6);
 assert.deepEqual(groups.map(g=>g.members.map(p=>p.id)),[['a','b'],['c']]);
 assert.equal(groups[0].lat,45.05);
 assert.deepEqual(clusterWaypoints([...points].reverse(),project,6),groups);
});
test('selected destinations stay individual and close zoom separates all pins',()=>{
 assert.equal(clusterWaypoints(points,project,6,'a').length,3);
 assert.equal(clusterWaypoints(points,project,14).length,3);
});
test('wider views merge geographically separated destinations',()=>{
 const far=[...points,{id:'d',kind:'trail',lat:48,lng:-122}];
 assert.equal(clusterWaypoints(far,project,10).length,3);
 assert.equal(clusterWaypoints(far,([lng,lat])=>({x:lng*10,y:lat*10}),5).length,2);
 assert.equal(clusterWaypoints([...far,{id:'invalid',lat:NaN,lng:0}],project,10).flatMap(g=>g.members).length,4);
});
