import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

function harness({quiet=false,throws=false,animate=true}={}) {
  let cleanup;
  const animations=[],timers=[];
  const source={style:{visibility:''},isConnected:true,getBoundingClientRect:()=>({left:20,top:180,width:136,height:150})};
  const target={left:300,top:40,width:375,height:667};
  const panel={dataset:{},getBoundingClientRect:()=>target};
  if(animate)panel.animate=(frames)=>{
    if(throws)throw Error('animation unavailable');
    const animation={frames,cancel(){this.cancelled=true},onfinish:null};animations.push(animation);return animation;
  };
  const context={exports:{},createContext:()=>({}),useContext:()=>({element:source,rect:source.getBoundingClientRect()}),useLayoutEffect:effect=>{cleanup=effect()},
    window:{matchMedia:()=>({matches:quiet,addEventListener(){},removeEventListener(){}})},document:{documentElement:{classList:{contains:()=>false},dataset:{}}},
    MutationObserver:class{observe(){}disconnect(){}},setTimeout:fn=>{timers.push(fn);return timers.length},clearTimeout(){}};
  const sourceCode=readFileSync(new URL('../client/src/components/board/BoardCardContinuity.tsx',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
  vm.runInNewContext(ts.transpileModule(sourceCode,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,context);
  const api=context.exports;
  api.useBoardCardContinuity({current:{closest:()=>panel}});
  return {api,source,target,panel,animations,timers,cleanup:()=>cleanup()};
}

test('scale expansion begins at the selected card and ends at the expanded layout',()=>{
  const h=harness();
  const [start,end]=h.animations[0].frames;
  const [sx,sy]=start.scale.split(' ').map(Number);
  const [x,y]=start.translate.match(/-?[\d.]+/g).map(Number);
  assert.equal(h.target.left+(h.target.width-136)/2+x,20);
  assert.equal(h.target.top+(h.target.height-150)/2+y,180);
  assert.equal(h.target.width*sx,136);
  assert.equal(h.target.height*sy,150);
  assert.equal(end.scale,'1 1');
  assert.equal(start.transform,undefined);
  assert.equal(h.source.style.visibility,'hidden');
  h.cleanup();assert.equal(h.source.style.visibility,'');
});

test('close reverses the edges, completes once and restores the source',()=>{
  const h=harness();let closed=0;
  assert.equal(h.api.closeBoardCard(h.panel,()=>closed++),true);
  h.api.closeBoardCard(h.panel,()=>closed++);
  assert.equal(h.animations.length,2);
  assert.equal(h.animations[1].frames[0].scale,'1 1');
  h.animations[1].onfinish();h.timers.forEach(fn=>fn());
  assert.equal(closed,1);
  h.cleanup();assert.equal(h.api.closeBoardCard(h.panel,()=>{}),false);
  assert.equal(h.source.style.visibility,'');
});

for(const options of [{quiet:true},{throws:true},{animate:false}])test(`close stays usable when motion cannot run: ${JSON.stringify(options)}`,()=>{
  const h=harness(options);let closed=0;
  assert.equal(h.api.closeBoardCard(h.panel,()=>closed++),true);
  assert.equal(closed,1);h.cleanup();assert.equal(h.source.style.visibility,'');
});

test('interrupted animation cannot trap the dialog',()=>{
  const h=harness();let closed=0;h.api.closeBoardCard(h.panel,()=>closed++);
  h.animations[1].cancel();h.timers.forEach(fn=>fn());assert.equal(closed,1);h.cleanup();
});
