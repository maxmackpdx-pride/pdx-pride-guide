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
