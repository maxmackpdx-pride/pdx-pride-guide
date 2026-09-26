import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEventSearch } from './eventSearch';
const event = {title:'Béarracuda: The Locker Room',venueName:'Eagle Portland',description:'Dance with Birthday Gurl. Saturday tickets also available.',dateStart:'2026-09-25T21:00:00',dayOfWeek:'SAT',searchTalent:['DJ', 'MissThing', 'Miss Thing']};
for (const query of ['eagle','The Eagle','locker room','bearacuda','bearracdua','eagel firday','Friday Eagle','fri','Fridays','DJ Miss Thing','missthing','birthday gurl','brithday gurl','Portland on Friday','BEARRACUDA']) {
 test(`matches ${query}`,()=>assert.equal(createEventSearch(query)(event),true));
}
for (const query of ['Saturday','sat','sanctuary','eagle monday','xx','missing performer']) {
 test(`rejects ${query}`,()=>assert.equal(createEventSearch(query)(event),false));
}
test('Pacific day for UTC timestamp',()=>assert.equal(createEventSearch('friday')({...event,dateStart:'2026-09-26T04:00:00Z'}),true));
test('empty query matches',()=>assert.equal(createEventSearch('  ')(event),true));
test('occurrence day changes for expanded listings',()=>assert.equal(createEventSearch('Saturday')({...event,dateStart:'2026-09-26T21:00:00'}),true));
test('Bear search finds Bearracuda by prefix',()=>assert.equal(createEventSearch('Bear')({...event,title:'Bearracuda Portland: Dick or Treat!'}),true));
test('Bearacudda typo still finds Bearracuda',()=>assert.equal(createEventSearch('Bearacudda')({...event,title:'Bearracuda Portland: Dick or Treat!'}),true));
test('Bear search does not match unrelated gear nights',()=>assert.equal(createEventSearch('Bear')({title:'The Locker Room',venueName:'Eagle Portland',description:'Athletic gear night with a strip contest.',dateStart:'2026-10-30T21:00:00-07:00'}),false));
