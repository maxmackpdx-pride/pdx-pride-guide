/**
 * Check transforms through the actual Vite app configuration, not only an
 * isolated benchmark. Nothing here imports live user data or writes to APIs.
 * The release candidate must never compile Mapz, route controllers, consent
 * handling, or the uncompiled benchmark parent.
 */
import assert from 'node:assert/strict';
import {assertCompiledFunction} from './react-compiler-function-proof.mjs';
import path from 'node:path';
import {createServer} from 'vite';
import {cardFaceModules,cardSourcePatterns,needzCompilerModules,placezCompilerModules} from './react-compiler-card-scope.mjs';

const root=path.resolve(import.meta.dirname,'..');
const compilerMarker=/react(?:\/|_)compiler-runtime|useMemoCache|memo_cache_sentinel/;
const inScope=[
 'components/cards/EventCard.tsx',
 'components/cards/BoardCard.tsx',
 ...placezCompilerModules.map(module=>'components/'+module+'.tsx'),
 // NEEDZ Decks is in Compiler scope (Nov 12 2026); every component must own a memo cache.
 ...needzCompilerModules.map(module=>'components/'+module+'.tsx'),
 ...cardFaceModules.map(face=>'components/'+face+(face.startsWith('board/punk/')?'.jsx':'.tsx')),
];
const outOfScope=[
 'components/discovery/PlaceDiscoveryCard.tsx',
 'components/home/TodayLocationCard.tsx',
 'components/cards/ZaylistCard.tsx',
 // Legacy Resources ResourceCard adapter (Placez/CardAPI parity tests); the new NEEDZ face is components/needz.
 'components/cards/NeedzCard.tsx',
 'pages/Resources.tsx',
 'pages/Needz.tsx',
 'components/needz/needzDeckModel.ts',
 'components/cards/OutzCard.tsx',
 'components/cards/CardAPI.tsx',
 'components/cards/react19Card.tsx',
 'components/cards/cardLayout.ts',
 'components/cards/experimental/React19CardBoundaries.tsx',
 'components/discovery/EventzBrowse.tsx',
 'components/VenueFollowButton.tsx',
 'components/PlaceModal.tsx',
 'components/placez/nativeData.ts',
 'components/placez/nativeModel.ts',
 // Never let exact-card Compiler selection cross into Mapz or adult-access boundaries.
 'components/AdultContentGate.tsx',
 'components/AuthModal.tsx',
 'components/EventModal.tsx',
 'pages/UnifiedMap.tsx',
 'lib/pinnedMapModule.ts',
 'lib/mapBookmarks.ts',
 'context/AuthContext.tsx',
 'pages/Directory.tsx',
 'pages/Boards.tsx',
];

for(const file of inScope){
 const absolute=path.join(root,'client/src',file);
 assert.ok(cardSourcePatterns.some(pattern=>pattern.test(absolute)),`Expected card renderer not allowlisted: ${file}`);
}
for(const file of outOfScope){
 const absolute=path.join(root,'client/src',file);
 assert.ok(cardSourcePatterns.every(pattern=>!pattern.test(absolute)),`Unsafe compiler scope includes: ${file}`);
}

const server=await createServer({
 configFile:path.join(root,'vite.config.ts'),
 server:{host:'127.0.0.1',port:0,hmr:false,watch:null},
});
try{
 await server.listen();
 const inspected=[];
 for(const [files,expected] of [[inScope,true],[outOfScope,false]]){
  for(const file of files){
   const url='/src/'+file;
   const transformed=await server.transformRequest(url);
   assert.ok(transformed?.code,`Vite did not transform ${url}`);
   const compiled=compilerMarker.test(transformed.code);
   assert.equal(compiled,expected,`Incorrect real-app React Compiler scope: ${url}`);
   const target=[...placezCompilerModules,...needzCompilerModules].find(module=>file===`components/${module}.tsx`);
   const functionProof=target?assertCompiledFunction(transformed.code,target.split('/').pop(),expected):null;
   inspected.push({url,compiled,functionProof});
  }
 }
 console.log('REACT_COMPILER_PRODUCTION_SCOPE '+JSON.stringify({
  mode:'event-board-placez-needz-presentation-infer',config:'vite.config.ts',
  functionProofs:inspected.filter(item=>item.functionProof).map(item=>item.functionProof),
  compiled:inspected.filter(item=>item.compiled).map(item=>item.url),
  excluded:inspected.filter(item=>!item.compiled).map(item=>item.url),
 }));
}finally{await server.close();}

