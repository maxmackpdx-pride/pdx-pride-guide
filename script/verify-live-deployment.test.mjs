import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {classifyRelease,gitIsAncestor,verifyLiveDeployment} from './verify-live-deployment.mjs';

function history(){
 const cwd=mkdtempSync(join(tmpdir(),'deployment-lineage-'));
 const git=(...args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 git('init','-b','master');git('config','user.name','Deployment test');git('config','user.email','test@example.invalid');
 const commit=message=>{git('commit','--allow-empty','-m',message);return git('rev-parse','HEAD');};
 const first=commit('first'),expected=commit('expected'),newer=commit('newer');
 git('update-ref','refs/remotes/origin/master',newer);
 git('checkout','--orphan','unrelated');const unrelated=commit('unrelated');
 return {cwd,first,expected,newer,unrelated,isAncestor:(a,b)=>gitIsAncestor(a,b,cwd),dispose:()=>rmSync(cwd,{recursive:true,force:true})};
}
const health=gitSha=>({ok:true,railwayEnvironment:'production',deploymentId:'deployment-fixture',gitSha});

test('only healthy production on master verifies an exact or newer containing commit',()=>{
 const h=history();
 try{
  assert.equal(classifyRelease(health(h.expected),h.expected,h.isAncestor),'exact');
  assert.equal(classifyRelease(health(h.newer),h.expected,h.isAncestor),'includes-commit');
  assert.equal(classifyRelease(health(h.first),h.expected,h.isAncestor),null);
  assert.equal(classifyRelease(health(h.unrelated),h.expected,h.isAncestor),null);
  for(const patch of [{ok:false},{railwayEnvironment:'preview'},{deploymentId:null},{gitSha:'bogus'}])assert.equal(classifyRelease({...health(h.newer),...patch},h.expected,h.isAncestor),null);
  assert.equal(classifyRelease(null,h.expected,h.isAncestor),null);
  assert.throws(()=>classifyRelease(health(h.newer),'bogus',h.isAncestor));
 }finally{h.dispose();}
});
test('transient failures and old releases wait without triggering or canceling deployments',async()=>{
 const h=history();
 try{
  let calls=0,waits=0,refreshes=0;
  const result=await verifyLiveDeployment({expected:h.expected,attempts:4,delayMs:1,
   fetchHealth:async()=>{calls++;if(calls===1)throw Error('temporary network outage');return health(calls===2?h.first:h.newer);},
   refreshHistory:()=>refreshes++,isAncestor:h.isAncestor,wait:async()=>waits++,log:()=>{},
  });
  assert.equal(result.result,'includes-commit');assert.equal(calls,3);assert.equal(waits,2);assert.equal(refreshes,2);
 }finally{h.dispose();}
});
test('missing history is retried and never treated as proof of success',async()=>{
 const expected='a'.repeat(40);let attempts=0;
 await assert.rejects(verifyLiveDeployment({expected,attempts:2,fetchHealth:async()=>health(expected),refreshHistory:()=>attempts++,isAncestor:()=>{throw Error('missing commit');},wait:async()=>{},log:()=>{}}),/No healthy production/);
 assert.equal(attempts,2);
});
test('an unhealthy release times out instead of turning a failed deployment green',async()=>{
 const expected='a'.repeat(40);let attempts=0;
 await assert.rejects(verifyLiveDeployment({expected,attempts:2,fetchHealth:async()=>{attempts++;return {...health(expected),ok:false};},refreshHistory(){},isAncestor:()=>true,wait:async()=>{},log:()=>{}}),/No healthy production/);
 assert.equal(attempts,2);
});
test('workflow keeps pending runs and uses only the read-only verifier',()=>{
 const workflow=readFileSync(new URL('../.github/workflows/railway-deploy.yml',import.meta.url),'utf8');
 assert.match(workflow,/cancel-in-progress: false\n  queue: max/);
 assert.match(workflow,/contents: read/);
 assert.match(workflow,/run: node script\/verify-live-deployment.mjs/);
 assert.doesNotMatch(workflow,/railway (up|down|redeploy)|deployment(Remove|Stop|Cancel)|serviceInstanceDeploy/);
});
