import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createBlendEnhancer} from '../client/public/outzide-map/assets/destination-photos.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}};
function fixture(load){
 let io,mutation;const listeners=new Map();
 const doc={hidden:false,documentElement:{},addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
 const scope={document:doc,IntersectionObserver:class{constructor(fn){this.fn=fn;io=this}observe(){}unobserve(){}disconnect(){this.closed=true}},MutationObserver:class{constructor(fn){this.fn=fn;mutation=this}observe(){}disconnect(){this.closed=true}}};
 const runtime=createBlendEnhancer(scope,load);
 const element=()=>({isConnected:true,dataset:{blendPlace:'silver-falls'},classList:{add(){},remove(){}},closest:()=>null,querySelectorAll:()=>[]});
 return {runtime,doc,element,refresh:el=>runtime.refresh({querySelectorAll:()=>[el]}),visible:(el,value)=>io.fn([{target:el,isIntersecting:value,intersectionRatio:value?1:0}]),prune:()=>mutation.fn(),visibility:()=>listeners.get('visibilitychange')(),io:()=>io};
}
test('hidden discovery art never imports; detached pending imports never mount',async()=>{
 const pending=deferred();let loads=0,mounts=0;
 const f=fixture(()=>{loads++;return pending.promise}),el=f.element();f.refresh(el);await tick();assert.equal(loads,0);
 f.visible(el,true);assert.equal(loads,1);el.isConnected=false;f.prune();
 pending.resolve({hasBlend:()=>true,mountBlend:async()=>{mounts++;return()=>{}}});await tick();assert.equal(mounts,0);f.runtime.dispose();
});
test('pending mount aborts when hidden and its late disposer is called; visible art remounts',async()=>{
 const pending=deferred();let signal,offs=0,calls=0;
 const f=fixture(async()=>({hasBlend:()=>true,mountBlend:async(el,id,opts)=>{signal=opts.signal;calls++;return calls===1?pending.promise:()=>offs++}})),el=f.element();
 f.refresh(el);f.visible(el,true);await tick();f.visible(el,false);assert.equal(signal.aborted,true);
 pending.resolve(()=>offs++);await tick();assert.equal(offs,1);
 f.visible(el,true);await tick();assert.equal(calls,2);f.runtime.dispose();assert.equal(offs,2);assert.equal(f.io().closed,true);
});
test('cloned readiness flags do not skip ownership; page visibility releases mounted art',async()=>{
 let removed=0,mounts=0,offs=0;
 const f=fixture(async()=>({hasBlend:()=>true,mountBlend:async()=>{mounts++;return()=>offs++}})),el=f.element();
 el.dataset.blendReady='1';el.querySelectorAll=()=>[{remove:()=>removed++}];f.refresh(el);assert.equal(removed,1);assert.equal(el.dataset.blendReady,undefined);
 f.visible(el,true);await tick();assert.equal(mounts,1);f.doc.hidden=true;f.visibility();assert.equal(offs,1);
 f.doc.hidden=false;f.visibility();await tick();assert.equal(mounts,2);el.isConnected=false;f.prune();assert.equal(offs,2);f.runtime.dispose();
});
const source=fs.readFileSync(new URL('../client/public/outzide-map/assets/blend-art.js',import.meta.url),'utf8');
const mountSource=source.slice(source.indexOf('export async function mountBlend('),source.indexOf('\n\n',source.indexOf(' }catch(error){dispose();throw error;}'))).replace('export ','');
function mountFixture({size=true}={}){
 const build=deferred(),frames=new Map();let next=0,removed=0,disconnected=0,appends=0;
 const box={dataset:{},remove:()=>removed++,insertAdjacentHTML:()=>appends++};
 const context={BLEND_KEYS:{place:{tall:'recipe'}},RECIPES:{recipe:{W:10,H:10,cutouts:[]}},photoUrl:()=>'/photo',ensureDefs(){},mkGrid:()=>({}),document:{createElement:()=>box},setVars:()=>size,ResizeObserver:class{observe(){}disconnect(){disconnected++}},requestAnimationFrame:fn=>{frames.set(++next,fn);return next},cancelAnimationFrame:id=>frames.delete(id),build:()=>build.promise,qaOn:()=>false,hudMarkup:()=>'<hud>'};
 vm.runInNewContext(mountSource+';globalThis.mount=mountBlend',context);
 return {mount:context.mount,build,frames,container:{prepend(){}},counts:()=>({removed,disconnected,appends})};
}
test('actual mount abort disconnects observer and removes owned subtree before async build resolves',async()=>{
 const f=mountFixture(),controller=new AbortController();const result=f.mount(f.container,'place',{signal:controller.signal});
 controller.abort();assert.deepEqual(f.counts(),{removed:1,disconnected:1,appends:2});f.build.resolve();const off=await result;off();assert.deepEqual(f.counts(),{removed:1,disconnected:1,appends:2});
});
test('actual mount cancels pending size animation frame on abort',async()=>{
 const f=mountFixture({size:false}),controller=new AbortController();const result=f.mount(f.container,'place',{signal:controller.signal});assert.equal(f.frames.size,1);controller.abort();await result;assert.equal(f.frames.size,0);assert.deepEqual(f.counts(),{removed:1,disconnected:0,appends:0});
});
test('actual build stops after pending photo sampling when cancelled',async()=>{
 const photo=deferred(),controller=new AbortController();let appends=0;
 const buildSource=source.slice(source.indexOf('async function build('),source.indexOf(' return qa(rec,name,stats);')+' return qa(rec,name,stats);\n}'.length);
 const context={mkGrid:()=>({}),samplePhoto:()=>photo.promise};vm.runInNewContext(buildSource+';globalThis.buildArt=build',context);
 const result=context.buildArt({W:10,H:10},'recipe',{insertAdjacentHTML:()=>appends++},{src:'/photo'},controller.signal);controller.abort();photo.resolve({});await result;assert.equal(appends,0);
 // Dynamic definitions must belong to the subtree that mount's disposer removes.
 assert.match(source,/art\.insertAdjacentHTML\('beforeend','<svg width="0" height="0"/);
 assert.doesNotMatch(source,/ensureDefs\(\)\.insertAdjacentHTML/);
});

test('pre-aborted mount creates no owned subtree or observer',async()=>{
 const f=mountFixture(),controller=new AbortController();controller.abort();await f.mount(f.container,'place',{signal:controller.signal});assert.deepEqual(f.counts(),{removed:0,disconnected:0,appends:0});
});
