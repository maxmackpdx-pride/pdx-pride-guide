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

const aged = (ageRequirement: string | null | undefined) => ({ ...event, ageRequirement });
for (const query of ['all ages', 'All-Ages', 'all age', 'family friendly']) {
  test(`age search "${query}" matches only ALL_AGES`, () => {
    assert.equal(createEventSearch(query)(aged('ALL_AGES')), true);
    for (const other of ['21_PLUS', '18_PLUS', 'UNVERIFIED', null, undefined]) assert.equal(createEventSearch(query)(aged(other)), false);
  });
}
for (const query of ['21+', '21 plus', '21 and over', 'over 21', 'eagle 21+']) {
  test(`age search "${query}" matches 21_PLUS`, () => {
    assert.equal(createEventSearch(query)(aged('21_PLUS')), true);
    assert.equal(createEventSearch(query)(aged('ALL_AGES')), false);
  });
}
test('18+ matches 18_PLUS and combines with text', () => {
  assert.equal(createEventSearch('18+')(aged('18_PLUS')), true);
  assert.equal(createEventSearch('18+ eagle')(aged('18_PLUS')), true);
  assert.equal(createEventSearch('18+ sanctuary')(aged('18_PLUS')), false);
});
test('age phrases do not disturb non-age searches', () => assert.equal(createEventSearch('locker room')(aged('21_PLUS')), true));
