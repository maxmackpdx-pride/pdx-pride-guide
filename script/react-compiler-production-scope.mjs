/**
 * Check transforms through the actual Vite app configuration, not only an
 * isolated benchmark. Nothing here imports live user data or writes to APIs.
 * The release candidate must never compile Mapz, route controllers, consent
 * handling, or the uncompiled benchmark parent.
 */
import assert from 'node:assert/strict';
import path from 'node:path';
import {createServer} from 'vite';
import {cardFaceModules,cardSourcePatterns} from './react-compiler-card-scope.mjs';

const root=path.resolve(import.meta.dirname,'..');
const compilerMarker=/react(?:\/|_)compiler-runtime|useMemoCache|memo_cache_sentinel/;
const inScope=[
 'components/cards/EventCard.tsx',
 'components/cards/BoardCard.tsx',
 'components/cards/PlaceCard.tsx',
 'components/discovery/PlaceDiscoveryCard.tsx',
 ...cardFaceModules.map(face=>'components/'+face+(face.startsWith('board/punk/')?'.jsx':'.tsx')),
];
const outOfScope=[
 'components/cards/ZaylistCard.tsx',
 'components/cards/NeedzCard.tsx',
 'components/cards/OutzCard.tsx',
 'components/cards/CardAPI.tsx',
 'components/cards/react19Card.tsx',
 'components/cards/cardLayout.ts',
 'components/cards/experimental/React19CardBoundaries.tsx',
 'components/discovery/EventzBrowse.tsx',
 'components/VenueFollowButton.tsx',
 'components/PlaceModal.tsx',
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
   inspected.push({url,compiled});
  }
 }
 console.log('REACT_COMPILER_PRODUCTION_SCOPE '+JSON.stringify({
  mode:'card-only-infer',config:'vite.config.ts',
  compiled:inspected.filter(item=>item.compiled).map(item=>item.url),
  excluded:inspected.filter(item=>!item.compiled).map(item=>item.url),
 }));
}finally{await server.close();}
