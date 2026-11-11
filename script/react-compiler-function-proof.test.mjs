import test from 'node:test';
import assert from 'node:assert/strict';
import {assertCompiledFunction} from './react-compiler-function-proof.mjs';
const source=`import {c as _c} from 'react/compiler-runtime';
export function Artwork(){const $=_c(2);return $;}
export default function PlacezQuickCard(){return Date.now();}`;
test('compiled sibling cannot stand in for PlacezQuickCard',()=>{
 assert.equal(assertCompiledFunction(source,'Artwork',true).compiled,true);
 assert.equal(assertCompiledFunction(source,'PlacezQuickCard',false).compiled,false);
 assert.throws(()=>assertCompiledFunction(source,'PlacezQuickCard',true),/no verified own/);
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

test('Vite CJS import-analysis runtime alias is traced to own function',()=>{
 const transformed=`import __vite__cjsImport0_react_compilerRuntime from "/node_modules/.vite/deps/react_compiler-runtime.js?v=abc";
 const _c = __vite__cjsImport0_react_compilerRuntime["c"];
 export function PlaceCard(){const $=_c(8);return $;}`;
 assert.deepEqual(assertCompiledFunction(transformed,'PlaceCard',true).memoSlots,[8]);
});
test('namespace and zero-sequence runtime calls remain function-specific',()=>{
 const transformed=`import * as runtime from 'react/compiler-runtime';
 export function PlaceCard(){const $=(0,runtime.c)(8);return $;}`;
 assert.deepEqual(assertCompiledFunction(transformed,'PlaceCard',true).memoSlots,[8]);
});
test('unrelated c property cannot fake compiler provenance',()=>{
 const transformed=`import runtime from 'unrelated-library';const _c=runtime.c;
 export function PlaceCard(){const $=_c(8);return $;}`;
 assert.equal(assertCompiledFunction(transformed,'PlaceCard',false).compiled,false);
});
test('CJS transformed compiled sibling still cannot certify target',()=>{
 const transformed=`import runtime from '/node_modules/.vite/deps/react_compiler-runtime.js';const _c=runtime['c'];
 export function Artwork(){const $=_c(8);return $;}
 export function PlaceCard(){return 1;}`;
 assert.equal(assertCompiledFunction(transformed,'PlaceCard',false).compiled,false);
});
