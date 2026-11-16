import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {build} from 'esbuild';
const {outputFiles}=await build({entryPoints:['client/src/components/placez/nativeModel.ts'],bundle:true,platform:'node',format:'esm',write:false,packages:'external'});
const {nativePlacezModel,hasPlacezArtwork}=await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
test('Silverado uses recovered immutable listing7 artwork and bar token',()=>{
 const m=nativePlacezModel({id:7,name:'Silverado',type:'bar'});
 assert.equal(m.imageUrl,'/placez-recovered-batch/Silverado-building.png');assert.equal(m.accent,'var(--cat-bars)');assert.equal(m.category,'Bar');
 for(const size of ['small','square','tall','wide-map','expanded'])assert.ok(fs.existsSync('client/public'+m.glassUrl(size)));
});
test('Silverado recovery is byte-verified and preserves previous artworks/fallback',()=>{
 const p=JSON.parse(fs.readFileSync('client/public/placez-recovered-batch/Silverado-provenance.json'));
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('client/public/placez-recovered-batch/'+p.artwork)).digest('hex'),p.artworkSha256);
 for(const id of [2,3,5,9,23,30,31])assert.ok(hasPlacezArtwork(id));
 assert.equal(nativePlacezModel({id:9999,name:'Unknown Venue',type:'shop',imageUrl:'/existing.png'}).imageUrl,'/existing.png');
 assert.equal(hasPlacezArtwork(118),false);
});

test('Silverado source attribution and rights are visible in both expanded cards',()=>{for(const file of ['PlacezQuickCard.tsx','NativePlacezExpanded.tsx']){const s=fs.readFileSync('client/src/components/placez/'+file,'utf8');assert.ok(s.includes('===7&&'));assert.ok(s.includes('August 17, 2025 photograph'));assert.ok(s.includes('Historical appearance may differ today'));assert.ok(s.includes('/placez-recovered-batch/Silverado-provenance.json'));}});

