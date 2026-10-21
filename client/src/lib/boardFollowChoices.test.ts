import assert from 'node:assert/strict';
import test from 'node:test';
import { boardFollowChoices,followRoomForCategory } from './boardFollowChoices';

test('all five public choices use independent existing follow API keys',()=>{
 assert.deepEqual(boardFollowChoices.map(choice=>choice.followRoom).sort(),['giftz','gigz','houz','mizzed','sellz']);
 assert.equal(new Set(boardFollowChoices.map(choice=>choice.followRoom)).size,5);
 assert.equal(boardFollowChoices.find(choice=>choice.id==='housing')?.label,'My Hoüz');
 assert.equal(followRoomForCategory('housing'),'houz');
});
