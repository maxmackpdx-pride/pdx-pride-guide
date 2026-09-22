import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8');
class Element {
 children=[];dataset={};style={setProperty(){}};attributes={};
 appendChild(child){child.parent=this;this.children.push(child);return child;}
 replaceChildren(){this.children=[];}
 setAttribute(key,value){this.attributes[key]=value;}
 remove(){this.parent.children=this.parent.children.filter(child=>child!==this);}
}
test('waypoint faces cap at five, retain anonymous initials, show overflow, and clear stale stacks',()=>{
 const body=new Element();const context=vm.createContext({document:{body,createElement:()=>new Element(),getElementById:id=>body.children.find(el=>el.id===id)}});
 vm.runInContext(source.slice(source.indexOf('function renderCheckinStacks('),source.indexOf('function drawClusterCount(')),context);
 context.stacks=[{key:'a',x:10,y:20,color:'cyan',count:8,faces:Array.from({length:8},(_,i)=>({initial:i===0?'?':String(i)}))}];
 vm.runInContext('renderCheckinStacks(stacks)',context);
 const stack=body.children[0].children[0];assert.equal(stack.children.length,6);assert.equal(stack.children[0].textContent,'?');assert.equal(stack.children[5].textContent,'+3');
 context.stacks[0].count=5;context.stacks[0].faces.length=5;vm.runInContext('renderCheckinStacks(stacks)',context);assert.equal(stack.children.length,5);
 vm.runInContext('renderCheckinStacks([])',context);assert.equal(body.children[0].children.length,0);
});
test('mixed waypoint kinds condense at overview zoom and separate at street zoom',()=>{
 const context=vm.createContext({});vm.runInContext(source.slice(source.indexOf('function clusterPlaceMarkers('),source.indexOf('function renderCheckinStacks(')),context);
 context.items=['place','event','housing'].map((kind,i)=>({p:{x:100+i*10,y:100},feature:{properties:{kind,key:kind},geometry:{coordinates:[-122.67+i*.001,45.52]}}}));
 assert.equal(vm.runInContext("clusterPlaceMarkers(items,null,13,900,900).byKey.get('place').members.length",context),3);
 assert.equal(vm.runInContext('clusterPlaceMarkers(items,null,17,900,900).byKey.size',context),0);
});
