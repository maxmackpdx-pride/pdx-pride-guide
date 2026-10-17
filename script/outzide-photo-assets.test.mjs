import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import sharp from 'sharp';
const base=path.resolve('client/public/outzide-map');const places=JSON.parse(fs.readFileSync(path.join(base,'places.json'))).places;const photos=places.filter(p=>p.photo);const sources=JSON.parse(fs.readFileSync('script/data/outzide-photos/sources.json'));
test('all75priority destinations and48additional photo assignments have complete licensed layered assets',async()=>{
 assert.equal(places.length,385);assert.equal(photos.length,123);assert.equal(new Set(photos.map(p=>p.photo.src)).size,120);
 const priority=photos.filter(p=>p.photo.rank>=1&&p.photo.rank<=75);assert.equal(priority.length,75);assert.deepEqual(priority.map(p=>p.photo.rank).sort((a,b)=>a-b),Array.from({length:75},(_,i)=>i+1));
 assert.equal(photos.filter(p=>p.photo.overlayGlowSrc).length,20);
 for(const p of photos){const photo=p.photo;assert.equal(photo.treatment,'layered-v2');for(const key of ['author','sourceUrl','license','licenseUrl','alt'])assert.ok(photo[key],`${p.id} missing${key}`);
  assert.ok(sources.some(s=>s.id===p.id&&s.sourceUrl===photo.sourceUrl),`${p.id} attribution missing`);
  for(const key of ['src','overlaySrc',...(photo.overlayGlowSrc?['overlayGlowSrc']:[])]){assert.match(photo[key],/^assets\/photos\/[a-zA-Z0-9._/-]+$/);assert.ok(fs.existsSync(path.join(base,photo[key])),`${p.id} missing ${key}`);}
  assert.equal(photo.width,2048);assert.ok(photo.height>0);assert.equal(photo.variants.length,3);
  for(const v of photo.variants){const m=await sharp(path.join(base,v.src)).metadata();assert.equal(m.width,v.width);assert.ok(Math.abs(m.width/m.height-photo.width/photo.height)<.01);}
 }
});
test('SVGartwork is self-contained, image-aligned and separates terrain, trees, sky and water',()=>{
 for(const src of new Set(photos.map(p=>p.photo.overlaySrc))){const svg=fs.readFileSync(path.join(base,src),'utf8');assert.doesNotMatch(svg,/<script|<image|<foreignObject|(?:href|onload)=/i);for(const id of ['sky','trees','land','water'])assert.ok(svg.includes(`clipPath id="${id}"`));assert.ok(svg.includes('clip-path="url(#land)"'));assert.ok(svg.includes('clip-path="url(#trees)"'));const record=JSON.parse(fs.readFileSync('script/data/outzide-photos/overlays.json')).find(x=>x.overlaySrc===src);if(record.skyNodes)assert.ok(svg.includes('#ff8a32'));if(record.treeNodes)assert.ok(svg.includes('#70d63e'));
  const p=photos.find(p=>p.photo.overlaySrc===src).photo;assert.ok(svg.includes(`width="${p.width}" height="${p.height}"`));
 }
});
