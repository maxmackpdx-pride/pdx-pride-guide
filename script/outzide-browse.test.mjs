import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {browseRegions,browseRegionFor,matchesBrowse} from '../client/public/outzide-map/assets/browse-regions.js';
const places=JSON.parse(readFileSync(new URL('../client/public/outzide-map/places.json',import.meta.url))).places;
test('all destinations belong to exactly one of eight populated browse regions',()=>{
 assert.equal(browseRegions.length,8);
 const ids=new Set(browseRegions.map(r=>r.id));
 for(const p of places)assert.ok(ids.has(browseRegionFor(p)),p.name);
 for(const r of browseRegions)assert.ok(places.some(p=>browseRegionFor(p)===r.id),r.name);
});
test('discovery keeps coastal, mountain, city and southern extension destinations distinct',()=>{
 for(const [state,lat,lng,expected] of [['OR',45.54,-122.23,'portland-gorge'],['OR',46.18,-123.83,'oregon-coast'],['WA',47.8,-123.6,'olympic-coast'],['WA',47.6,-122.3,'puget-north'],['WA',48.86,-121.68,'cascades-east-wa'],['OR',42.1,-122.7,'south-or'],['OR',44.9,-123,'central-east-or'],['NV',40.8,-119.2,'southern-extension']])assert.equal(browseRegionFor({state,lat,lng}),expected);
});
test('multi-activity results use OR between activities and AND with region',()=>{
 const p={state:'OR',lat:45.5,lng:-122.3,kind:'trail'};
 assert.ok(matchesBrowse(p,'portland-gorge',['trail','camp']));
 assert.ok(matchesBrowse({...p,kind:'camp'},'portland-gorge',['trail','camp']));
 assert.equal(matchesBrowse({...p,kind:'stay'},'portland-gorge',['trail','camp']),false);
 assert.equal(matchesBrowse(p,'oregon-coast',['trail','camp']),false);
 assert.ok(matchesBrowse(p,null,[]));
});
