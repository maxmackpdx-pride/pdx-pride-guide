import assert from 'node:assert/strict';
import test from 'node:test';
import type { CommunitySummary } from '@shared/community';
import { communityResourceMapEntries } from './communityResourceMap';
import { RESOURCE_CATEGORIES } from './resourcesData';
import {resourceMapHref, resourceMapKey, type ResourceMapEntry} from './resourceMap';
const club = (name: string, extra: Partial<CommunitySummary> = {}) => ({name,slug:name.toLowerCase(),description:'A group',memberCount:3,visibility:'public',sourcePlaceId:null,...extra} as CommunitySummary);
test('all discoverable communities remain in NEEDZ including groups without verified coordinates', () => {
 const entries=communityResourceMapEntries([club('Club'),club('NoPin'),club('Private',{visibility:'private',viewerRole:'member'})],[{id:4,name:'Venue',lat:45.5,lng:-122.6}],[]);
 assert.deepEqual(entries.map(entry=>entry.org.name),['Club','NoPin']);
 assert.ok(entries.every(entry=>entry.locations.length===0));
});
test('pins use only valid public source locations and never infer neighborhood coordinates',()=>{
 const entries=communityResourceMapEntries([club('Mapped',{sourcePlaceId:4}),club('Invalid',{sourcePlaceId:5}),club('Inactive',{sourcePlaceId:6}),club('Missing',{sourcePlaceId:7,neighborhood:'Portland'})],[{id:4,name:'Verified Venue',address:'Public address',lat:45.5,lng:-122.6},{id:5,name:'Invalid',lat:0,lng:0},{id:6,name:'Inactive',lat:45.6,lng:-122.6,active:false}],[]);
 assert.deepEqual(entries[0].locations,[{name:'Verified Venue',address:'Public address',lat:45.5,lng:-122.6}]);
 assert.ok(entries.slice(1).every(entry=>entry.locations.length===0));
});
test('existing aliased providers keep contacts and coordinates without duplicate entries or mutation',()=>{
 const category=RESOURCE_CATEGORIES.find(item=>item.id==='health') || RESOURCE_CATEGORIES[0];
 const base:ResourceMapEntry[]=[{org:{name:'Center',aliases:['The Center'],phone:'555-1234',desc:'Care',scope:'Local'},categories:[category],locations:[{name:'Center',address:'Address',lat:45.5,lng:-122.6}]}];
 const before=JSON.stringify(base);
 const entries=communityResourceMapEntries([club('The Center',{sourcePlaceId:4})],[{id:4,name:'Source',lat:45.7,lng:-122.7}],base);
 assert.equal(entries.length,1);assert.equal(entries[0].org.phone,'555-1234');assert.deepEqual(entries[0].locations,base[0].locations);assert.ok(entries[0].categories.some(item=>item.id==='community'));assert.equal(JSON.stringify(base),before);
});

test('duplicate-named communities retain distinct destinations and pin identity',()=>{
 const groups=[club('Same Name',{id:'one',slug:'first',sourcePlaceId:1}),club('Same Name',{id:'two',slug:'second',sourcePlaceId:2})];
 const entries=communityResourceMapEntries(groups,[{id:1,name:'First venue',lat:45.5,lng:-122.6},{id:2,name:'Second venue',lat:45.6,lng:-122.7}],[]);
 assert.equal(entries.length,2);assert.notDeepEqual(entries[0].locations,entries[1].locations);
 assert.deepEqual(entries.map(entry=>resourceMapHref(entry.org.name,entry.communitySlug)),['/needz?cat=community&community=first','/needz?cat=community&community=second']);
 assert.notEqual(resourceMapKey(entries[0].org.name,0,entries[0].communitySlug),resourceMapKey(entries[1].org.name,0,entries[1].communitySlug));
 assert.equal(resourceMapHref('Original Provider'),'/needz?resource=Original%20Provider');
});
