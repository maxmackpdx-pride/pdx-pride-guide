import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../client/public/outzide-map/app.js',import.meta.url),'utf8');
const init=source.slice(source.indexOf('async function init()'),source.indexOf('function registerTools()'));
async function boot({catalogFails=false}={}) {
 const messages=[],nodes=new Map();let rendered=false,view=null;
 const context={URL,structuredClone,console:{error(){},warn(){}},location:{href:'https://www.zaylist.com/outzide-map/index.html',origin:'https://www.zaylist.com'},parent:{postMessage(message){messages.push(message.type)}},metadata:null,details:null,routes:null,feed:null,beaches:null,places:[],map:null,state:{view:'list'},mobileLightMode:false,CASCADIA_MIN_ZOOM:2,fetch:async()=>({ok:!catalogFails,json:async()=>({places:[{id:'trail',name:'Trail'}],fetchedAt:'2026-09-24'})}),$:selector=>{if(!nodes.has(selector))nodes.set(selector,{hidden:true});return nodes.get(selector)},stamp:x=>x,renderList(){rendered=true},setView(value){view=value},mlcontour:{DemSource:class {setupMaplibre(){} contourProtocolUrl(){return 'contours'}}},mapzSurfaceStyle:()=>({sources:{elevation:{}},layers:[{id:'land-relief'}]}),brightenOutzideTerrain:x=>x,addI5Spectrum(){},addCascadiaOutline(){},maplibregl:{Map:class {constructor(){throw new Error('Failed to initialize WebGL')}}}};
 await vm.runInNewContext(init+'\ninit()',context);return {messages,nodes,rendered,view};
}
test('WebGL failure leaves loaded field guide accessible',async()=>{const r=await boot();assert.equal(r.rendered,true);assert.equal(r.view,'list');assert.deepEqual(r.messages,['browse-ready']);assert.equal(r.nodes.get('#map-failure').hidden,false)});
test('catalogue failure reports error without claiming readiness',async()=>{const r=await boot({catalogFails:true});assert.equal(r.rendered,false);assert.deepEqual(r.messages,['browse-error']);assert.match(r.nodes.get('#results').innerHTML,/couldn’t load/)});
