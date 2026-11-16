import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {outzBoardIntent} from '../client/src/lib/outzBoardPost';
test('destination counters map every existing post kind without cross-category leakage',()=>{
 for(const kind of ['CARPOOL','CARPOOL_OFFER','CARPOOL_REQUEST'])assert.equal(outzBoardIntent(kind),'ride');
 for(const kind of ['HIKE_BUDDY','CAMP_BUDDY','LOOKING_FOR_COMPANY'])assert.equal(outzBoardIntent(kind),'buddy');
 assert.equal(outzBoardIntent('MISSED_CONNECTION'),'missed');
 assert.equal(outzBoardIntent('TRIP_NOTE'),null);
});
test('closed destination counters open distinct intents and real wall uses same filter',()=>{
 const face=readFileSync('client/src/components/outz/native/NativeOutzideFace.tsx','utf8');
 for(const label of ['Carpool','Mizzed','Buddy Finder'])assert.ok(face.includes(`onOpen('${label}')`));
 const page=readFileSync('client/src/pages/OutzidePlacesPage.tsx','utf8');
 assert.ok(page.includes('boardIntent={boardIntent}'));
 const wall=readFileSync('client/src/pages/OutzPlace.tsx','utf8');
 assert.ok(wall.includes('outzBoardIntent(post.postKind)===boardIntent'));
 assert.ok(wall.includes("boardIntent==='ride'?'CARPOOL_REQUEST':boardIntent==='missed'?'MISSED_CONNECTION':'LOOKING_FOR_COMPANY'"));
 assert.ok(wall.includes('visibleWallPosts.map'));
});
