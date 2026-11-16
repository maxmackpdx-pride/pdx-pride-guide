import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {build} from 'esbuild';
const {outputFiles}=await build({entryPoints:['client/src/components/placez/nativeModel.ts'],bundle:true,platform:'node',format:'esm',write:false,packages:'external'});
const {nativePlacezModel,hasPlacezArtwork}=await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
for (const [id,slug] of [[168,'Black-Hole'],[150,'Thrive'],[162,'Fruit']]) {
 test(`Recovered service ${id} uses exact asset, service token, and existing chrome`,()=>{
  const m=nativePlacezModel({id,name:slug,type:'service'});
  assert.equal(m.imageUrl,`/placez-recovered-batch/${slug}-building.png`);
  assert.equal(m.accent,'var(--cat-services)');
  for(const size of ['small','square','tall','wide-map','expanded']) assert.ok(fs.existsSync('client/public'+m.glassUrl(size)));
  const p=JSON.parse(fs.readFileSync(`client/public/placez-recovered-batch/${slug}-provenance.json`));
  assert.equal(p.venueId,id);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync('client/public/placez-recovered-batch/'+p.artwork)).digest('hex'),p.sha256);
 });
}
test('Existing artwork and unreviewed records stay unchanged',()=>{
 for(const id of [2,3,5,9,15,23,30,31])assert.ok(hasPlacezArtwork(id));
 for(const id of [102,115,118,119,9999])assert.equal(hasPlacezArtwork(id),false);
 assert.equal(nativePlacezModel({id:9999,name:'Unknown',type:'service',imageUrl:'/existing.png'}).imageUrl,'/existing.png');
});
