import test from 'node:test';
import assert from 'node:assert/strict';
import {resourceDetailSelection} from './resourceDetailSelection';
const rows=[{org:{name:'Q Center',aliases:['The Q Center']}},{org:{name:'Shared Name'},community:{slug:'first-group'}},{org:{name:'Shared Name'},community:{slug:'second-group'}}];
test('normal NEEDZ canonical and old resource aliases select existing shared detail',()=>{assert.equal(resourceDetailSelection(rows,'?resource=Q%20Center').row,rows[0]);assert.equal(resourceDetailSelection(rows,'?find=The%20Q%20Center').row,rows[0]);assert.equal(resourceDetailSelection(rows,'?community=second-group').row,rows[2]);});
test('embedded selection ignores competing map search parameters and selects exact community identity',()=>{assert.equal(resourceDetailSelection(rows,'?resource=Shared%20Name&community=first-group',{name:'Q Center'}).row,rows[0]);assert.equal(resourceDetailSelection(rows,'?community=first-group',{name:'Shared Name',communitySlug:'second-group'}).row,rows[2]);});
test('pending community never falls back to a wrong duplicate named card',()=>{const pick=resourceDetailSelection(rows.slice(0,2),'',{name:'Shared Name',communitySlug:'second-group'});assert.equal(pick.row,undefined);assert.equal(pick.requested,true);assert.equal(resourceDetailSelection(rows,'').requested,false);});
