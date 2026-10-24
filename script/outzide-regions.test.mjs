import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {browseRegionFor,browseRegions} from '../client/public/outzide-map/assets/browse-regions.js';
const src=await readFile(new URL('../client/src/lib/outzRegions.ts',import.meta.url),'utf8');
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const mod=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('Placez regions use the same ids as the Outzide map',()=>{
 assert.deepEqual(mod.OUTZ_REGIONS.map(r=>r.id).sort(),browseRegions.map(r=>r.id).sort());
});
test('every Outzide place lands in the same region on both sides',async()=>{
 const places=JSON.parse(await readFile(new URL('../client/public/outzide-map/places.json',import.meta.url),'utf8')).places;
 assert.ok(places.length>300);
 for(const p of places)assert.equal(mod.outzRegionFor(p),browseRegionFor(p),p.id);
});
