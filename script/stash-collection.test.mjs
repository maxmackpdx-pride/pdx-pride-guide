import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const source=await readFile(new URL('../client/src/components/profile/stashCollection.ts',import.meta.url),'utf8');
const {code}=await transform(source,{loader:'ts',format:'esm'});
const {buildStashCollection,normalizeStashRole,STASH_WORK_XP}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const empty={events:[],adventures:[],places:[],posts:[],canRenderPosts:true};
test('every existing work role and rare bonus retains its awarded XP',()=>{
 assert.deepEqual(STASH_WORK_XP,{DJ:70,DRAG:70,MC:60,GOGO:55,PHOTO:45,BAR:40,SECURITY:40,VOLUNTEER:35,VENDOR:35,WENT:15});
 const events=Object.keys(STASH_WORK_XP).map((stashRole,id)=>({id,stashRole,featured:true}));
 assert.equal(buildStashCollection({...empty,events}).eventXp,715);
 assert.equal(normalizeStashRole('DJ set'),'DJ');assert.equal(normalizeStashRole('co-host'),'MC');assert.equal(normalizeStashRole('door'),'SECURITY');assert.equal(normalizeStashRole('unknown'),'WENT');
});
test('duplicates merge strongest work role and rare once regardless of input order',()=>{
 const events=[{id:4,stashRole:'WENT',featured:true},{id:4,stashRole:'DJ'},{id:4,stashRole:'MC'},{id:9}];
 for(const records of [events,[...events].reverse()]){const result=buildStashCollection({...empty,events:records});assert.equal(result.counts.flyers,2);assert.equal(result.eventXp,110);assert.equal(result.events.find(e=>e.id===4).stashRole,'DJ');assert.equal(result.events.find(e=>e.id===4).featured,true);}
});
test('real category identities count once while separate days and board types remain distinct',()=>{
 const result=buildStashCollection({...empty,events:[{id:1}],adventures:[{placeId:'sauvie',calendarDate:'2026-10-01'},{placeId:'sauvie',calendarDate:'2026-10-01'},{placeId:'sauvie',calendarDate:'2026-10-02'}],places:[{id:4},{id:4},{id:5}],posts:[{id:2,contentType:'GIG'},{id:2,contentType:'GIG'},{id:2,contentType:'GIFTING'},{id:3,contentType:'HUB'},{id:9,contentType:'SPOTTED'}]});
 assert.deepEqual(result.counts,{flyers:1,outz:2,places:2,boards:3,all:8});assert.equal(result.collectionXp,100);assert.equal(result.totalXp,115);
});
test('posts with no author renderer and anonymous or unsupported posts cannot inflate visible score',()=>{
 const result=buildStashCollection({...empty,posts:[{id:1,contentType:'HUB'},{id:2,contentType:'SPOTTED'}],canRenderPosts:false});assert.equal(result.counts.boards,0);assert.equal(result.totalXp,0);assert.deepEqual(result.posts,[]);
});

test('archived and purged memories retain ten XP once per board identity without stale active cards',()=>{
 const memory={board:'gigz',postId:2,title:'Past gig',createdAt:'2025-01-01',archivedAt:'2025-02-01',purgedAt:'2026-02-01'};
 const result=buildStashCollection({...empty,posts:[{id:2,board:'GIGZ',contentType:'GIG'},{id:2,board:'GIFTZ',contentType:'GIFTING'}],memories:[memory,memory,{...memory,board:'housing'}]});
 assert.equal(result.counts.boards,3);assert.equal(result.collectionXp,30);assert.equal(result.memories.length,2);assert.equal(result.posts.length,1);assert.equal(result.posts[0].contentType,'GIFTING');
});
