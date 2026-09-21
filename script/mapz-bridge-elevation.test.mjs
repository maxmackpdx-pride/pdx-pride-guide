import test from 'node:test';
import assert from 'node:assert/strict';
import {bridgeNetwork,bridgeMesh} from '../client/public/home-flight/bridge-roads.js';
const road=coordinates=>({type:'Feature',properties:{brunnel:'bridge',class:'primary'},geometry:{type:'LineString',coordinates}});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('a subdivided deck samples only approaches and ignores the valley floor',()=>{
  const sampled=[];
  const graph=bridgeNetwork([road([[0,0],[10,0],[30,0],[100,0]])],p=>p,p=>{sampled.push(p);return p[0]===0?20:p[0]===100?40:-80;});
  assert.deepEqual(sampled,[[0,0],[100,0]]);
  graph.nodes.forEach(n=>near(n.baseline,20+n.x*.2));
  const mesh=bridgeMesh(graph,true);
  for(let i=2;i<mesh.length;i+=5)assert.ok(mesh[i]>=19.6);
});
test('branched approaches share one continuous junction elevation',()=>{
  const graph=bridgeNetwork([road([[0,0],[100,0],[200,0]]),road([[100,0],[100,100]])],p=>p,p=>p[0]===0?10:p[0]===200?30:50);
  const junction=graph.nodes.find(n=>n.x===100&&n.y===0);
  assert.equal(junction.edges.length,3);near(junction.baseline,30);
});
test('tile fragments and duplicate segments produce the same baseline',()=>{
  const sample=p=>p[0]/10+10;
  const whole=bridgeNetwork([road([[0,0],[200,0]])],p=>p,sample);
  const split=bridgeNetwork([road([[0,0],[100,0]]),road([[100,0],[200,0]]),road([[0,0],[200,0]])],p=>p,sample);
  assert.equal(split.edges.length,2);
  split.nodes.forEach(n=>near(n.baseline,sample(n.coordinate)));
  near(whole.nodes[0].baseline,split.nodes[0].baseline);
});
test('closed elevated loop remains finite without sampling every ground vertex',()=>{
  let samples=0;
  const graph=bridgeNetwork([road([[0,0],[100,0],[100,100],[0,100],[0,0]])],p=>p,()=>{samples++;return 12;});
  assert.equal(samples,1);graph.nodes.forEach(n=>near(n.baseline,12));
});
