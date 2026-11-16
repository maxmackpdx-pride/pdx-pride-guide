import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../shared/outzCoordinateCorrections.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {correctOutzCatalogCoordinates:fix}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const original={id:'usfs-5179010262',name:'Abbott Creek Campground',lat:42.69711,lng:-122.49184,status:'EXISTING',statusReason:null};
test('Abbott stale point corrected without status or identity changes',()=>{
 assert.deepEqual(fix(original),{...original,lat:42.880002,lng:-122.508049});
 assert.equal(original.lat,42.69711);
 const corrected=fix(original);assert.strictEqual(fix(corrected),corrected);
});
test('unknown identity and later upstream coordinates remain untouched',()=>{
 for(const p of [{...original,id:'other'},{...original,name:'Other'},{...original,lat:42.881},{...original,lng:-122.508}])assert.strictEqual(fix(p),p);
});
test('both bundled maps carry official Abbott point without changing status',async()=>{
 for(const [file,extract] of [['places.json',x=>x.places],['snapshot.json',x=>x.data.catalog]]){
  const data=JSON.parse(await readFile(new URL('../client/public/outzide-map/'+file,import.meta.url),'utf8'));
  const p=extract(data).find(p=>p.id===original.id);assert.ok(p,file);
  assert.equal(p.name.toLowerCase(),original.name.toLowerCase());assert.equal(p.lat,42.880002);assert.equal(p.lng,-122.508049);
  assert.equal(p.status,'EXISTING');assert.equal(p.statusReason,null);
 }
});
