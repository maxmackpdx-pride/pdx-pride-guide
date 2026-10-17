import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const app=readFileSync(new URL('../client/public/outzide-map/app.js',import.meta.url),'utf8');
const host=readFileSync(new URL('../client/src/pages/Outz.tsx',import.meta.url),'utf8');
const origin='https://www.zaylist.com';

test('iframe accepts view commands only from its same-origin host and reports view on hello',()=>{
 const sent=[],actions=[];
 const parent={postMessage:(data,target)=>sent.push({data,target})};
 let receive;
 const context={parent,location:{origin},state:{view:'list'},document:{documentElement:{dataset:{mapPhase:'first-frame'}}},
  window:{addEventListener:(name,fn)=>{receive=fn;}},openResults:()=>actions.push('list'),setMapControls:value=>actions.push(value)};
 vm.runInNewContext(app.match(/function publishView\(\)\{[^\n]+/)[0]+ '\n'+app.slice(app.lastIndexOf("window.addEventListener('message',event=>{")),context);
 const command={origin,source:parent,data:{source:'outzide-host',type:'set-view',view:'list'}};
 receive({...command,origin:'https://other.example'});
 receive({...command,source:{}});
 receive({...command,data:{...command.data,source:'other'}});
 receive({...command,data:{...command.data,view:'invalid'}});
 assert.deepEqual(actions,[]);
 receive(command);
 receive({...command,data:{...command.data,view:'map'}});
 assert.deepEqual(actions,['list',false]);
 receive({...command,data:{source:'outzide-host',type:'hello'}});
 assert.equal(sent[0].data.type,'view-change');
 assert.equal(sent[0].data.view,'list');
 assert.equal(sent[0].target,origin);
 assert.equal(sent[1].data.type,'map-ready');
});

test('setView reports both transitions through the bridge',()=>{
 const sent=[],parent={postMessage:(data,target)=>sent.push({data,target})};
 const context={parent,window:{},location:{origin},state:{view:'map'},document:{body:{dataset:{}}},
  $:()=>({classList:{toggle(){}}}),$$:()=>[],syncBrowseHandle(){},requestAnimationFrame(){}};
 vm.runInNewContext(app.match(/function publishView\(\)\{[^\n]+/)[0]+'\n'+app.match(/function setView\(view\)\{[^\n]+/)[0]+"\nsetView('list');setView('map');",context);
 assert.deepEqual(sent.map(row=>row.data.view),['list','map']);
 assert.ok(sent.every(row=>row.target===origin&&row.data.source==='outzide-map'));
});

test('host validates view messages and emits drawer events only when the view changes',()=>{
 const events=[],iframe={};
 const context={frame:{current:{contentWindow:iframe}},sheetOpen:{current:false},restoreView:'map',
  window:{location:{origin},dispatchEvent:event=>events.push(event)},CustomEvent:class {constructor(type,options){this.type=type;this.detail=options.detail;}}};
 const source=host.slice(host.indexOf('    const receive=(event:MessageEvent)=>{'),host.indexOf("    window.addEventListener('message',receive)"));
 vm.runInNewContext(ts.transpile(source+'\nglobalThis.receive=receive;', {target:ts.ScriptTarget.ES2022}),context);
 const command={origin,source:iframe,data:{source:'outzide-map',type:'view-change',view:'list'}};
 context.receive({...command,origin:'https://other.example'});
 context.receive({...command,source:{}});
 context.receive({...command,data:{...command.data,source:'other'}});
 context.receive({...command,data:{...command.data,view:'invalid'}});
 assert.equal(events.length,0);
 context.receive(command);context.receive(command);
 context.receive({...command,data:{...command.data,view:'map'}});
 assert.deepEqual(events.map(event=>event.detail.open),[true,false]);
 assert.ok(events.every(event=>event.type==='zaylist:drawer'&&event.detail.keepCollapsedOnClose));
});
