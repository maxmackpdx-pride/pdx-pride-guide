import test from 'node:test';
import assert from 'node:assert/strict';
import {readWaypointPalette} from '../client/public/outzide-map/assets/waypoint-palette.js';

test('marker pass snapshots shared tokens before subsequent DOM work',()=>{
 const root={},tokens={beach:'--cyan',spring:'--cyan',mixed:'--yellow'},reads=[];
 let dirty=false;
 const palette=readWaypointPalette(tokens,root,node=>{
  assert.equal(node,root);reads.push('style');
  return {getPropertyValue(token){assert.equal(dirty,false,'no computed-style reads after writes begin');reads.push(token);return {'--cyan':' #00FFFF ','--yellow':' #FFFF00 ','--status-closed':' #ff2400 '}[token]||'';}};
 });
 dirty=true;
 for(let i=0;i<400;i++){assert.equal(palette.colors.beach,'#00FFFF');assert.equal(palette.colors.spring,'#00FFFF');assert.equal(palette.closed,'#FF2400');}
 assert.deepEqual(reads,['style','--cyan','--yellow','--status-closed']);
});

test('each pass sees current theme values and retains the existing closed fallback',()=>{
 let theme='#00FFFF';
 const readStyle=()=>({getPropertyValue:token=>token==='--cyan'?theme:''});
 const first=readWaypointPalette({beach:'--cyan'}, {},readStyle);
 theme='#12ABCD';
 const second=readWaypointPalette({beach:'--cyan'}, {},readStyle);
 assert.equal(first.colors.beach,'#00FFFF');assert.equal(second.colors.beach,'#12ABCD');
 assert.equal(second.closed,'#FF0000');
});
