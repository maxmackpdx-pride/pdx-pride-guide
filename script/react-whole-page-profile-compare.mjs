/** Compare matched, actual route-tree profiler samples from card Compiler off
 * and exact card-infer modes. These are mocked-data DEV fixture interactions,
 * not proof of release-build or live-site performance improvements.
 * Usage: node script/react-whole-page-profile-compare.mjs off.json infer.json\n * Or four comma-separated, one-round files for each mode.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [offPaths,inferPaths]=process.argv.slice(2);
assert.ok(offPaths&&inferPaths,'Expected off and card-infer JSON file paths (comma-separated for balanced rounds)');
const loadMode=async(paths,expectedMode)=>{
 const files=paths.split(',').filter(Boolean);
 assert.ok(files.length===1||files.length===4,'Provide one combined result or four separate round results');
 const parts=await Promise.all(files.map(async file=>JSON.parse(await readFile(file,'utf8'))));
 for(const part of parts){
  assert.equal(part.mode,expectedMode,'Compiler mode differs from requested result');
  assert.equal(part.browser,parts[0].browser,'Browser engine/version changed between round files');
  assert.ok(Array.isArray(part.records),'Missing page profile records');
 }
 return {mode:expectedMode,browser:parts[0].browser,records:parts.flatMap(part=>part.records)};
};
const [off,infer]=await Promise.all([loadMode(offPaths,'off'),loadMode(inferPaths,'card-infer')]);
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
  const offMatches=off.records.filter(item=>item.kind===kind&&item.round===round);
  const inferMatches=infer.records.filter(item=>item.kind===kind&&item.round===round);
  assert.equal(offMatches.length,1,'Missing or duplicated off route trial: '+kind+' '+round);
  assert.equal(inferMatches.length,1,'Missing or duplicated infer route trial: '+kind+' '+round);
  const [a]=offMatches,[b]=inferMatches;
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
 limitations:'Uses actual Resources, Boards, Directory page trees and card open/close interactions with mocked read-only APIs and Vite development renderer; four trials per mode, with React Profiler overhead. CI alternates invocation order for single-round files; this is not a randomized or device-level trial. No production-optimized or live speedup established.',
}));
