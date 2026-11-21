import test from 'node:test';
import assert from 'node:assert/strict';
import {destinationBrowseLists} from '../client/src/lib/outzDestinationBrowse';
import {outzAlphabetMatches as matches,OUTZ_ALPHABET_RANGES} from '../shared/outzAlphabet';
test('range boundaries cover every English letter exactly once',()=>{for(const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'){assert.equal(OUTZ_ALPHABET_RANGES.filter(r=>r!=='All'&&matches(letter+' Lake',r)).length,1);}assert(matches('Eagle','A–E'));assert(matches('Forest','F–J'));assert(matches('Zigzag','U–Z'));});
test('normalizes case accents and leading punctuation without dropping articles',()=>{assert(matches('  éagle creek','A–E'));assert(matches('“Forest Park”','F–J'));assert(matches('The Dalles','P–T'));assert(matches('49 Degrees North','#'));assert(matches('49 Degrees North','All'));assert(!matches('Forest','A–E'));});
test('search, category and name range filter the rails while saved and seasonal keep their scopes', () => {
 const places = [
   {id:'eagle',name:'Eagle Lake',detail:'Hiking trail',waypointKind:'trail',image:'eagle.jpg'},
   {id:'fern',name:'Fern Lake',detail:'Hiking trail',waypointKind:'trail',image:'fern.jpg'},
   {id:'frost',name:'Frost Lake',detail:'Hiking trail',waypointKind:'trail',image:''},
   {id:'falls',name:'Fairy Lake',detail:'Swimming',waypointKind:'beach',image:'fairy.jpg'},
   {id:'forest',name:'Forest Hill',detail:'A wooded path',waypointKind:'trail',image:'forest.jpg'},
 ];
 const filter = (range: 'A–E' | 'F–J') =>
   destinationBrowseLists(places, 'lake', 'trails', ['trail'], range, new Set(['falls','forest']), place => place);
 const a = filter('A–E'), f = filter('F–J');
 assert.deepEqual(a.explored.map(item=>item.id), ['eagle']);
 assert.deepEqual(f.explored.map(item=>item.id), ['fern','frost']);
 assert.deepEqual(f.exploreWithPhotos.map(item=>item.id), ['fern']);
 assert.deepEqual(f.seasonal.map(item=>item.id), ['eagle','fern']);
 assert.deepEqual(f.followed.map(item=>item.id), ['falls','forest']);
 assert.deepEqual(a.followed,f.followed);
 assert.deepEqual(a.seasonal,f.seasonal);
 assert.deepEqual(a.scope,['lake','trails','A–E']);
 assert.deepEqual(f.scope,['lake','trails','F–J']);
});
