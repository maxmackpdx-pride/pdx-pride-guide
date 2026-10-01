import {execFileSync} from 'node:child_process';
import {appendFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const shaPattern=/^[0-9a-f]{40}$/;
export function classifyRelease(health,expected,isAncestor){
 if(!shaPattern.test(expected))throw new Error('Expected a full commit SHA');
 if(health?.ok!==true||health.railwayEnvironment!=='production'||!health.deploymentId||!shaPattern.test(health.gitSha||''))return null;
 if(!isAncestor(health.gitSha,'origin/master'))return null;
 if(health.gitSha===expected)return 'exact';
 return isAncestor(expected,health.gitSha)?'includes-commit':null;
}
export function gitIsAncestor(ancestor,descendant,cwd=process.cwd()){
 try{execFileSync('git',['merge-base','--is-ancestor',ancestor,descendant],{cwd,stdio:'pipe'});return true;}
 catch(error){if(error.status===1)return false;throw error;}
}
export async function verifyLiveDeployment({expected,attempts=90,delayMs=10000,fetchHealth,refreshHistory,isAncestor,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),log=console.log}){
 if(!shaPattern.test(expected||''))throw new Error('COMMIT_SHA must be a full commit SHA');
 for(let attempt=1;attempt<=attempts;attempt++){
  try{
   const health=await fetchHealth();
   // Fetch before comparing: another push may have reached production while this run waited.
   refreshHistory();
   const result=classifyRelease(health,expected,isAncestor);
   if(result){
    log(result==='exact'?`Verified ${expected} on deployment ${health.deploymentId}`:`Verified newer release ${health.gitSha} includes ${expected}; deployment ${health.deploymentId}`);
    return {result,gitSha:health.gitSha,deploymentId:health.deploymentId};
   }
   log(`Poll ${attempt}/${attempts}: healthy production has not yet verified ${expected}`);
  }catch(error){log(`Poll ${attempt}/${attempts}: verification unavailable: ${error.message}`);}
  if(attempt<attempts)await wait(delayMs);
 }
 throw new Error(`No healthy production release containing ${expected} was verified`);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const result=await verifyLiveDeployment({
   expected:process.env.COMMIT_SHA,
   fetchHealth:async()=>{
    const response=await fetch('https://www.zaylist.com/api/health',{signal:AbortSignal.timeout(20000),cache:'no-store'});
    if(!response.ok)throw new Error(`Health HTTP ${response.status}`);
    return response.json();
   },
   refreshHistory:()=>execFileSync('git',['fetch','--no-tags','origin','+refs/heads/master:refs/remotes/origin/master'],{stdio:'pipe',timeout:20000}),
   isAncestor:gitIsAncestor,
  });
  if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,`Verified production release: \`${result.gitSha}\` (${result.result}). Deployment: \`${result.deploymentId}\`.\n`);
 }catch(error){console.error(error.message);process.exitCode=1;}
}
