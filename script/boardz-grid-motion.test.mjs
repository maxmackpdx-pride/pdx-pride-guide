import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

function setup(quiet=false){
 const cleanups=[],observers=[],animations=[];
 const card=(left,top,expanded=false)=>({offsetLeft:left,offsetTop:top,classList:{contains:()=>expanded},animate(frames){const animation={frames,cancel(){this.cancelled=true},onfinish:null};animations.push(animation);return animation;}});
 const selected=card(0,0,true),neighbor=card(158,0),grid={children:[selected,neighbor]};
 const code=readFileSync(new URL('../client/src/components/board/useBoardGridMotion.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
 const context={exports:{},useRef:value=>({current:value}),useLayoutEffect:fn=>cleanups.push(fn()),window:{matchMedia:()=>({matches:quiet})},document:{documentElement:{classList:{contains:()=>false},dataset:{}}},ResizeObserver:class{constructor(fn){observers.push(fn)}observe(){}disconnect(){}},requestAnimationFrame:fn=>{fn();return 1},cancelAnimationFrame(){}};
 vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
 context.exports.useBoardGridMotion({current:grid});
 return {neighbor,animations,resize:()=>observers[0](),dispose:()=>cleanups.forEach(fn=>fn?.())};
}
test('neighbors move from the old position to their reflowed position, and back on close',()=>{
 const h=setup();h.neighbor.offsetLeft=0;h.neighbor.offsetTop=500;h.resize();
 assert.equal(h.animations[0].frames[0].transform,'translate(158px, -500px)');
 h.neighbor.offsetLeft=158;h.neighbor.offsetTop=0;h.resize();
 assert.equal(h.animations[1].frames[0].transform,'translate(-158px, 500px)');
 assert.equal(h.animations[0].cancelled,true);
 h.dispose();assert.equal(h.animations[1].cancelled,true);
});
test('reduced motion keeps the final grid layout without movement',()=>{
 const h=setup(true);h.neighbor.offsetTop=500;h.resize();assert.equal(h.animations.length,0);h.dispose();
});
