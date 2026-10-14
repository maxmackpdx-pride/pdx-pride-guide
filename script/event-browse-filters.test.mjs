import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
const {outputFiles}=await build({entryPoints:['client/src/lib/eventBrowseFilters.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const {readEventTypeFilters,matchesEventTypeFilters}=await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
test('initial entry and history restore normalize identical labels and ignore unknown duplicates',()=>{
 assert.deepEqual(readEventTypeFilters(' free |ALL ages| free|wrong|sex positive'),['FREE','ALL AGES','SEX POSITIVE']);
});
test('multiple age choices expose either audience rather than an impossible conjunction',()=>{
 const filters=['21+','ALL AGES'];
 assert.equal(matchesEventTypeFilters({ageRequirement:'21_PLUS'},filters),true);
 assert.equal(matchesEventTypeFilters({ageRequirement:'ALL_AGES'},filters),true);
 assert.equal(matchesEventTypeFilters({ageRequirement:'18_PLUS'},filters),false);
});
test('admission alternatives still combine with separate audience and semantic restrictions',()=>{
 const filters=['FREE','TICKETED','ALL AGES','SEX POSITIVE'];
 assert.equal(matchesEventTypeFilters({admission:'FREE',ageRequirement:'ALL_AGES',isSexPositive:true},filters),true);
 assert.equal(matchesEventTypeFilters({admission:'TICKETED',ageRequirement:'ALL_AGES',isSexPositive:true},filters),true);
 assert.equal(matchesEventTypeFilters({admission:'DOOR_FEE',ageRequirement:'ALL_AGES',isSexPositive:true},filters),false);
 assert.equal(matchesEventTypeFilters({admission:'FREE',ageRequirement:'21_PLUS',isSexPositive:true},filters),false);
 assert.equal(matchesEventTypeFilters({admission:'FREE',ageRequirement:'ALL_AGES',isSexPositive:false},filters),false);
});
test('empty filter includes all records and independent public/house/nudity flags remain conjunctive',()=>{
 assert.equal(matchesEventTypeFilters({},[]),true);
 assert.equal(matchesEventTypeFilters({isPublic:true,isHouseParty:true,nudityOk:true},['PUBLIC','HOUSE PARTY','NUDITY OK']),true);
 assert.equal(matchesEventTypeFilters({isPublic:true,isHouseParty:false,nudityOk:true},['PUBLIC','HOUSE PARTY','NUDITY OK']),false);
});
