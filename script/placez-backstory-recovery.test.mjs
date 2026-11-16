import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {build} from 'esbuild';
const {outputFiles}=await build({entryPoints:['client/src/components/placez/nativeModel.ts'],bundle:true,platform:'node',format:'esm',write:false,packages:'external'});
const {nativePlacezModel,hasPlacezArtwork}=await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
test('Backstory uses recovered immutable listing62 artwork and shop token',()=>{
 const m=nativePlacezModel({id:62,name:'Backstory Books & Yarn',type:'shop'});
 assert.equal(m.imageUrl,'/placez-recovered-batch/Backstory-building.png');assert.equal(m.accent,'var(--cat-shops)');assert.equal(m.category,'Shop');
 for(const size of ['small','square','tall','wide-map','expanded'])assert.ok(fs.existsSync('client/public'+m.glassUrl(size)));
});
test('Backstory recovery is byte-verified and preserves previous artworks/fallback',()=>{
 const p=JSON.parse(fs.readFileSync('client/public/placez-recovered-batch/Backstory-provenance.json'));
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('client/public/placez-recovered-batch/'+p.artwork)).digest('hex'),p.sha256);
 for(const id of [2,3,5,9,23,30,31])assert.ok(hasPlacezArtwork(id));
 assert.equal(nativePlacezModel({id:9999,name:'Unknown Venue',type:'shop',imageUrl:'/existing.png'}).imageUrl,'/existing.png');
 assert.equal(hasPlacezArtwork(118),false);
});
