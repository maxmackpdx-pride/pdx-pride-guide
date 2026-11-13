import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('one internal six-ID registry without changing public PlaceCard or directory transport',()=>{
 const face=read('client/src/components/placez/NativePlacezFace.tsx');
 assert.match(face,/<CardShell category="placez" size=\{size\}/);
 assert.match(face,/VenueFollowButton[^>]*businessId=\{place.id\}/);
 assert.match(face,/motion=\{!calmMode\}/);
 const model=read('client/src/components/placez/nativeModel.ts');
 assert.match(model,/resolveBusinessLocations\(place\)/);assert.match(model,/phone:place.phone\|\|primary\?\.phone\|\|null/);assert.match(model,/placePath\(place.id,place.name\)/);
 assert.doesNotMatch(face,/localStorage|fetch\(/);
 for(const file of ['pages/Directory.tsx','components/home/TodayLocationCard.tsx','components/discovery/PlaceDiscoveryCard.tsx'])assert.match(read('client/src/'+file),/hasPlacezArtwork/);
 assert.match(read('client/src/components/cards/PlaceCard.tsx'),/place:Business;size\?:CardSize;onRequireAuth\?:\(\)=>void/);
});
test('native expanded preserves tools, five pages and unavailable states',()=>{
 const modal=read('client/src/components/PlaceModal.tsx');
 for(const marker of ['apiRequest("PATCH",','/claim','canEditVenue','isOwner','sharePageLink','resolveBusinessLocations','DirectoryMap','NativePlacezExpanded'])assert.ok(modal.includes(marker),marker);
 const expanded=read('client/src/components/placez/NativePlacezExpanded.tsx');
 for(const key of ['feed','info','events','maps','people'])assert.ok(expanded.includes(`key="${key}"`));
 assert.match(expanded,/resetKey=\{selection.request\}/);assert.match(expanded,/selectedPlacezPage\(place.id\)/);assert.match(expanded,/CC BY-SA 4.0/);
 assert.doesNotMatch(expanded,/localStorage|fetch\(/);
});
test('every approved venue has all responsive deliverables and preserved source hashes',()=>{
 const base='client/public/placez-six/';const manifest=JSON.parse(read(base+'source-manifest.json'));
 assert.ok(manifest.assets.length>=41);
 const slugs=['Holocene','Stag-PDX','Alberta-Rose-Theatre','Eagle-Portland','Darcelle-XV','Pizza-Thief'];
 for(const slug of slugs){for(const width of [360,720,1200])assert.ok(existsSync(new URL('../'+base+slug+`-hero-${width}.webp`,import.meta.url)));for(const size of ['small','square','tall','wide'])assert.ok(existsSync(new URL('../'+base+slug+`-${size}-glass.${slug==='Pizza-Thief'?'svg':'webp'}`,import.meta.url)));}
 for(const row of manifest.assets)assert.match(row.sha256,/^[0-9a-f]{64}$/);
 assert.ok(manifest.assets.some(x=>x.original==='Pizza-Thief-hero.png'));
 assert.match(read(base+'Pizza-Thief-CREDITS.txt'),/Another Believer/);
});
test('viewport reservation is opt-in for the approved six, preserving legacy cards',()=>{
 const dock=read('client/src/components/discovery/ScrollDock.tsx');
 assert.match(dock,/reserveCardViewport = false/);
 assert.match(dock,/data-card-viewport-edge=\{reserveCardViewport \? "top" : undefined\}/);
 assert.match(read('client/src/components/discovery/EventzBrowse.tsx'),/reserveCardViewport=\{reserveCardViewport\}/);
 assert.match(read('client/src/pages/Directory.tsx'),/reserveCardViewport=\{!!selectedPlace && hasPlacezArtwork\(selectedPlace.id\)\}/);
});


// New pair is additive; all original six checks above stay intact.
test('new restaurant pair retains independent logos, masks, srcsets and native credits',()=>{
 const base='client/public/placez-next/';
 for(const slug of ['sports-bra','kann']){
  for(const width of [360,720,1200])assert.ok(existsSync(new URL('../'+base+slug+`-hero-${width}.webp`,import.meta.url)));
  for(const suffix of ['logo.svg','header-cutout.svg','wide-header-cutout.svg'])assert.ok(existsSync(new URL('../'+base+slug+'-'+suffix,import.meta.url)));
 }
 for(const size of ['small','square','tall','wide'])assert.ok(existsSync(new URL('../'+base+'restaurant-'+size+'-glass.svg',import.meta.url)));
 const next=read('client/src/components/placez/nextPresentation.ts');
 assert.match(next,/\[9,/);assert.match(next,/\[8,/);assert.match(next,/imageFit:'contain'/);assert.match(next,/logoUrl:/);
 const presentation=read('client/src/components/placez/presentation.ts');assert.match(presentation,/existingPresentationFor\(assetBase\)/);assert.match(presentation,/nextPresentationFor\(\)/);
 const expanded=read('client/src/components/placez/NativePlacezExpanded.tsx');assert.match(expanded,/<PlacezArtworkCredit id=\{place.id\}/);
 const credits=read('client/src/components/placez/PlacezArtworkCredit.tsx');assert.match(credits,/CC BY-SA 4.0/);assert.match(credits,/Historical imagery/);assert.match(credits,/173093730/);assert.match(credits,/_090.jpg/);
 const css=read('client/src/components/placez/PlacezQuickCard.css');assert.ok(css.includes('[data-fit=contain][data-cutout=true]{mask-image:none'));assert.ok(css.includes('mask-size:contain'));
});
