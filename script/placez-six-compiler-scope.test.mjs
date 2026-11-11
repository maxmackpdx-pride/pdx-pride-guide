import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {cardSourcePatterns,cardCompilerExcludedPatterns,placezCompilerModules} from './react-compiler-card-scope.mjs';
test('Placez compiler allowlist is exact across path conventions',()=>{
 const expected=['cards/PlaceCard','placez/NativePlacezFace','placez/PlacezQuickCard','placez/NativePlacezExpanded','placez/ExpandedPager'];
 assert.deepEqual(placezCompilerModules,expected);
 for(const module of expected)for(const separator of ['/','\\']){
  const file=('/repo/client/src/components/'+module+'.tsx').replaceAll('/',separator);
  assert.ok(cardSourcePatterns.some(pattern=>pattern.test(file)),file);
 }
 for(const file of ['components/cards/CardAPI.tsx','components/cards/ZaylistCard.tsx','components/cards/NeedzCard.tsx','components/cards/OutzCard.tsx','components/cards/react19Card.tsx','components/PlaceModal.tsx','components/VenueFollowButton.tsx','components/AdultContentGate.tsx','components/AuthModal.tsx','components/placez/nativeData.ts','components/placez/nativeModel.ts','components/placez/UnreviewedFace.tsx','context/AuthContext.tsx','pages/Directory.tsx','pages/UnifiedMap.tsx','lib/pinnedMapModule.ts'])assert.ok(cardSourcePatterns.every(pattern=>!pattern.test('/repo/client/src/'+file)),file);
 assert.ok(cardCompilerExcludedPatterns.some(pattern=>pattern.test('/repo/script/fixtures/placez-six-compiler.tsx')));
});
test('comparison cohort uses the real six-ID artwork gate and unchanged PlaceCard',async()=>{
 const fixture=await readFile(new URL('./fixtures/placez-six-compiler.tsx',import.meta.url),'utf8');
 assert.match(fixture,/\[30,3,31,5,2,23\]/);assert.match(fixture,/<PlaceCard place=\{place\} size=\{size\}/);assert.doesNotMatch(fixture,/use memo/);
});
test('optimized six-ID comparison uses production build, profiling renderer and transform verification',async()=>{
 const source=await readFile(new URL('./placez-six-compiler-harness.mjs',import.meta.url),'utf8');
 assert.match(source,/config\.mode='production'/);assert.match(source,/await build\(config\)/);assert.match(source,/react-dom\/profiling/);assert.match(source,/verify-six-production-transforms/);
 const declarations=await readFile(new URL('./react-compiler-card-scope.d.mts',import.meta.url),'utf8');
 assert.match(declarations,/export declare const placezCompilerModules: string\[\]/);
});
