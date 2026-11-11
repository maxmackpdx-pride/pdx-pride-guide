import test from 'node:test';
import assert from 'node:assert/strict';
import {assertCompiledFunction} from './react-compiler-function-proof.mjs';
const source=`import {c as _c} from 'react/compiler-runtime';
export function Artwork(){const $=_c(2);return $;}
export default function PlacezQuickCard(){return Date.now();}`;
test('compiled sibling cannot stand in for PlacezQuickCard',()=>{
 assert.equal(assertCompiledFunction(source,'Artwork',true).compiled,true);
 assert.equal(assertCompiledFunction(source,'PlacezQuickCard',false).compiled,false);
 assert.throws(()=>assertCompiledFunction(source,'PlacezQuickCard',true),/was skipped/);
});
test('own cache allocation proves intended transformed function',()=>{
 const compiled=source.replace('return Date.now();','const $=_c(8);return $;');
 assert.deepEqual(assertCompiledFunction(compiled,'PlacezQuickCard',true).memoSlots,[8]);
});
test('nested helper allocation cannot stand in for outer function',()=>{
 const nested=source.replace('return Date.now();','function helper(){const $=_c(8);return $;}return helper();');
 assert.equal(assertCompiledFunction(nested,'PlacezQuickCard',false).compiled,false);
});
test('missing intended function is not accepted as a valid exclusion',()=>{
 assert.throws(()=>assertCompiledFunction(source,'NativePlacezFace',false),/Cannot find intended/);
});
