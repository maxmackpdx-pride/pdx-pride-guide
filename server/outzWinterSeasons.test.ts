import test from 'node:test';import assert from 'node:assert/strict';import {parseWinterSeason} from './outzWinterSeasons';
const now=Date.parse('2026-09-22T12:00:00Z');
test('planned winter opening is dated, expected, and never automatically becomes open',()=>{
 const html='Planned Schedule for the 2026-27 Season: Opening Day: 12/4/2026';const s=parseWinterSeason('meadows',html,now);assert.equal(s.expectedOpening,'2026-12-04');assert.equal(s.status,'seasonal');assert.equal(parseWinterSeason('meadows',html,Date.parse('2026-12-05')).status,'unknown');
});
test('winter closures are scoped separately from summer and individual lifts',()=>{
 assert.equal(parseWinterSeason('hoodoo','HOURS Closed until next season',now).status,'seasonal');assert.equal(parseWinterSeason('49north','Chairs Operating Closed for the season',now).status,'seasonal');
 for(const html of ['Bike Park Closed for the Day','Restaurant closed for the season','Summer operations: closed for the season','Chair 4 closed','Opening Day: 12/4/2025'])assert.equal(parseWinterSeason('crystal',html,now).status,'unknown');
 assert.equal(parseWinterSeason('timberline','Skiing & Snowboarding: open',now).status,'open');
});
