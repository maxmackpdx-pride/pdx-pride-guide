import { test } from 'node:test';
import assert from 'node:assert/strict';
import { metricsForInbox, mayReleaseQueueClaim } from './inboxPolicy';
test('staff metrics allowlist excludes private and newly added fields', () => {
 const input = {liveEvents:4, users:10, messages:20, traffic:{sessions:2}, memberGrowth12h:[1], futureSensitiveField:'secret'};
 const output = metricsForInbox(input,false);
 assert.equal(output.liveEvents,4);
 for(const key of ['users','messages','traffic','memberGrowth12h','futureSensitiveField']) assert.equal(key in output,false);
 assert.equal(metricsForInbox(input,true),input);
});
test('claim release requires assignee or owner authority',()=>{
 assert.equal(mayReleaseQueueClaim(1,1,false),true);
 assert.equal(mayReleaseQueueClaim(1,2,false),false);
 assert.equal(mayReleaseQueueClaim(1,2,true),true);
});
