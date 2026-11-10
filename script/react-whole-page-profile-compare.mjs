/** Compare matched, actual route-tree profiler samples from card Compiler off
 * and exact card-infer modes. These are mocked-data DEV fixture interactions,
 * not proof of release-build or live-site performance improvements.
 * Usage: node script/react-whole-page-profile-compare.mjs off.json infer.json
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [offPath,inferPath]=process.argv.slice(2);
assert.ok(offPath&&inferPath,'Expected off and card-infer JSON file paths');
const [off,infer]=await Promise.all([offPath,inferPath].map(async file=>JSON.parse(await readFile(file,'utf8'))));
assert.equal(off.mode,'off');
assert.equal(infer.mode,'card-infer');
assert.equal(infer.browser,off.browser,'Browser engine/version must match');
const families=['resources','boards','directory'];
const assertSample=(sample,kind,round)=>{
 assert.equal(sample.kind,kind);
 assert.equal(sample.round,round);
 assert.ok(Number.isInteger(sample.cards)&&sample.cards>=1,'Route has no real cards');
 assert.ok(Number.isInteger(sample.commits)&&sample.commits>=2,'Open/close commits not observed');
 assert.ok(Number.isFinite(sample.actualDurationMs)&&sample.actualDurationMs>=0,'Invalid Profiler actualDuration');
 assert.match(sample.fingerprint,/^[a-f0-9]{16}$/,'Missing deterministic card fingerprint');
};
assert.equal(off.records.length,12);
assert.equal(infer.records.length,12);
const comparisons=[];
for(const kind of families){
 const pairs=[];
 for(let round=1;round<=4;round++){
  const a=off.records.find(item=>item.kind===kind&&item.round===round);
  const b=infer.records.find(item=>item.kind===kind&&item.round===round);
  assert.ok(a&&b,'Missing matched route trial: '+kind+' '+round);
  assertSample(a,kind,round);assertSample(b,kind,round);
  assert.equal(b.fingerprint,a.fingerprint,kind+' round '+round+': card content changed under Compiler');
  assert.equal(b.cards,a.cards,kind+' round '+round+': card count changed under Compiler');
  pairs.push({round,offMs:a.actualDurationMs,inferMs:b.actualDurationMs,offCommits:a.commits,inferCommits:b.commits});
 }
 const average=key=>Number((pairs.reduce((sum,item)=>sum+item[key],0)/pairs.length).toFixed(3));
 comparisons.push({kind,offMeanMs:average('offMs'),inferMeanMs:average('inferMs'),pairs});
}
console.log('REACT_ROUTE_WHOLE_PAGE_COMPARISON '+JSON.stringify({
 browser:off.browser,comparisons,
 limitations:'Uses actual Resources, Boards, Directory page trees and card open/close interactions with mocked read-only APIs and Vite development renderer; four trials per mode, not cross-mode order-balanced, with React Profiler overhead. No production-optimized or live speedup established.',
}));
