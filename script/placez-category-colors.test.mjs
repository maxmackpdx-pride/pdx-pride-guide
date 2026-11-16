import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import path from 'node:path';
const root=process.cwd();
const bundle=await build({entryPoints:['client/src/components/placez/nativeModel.ts'],bundle:true,platform:'node',format:'esm',write:false,alias:{'@shared':path.join(root,'shared')}});
const {nativePlacezModel}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const css=readFileSync('client/src/components/ds/tokens/colors.css','utf8');
const tokens=Object.fromEntries([...css.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(m=>[m[1],m[2].trim()]));
function resolve(value){const match=/^var\((--[\w-]+)\)$/.exec(value);return match?resolve(tokens[match[1]]):value.toUpperCase();}
const cases=[['bar','#FF1FA0'],['restaurant','#FF7B00'],['cafe','#2BFF00'],['venue','#00FFFF'],['service','#7B00FF'],['shop','#FFB23D'],['hotel','#0066FF']];
for(const [type,color] of cases)test(`${type} non-editorial card uses its canonical category token`,()=>{
 const m=nativePlacezModel({id:99999,name:'Unmapped category fixture',type});
 assert.match(m.accent,/^var\(--cat-/);assert.equal(resolve(m.accent),color);
});
test('all seven approved presentation colors remain unchanged',()=>{
 for(const [id,color] of [[23,'#FF7B00'],[30,'#00e9ef'],[3,'#ff008d'],[31,'#00e9ef'],[5,'#ff008d'],[2,'#00e9ef'],[9,'#FF7B00']]){
  assert.equal(nativePlacezModel({id,name:'Approved fixture',type:'shop'}).accent,color);
 }
});
test('unknown categories retain the existing shared directory fallback',()=>{
 assert.equal(nativePlacezModel({id:99999,name:'Unknown',type:'unknown'}).accent,'#19E3FF');
});
