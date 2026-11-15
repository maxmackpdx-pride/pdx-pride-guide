import assert from 'node:assert/strict';
import {test} from 'node:test';
import {outzPlacesWithCatalog,outzPlaceSlug,type OutzSnapshot} from './outz';
test('complete catalog includes Rooster Rock when weather snapshot omits it',()=>{
 const rows=outzPlacesWithCatalog(undefined,[{id:'rooster-rock',name:'Rooster Rock State Park',kind:'beach',lat:45,lng:-122}]);
 assert.equal(rows[0].id,'rooster-rock');assert.equal(rows[0].sourceStatus,null);assert.equal(rows[0].slug,outzPlaceSlug(rows[0]));
});
test('snapshot enriches by stable ID without duplicating or losing catalog destinations',()=>{
 const snapshot={destinations:[{id:'silver',name:'Silver Falls',kind:'camp-hike',subtitle:'Verified listing',sourceStatus:'cached'}],catalog:[],communityStays:[]} as unknown as OutzSnapshot;
 const rows=outzPlacesWithCatalog(snapshot,[{id:'silver',name:'Silver Falls',kind:'camp'},{id:'rooster',name:'Rooster Rock',kind:'beach'}]);
 assert.equal(rows.length,2);assert.equal(rows[0].detail,'Verified listing');assert.equal(rows[1].sourceStatus,null);
});
