import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const {code}=await transform(await readFile(new URL('../client/src/lib/ownMapPostings.ts',import.meta.url),'utf8'),{loader:'ts',format:'esm'});
const {ownPlacedMapRows,ownMapPostingsStatus,ownMapPostingTitle}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const now=Date.parse('2026-10-14T12:00:00Z');
const point=(board,postId,overrides={})=>({board,postId,lat:45.5,lng:-122.6,expiresAt:'2026-10-15T12:00:00Z',venueId:null,...overrides});
test('all five owner feeds retain their placed posts regardless of discovery content or category',()=>{
 const boards=['gigz','giftz','sellz','mizzed','houz'];
 const sources=boards.map(board=>({board,rows:[{id:1,title:`Owner ${board}`,type:'UNMATCHED_CATEGORY'}]}));
 const rows=ownPlacedMapRows(sources,boards.map(board=>point(board,1)),now);
 assert.equal(rows.length,5);assert.deepEqual(rows.map(row=>row._board),['Gigz','Giftz','Sellz','Mizzed','My Hoüz']);
 assert.ok(rows.every(row=>row.isMine));assert.equal(rows[4].mapPoint.board,'houz');
});
test('only live placements belonging to supplied owner records appear, keyed by family and id',()=>{
 const rows=ownPlacedMapRows([{board:'gigz',rows:[{id:1},{id:2},{id:3},{id:4}]}],[point('giftz',1),point('gigz',2,{expiresAt:'2026-10-13T12:00:00Z'}),point('gigz',3,{lat:NaN}),point('gigz',99)],now);
 assert.deepEqual(rows,[]);
});
test('moving and removing a placement immediately changes the derived owner markers',()=>{
 const sources=[{board:'mizzed',rows:[{id:1,lat:0,lng:0}]}];
 const rows=ownPlacedMapRows(sources,[point('mizzed',1,{lat:45.6,lng:-122.7,venueId:42})],now);
 assert.equal(rows[0].lat,45.6);assert.equal(rows[0].lng,-122.7);assert.equal(rows[0].mapPoint.venueId,42);
 assert.deepEqual(ownPlacedMapRows(sources,[],now),[]);
});
test('pending and failed own queries never produce an authoritative empty status',()=>{
 const ready={isPending:false,isError:false};
 assert.equal(ownMapPostingsStatus([ready,{isPending:true,isError:false}]),'loading');
 assert.equal(ownMapPostingsStatus([ready,{isPending:false,isError:true}]),'error');
 assert.equal(ownMapPostingsStatus([ready]),'ready');
});

test("owner rows distinguish multiple posts by one author",()=>{
 assert.equal(ownMapPostingTitle({displayName:"Same author",title:"DJ availability"}),"DJ availability");
 assert.equal(ownMapPostingTitle({displayName:"Same author",title:"Free table"}),"Free table");
 assert.equal(ownMapPostingTitle({displayName:"Household",headline:"Room opening"}),"Room opening");
});
