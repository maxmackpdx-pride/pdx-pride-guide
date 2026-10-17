import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import sharp from 'sharp';
const base=path.resolve('client/public/outzide-map');const places=JSON.parse(fs.readFileSync(path.join(base,'places.json'))).places;const photos=places.filter(p=>p.photo);const sources=JSON.parse(fs.readFileSync('script/data/outzide-photos/sources.json'));const overlays=JSON.parse(fs.readFileSync('script/data/outzide-photos/overlays.json'));
test('all75 priority destinations and48 additional assignments have complete attributed layered artwork',async()=>{
 assert.equal(places.length,385);assert.equal(photos.length,123);assert.equal(new Set(photos.map(p=>p.photo.src)).size,120);
 const priority=photos.filter(p=>p.photo.rank>=1&&p.photo.rank<=75);assert.equal(priority.length,75);assert.deepEqual(priority.map(p=>p.photo.rank).sort((a,b)=>a-b),Array.from({length:75},(_,i)=>i+1));
 assert.equal(photos.filter(p=>p.photo.overlayGlowSrc).length,20);
 for(const p of photos){const photo=p.photo;assert.equal(photo.treatment,'sculpted-v3');for(const key of ['author','sourceUrl','license','licenseUrl','alt'])assert.ok(photo[key],`${p.id} missing ${key}`);
  assert.ok(sources.some(s=>s.id===p.id&&s.sourceUrl===photo.sourceUrl&&s.output===photo.src&&s.width===photo.width&&s.height===photo.height),`${p.id} attribution or delivery dimensions missing`);
  for(const key of ['src','overlaySrc',...(photo.overlayGlowSrc?['overlayGlowSrc']:[])]){assert.match(photo[key],/^assets\/photos\/v3\/[a-zA-Z0-9._/-]+$/);assert.ok(fs.existsSync(path.join(base,photo[key])),`${p.id} missing ${key}`);}
  assert.equal(photo.width,2048);assert.ok(photo.height>0);assert.deepEqual(photo.variants.map(v=>v.width),[640,1280,2048]);assert.deepEqual(photo.overlayVariants.map(v=>v.width),[640,1280,2048]);
  for(const v of photo.variants){const m=await sharp(path.join(base,v.src)).metadata();assert.equal(m.width,v.width);assert.ok(Math.abs(m.width/m.height-photo.width/photo.height)<.01);}
  const {cx,cy,rx,ry}=photo.quiet;assert.ok([cx,cy,rx,ry].every(Number.isFinite));assert.ok(cx-rx>=0&&cx+rx<=1&&cy-ry>=0&&cy+ry<=1);const area=Math.PI*rx*ry*.94**2;assert.ok(area>=.3&&area<=.45);
  if(photo.overlayGlowSrc){assert.ok(photo.rank>=1&&photo.rank<=20);const svg=fs.readFileSync(path.join(base,photo.overlayGlowSrc),'utf8');assert.doesNotMatch(svg,/<image|<filter|<script|foreignObject|(?:href|onload)=/i);assert.ok(Buffer.byteLength(svg)<12000);}
 }
});
test('responsive artwork embeds aligned transparent pixels and no remote references',async()=>{
 const unique=new Map(photos.map(p=>[p.photo.overlaySrc,p.photo]));assert.equal(overlays.length,120);
 for(const [src,photo] of unique){const record=overlays.find(x=>x.overlaySrc===src);assert.ok(record,src);if(photo.overlayGlowSrc){assert.equal(record.nodeReview?.status,'accepted');assert.equal(record.nodeReview.nodesHash,record.nodesHash);}assert.equal(record.finalReview?.status,'accepted');for(const hash of ['baseHash','artHash','wrapperHash','regionHash','nodesHash'])assert.equal(record.finalReview[hash],record[hash]);
  for(const variant of photo.overlayVariants){const svg=fs.readFileSync(path.join(base,variant.src),'utf8');assert.doesNotMatch(svg,/<script|<foreignObject|onload=|https?:\/\/(?!www\.w3\.org)/i);const embedded=[...svg.matchAll(/href="data:image\/webp;base64,([A-Za-z0-9+/=]+)"/g)];assert.equal(embedded.length,1);assert.equal((svg.match(/<image\b/g)||[]).length,1);const bytes=Buffer.from(embedded[0][1],'base64');const m=await sharp(bytes).metadata();assert.equal(m.width,variant.width);assert.ok(m.hasAlpha);assert.ok(Math.abs(m.width/m.height-photo.width/photo.height)<.01);assert.match(svg,/feComponentTransfer/);if(record.exclusion?.polygons?.length)assert.match(svg,/mask="url\(#allowed\)"/);
  }
 }
});
