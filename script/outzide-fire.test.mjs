import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeFireFeature,containsPoint,fetchFireState} from '../client/public/outzide-map/assets/fire-danger.js';
test('state ratings stay distinct and missing values never become Low',()=>{
 assert.equal(normalizeFireFeature({properties:{firedanger:4}},'OR').properties.level,'Extreme');
 assert.equal(normalizeFireFeature({properties:{firedanger:0}},'OR').properties.level,'Not reported');
 assert.equal(normalizeFireFeature({properties:{}},'WA').properties.level,'Not reported');
 const p=normalizeFireFeature({properties:{FIRE_DANGER_LEVEL_NM:'Very High',BURN_BAN_LEVEL_NM:'Restricted',NOTES_TXT:'Notice'}},'WA').properties;
 assert.equal(p.level,'Very High');assert.equal(p.burn,'Restricted');assert.equal(p.notes,'Notice');
 assert.equal(normalizeFireFeature({properties:{firedanger:1}},'OR').properties.burn,null);
});
test('location lookup respects polygon holes and separated multipolygons',()=>{
 const ring=[[0,0],[10,0],[10,10],[0,10],[0,0]],hole=[[3,3],[7,3],[7,7],[3,7],[3,3]];
 assert.equal(containsPoint({type:'Polygon',coordinates:[ring,hole]},[1,1]),true);
 assert.equal(containsPoint({type:'Polygon',coordinates:[ring,hole]},[5,5]),false);
 assert.equal(containsPoint({type:'MultiPolygon',coordinates:[[ring]]},[11,1]),false);
 assert.equal(containsPoint(null,[1,1]),false);
});
test('incomplete or error feed is rejected rather than shown as valid coverage',async()=>{
 const original=globalThis.fetch;
 try{for(const data of [{error:{code:500}},{type:'FeatureCollection',features:[],exceededTransferLimit:true}]){globalThis.fetch=async()=>({ok:true,json:async()=>data});await assert.rejects(fetchFireState('OR'));}}
 finally{globalThis.fetch=original;}
});
