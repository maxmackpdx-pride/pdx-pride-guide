import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mapCoordinates} from './mapCoordinates';
test('stored coordinates preserve latitude/longitude exactly',()=>{
 assert.deepEqual(mapCoordinates(45.523,-122.676),{lat:45.523,lng:-122.676});
 assert.deepEqual(mapCoordinates('45.523','-122.676'),{lat:45.523,lng:-122.676});
});
test('missing and invalid coordinates cannot become map pins',()=>{
 for(const pair of [[null,null],[undefined,undefined],['',''],[' ',' '],[0,0],[91,45],[45,181],[NaN,45],[true,false]]) assert.equal(mapCoordinates(...pair as [unknown,unknown]),null);
});
