import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../client/public/outzide-map/index.html',import.meta.url),'utf8');
const code=html.match(/<script id="outzide-asset-recovery">([\s\S]*?)<\/script>/)[1];
function run(query=''){
 const handlers={},timers=[],navigations=[],panels=[];
 const node=()=>({children:[],style:{},setAttribute(){},append(...items){this.children.push(...items)}});
 const document={body:{append:n=>panels.push(n)},createElement:node,addEventListener:(type,fn)=>handlers[type]=fn};
 vm.runInNewContext(code,{URL,Date,document,window:{addEventListener:(type,fn)=>handlers[type]=fn},location:{href:'https://www.zaylist.com/outzide-map/index.html?place=rooster-rock'+query,replace:u=>navigations.push(u)},setTimeout:fn=>timers.push(fn)});
 return {handlers,timers,navigations,panels};
}
test('failed styles trigger one recovery and preserve destination',()=>{
 const s=run();s.handlers.error({target:{tagName:'LINK',rel:'stylesheet'}});s.handlers.error({target:{tagName:'SCRIPT'}});
 assert.equal(s.timers.length,1);assert.equal(s.panels.length,1);s.timers[0]();const url=new URL(s.navigations[0]);assert.equal(url.searchParams.get('place'),'rooster-rock');assert.ok(url.searchParams.has('asset-retry'));
});
test('repeated failure stops automatic reload and offers manual recovery',()=>{
 const s=run('&asset-retry=1');s.handlers.error({target:{tagName:'SCRIPT'}});assert.equal(s.timers.length,0);const button=s.panels[0].children[1];assert.equal(button.textContent,'Reload map');button.onclick();assert.equal(new URL(s.navigations[0]).searchParams.has('asset-retry'),false);
});
test('ordinary runtime and image errors do not reload the map',()=>{
 const s=run();s.handlers.error({});s.handlers.error({target:{tagName:'IMG'}});assert.equal(s.timers.length,0);assert.equal(s.panels.length,0);
});
