/** Build first, then run with Node 20. Uses an isolated seed copy and no integration credentials. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {copyFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import path from 'node:path';
mkdirSync('.local',{recursive:true});
const dir=mkdtempSync(path.resolve('.local/prelaunch-'));const database=path.join(dir,'data.db');copyFileSync('data.db',database);
const server=spawn(process.execPath,['dist/index.cjs'],{env:{PATH:process.env.PATH,HOME:dir,NODE_ENV:'development',LOCAL_PREVIEW:'1',DATABASE_PATH:database,SESSION_SECRET:'isolated-prelaunch-test',PORT:'15873'},stdio:['ignore','pipe','pipe']});
let logs='',passed=0;const failures=[];server.stdout.on('data',b=>logs+=b);server.stderr.on('data',b=>logs+=b);
async function request(route,{method='GET',body,cookie}={}){
 const response=await fetch('http://127.0.0.1:15873'+route,{method,redirect:'manual',signal:AbortSignal.timeout(10000),headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const text=await response.text();let data;try{data=JSON.parse(text)}catch{data=text}return {response,data,cookie:response.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ')};
}
async function check(name,run){try{await run();passed++;console.log('PASS '+name)}catch(e){failures.push(name);console.error('FAIL '+name+': '+e.message)}}
try{
 let ready=false;for(let i=0;i<100;i++){if(server.exitCode!==null)throw Error(logs.slice(-3000));try{if((await request('/api/health')).response.ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}if(!ready)throw Error('Server did not start: '+logs.slice(-3000));
 for(const route of ['/api/health','/api/events','/api/directory','/api/gigs','/api/gifting','/api/sellz','/api/missed-connections','/api/communities'])await check('public '+route,async()=>assert.equal((await request(route)).response.status,200));
 for(const route of ['/api/auth/me','/api/gigs/mine','/api/gifting/mine','/api/sellz/mine','/api/events/mine/talent'])await check('guest blocked '+route,async()=>assert.equal((await request(route)).response.status,401));
 for(const route of ['/api/gigs','/api/gifting','/api/sellz','/api/missed-connections'])await check('guest write blocked '+route,async()=>assert.equal((await request(route,{method:'POST',body:{}})).response.status,401));
 for(const [route,expected] of [['/gigs','/pride-work'],['/housing','/the-hauz'],['/missed-connections','/spotted'],['/z/out','/outzide']])await check('redirect '+route,async()=>{const {response}=await request(route);assert.equal(response.status,301);assert.equal(response.headers.get('location'),expected)});
 const accounts=[];for(const username of ['prelaunch_owner','prelaunch_other']){const r=await request('/api/auth/register',{method:'POST',body:{username,email:username+'@example.invalid',password:'Local-test-only-123!',displayName:username,agreedToCommunityStandards:true}});assert.equal(r.response.status,200,JSON.stringify(r.data));assert.ok(r.cookie);accounts.push(r.cookie)}
 const [cookie,otherCookie]=accounts;
 await check('session persists',async()=>assert.equal((await request('/api/auth/me',{cookie})).data.username,'prelaunch_owner'));
 await check('wrong password rejected',async()=>assert.equal((await request('/api/auth/login',{method:'POST',body:{email:'prelaunch_owner',password:'wrong'}})).response.status,401));
 await check('valid login creates session',async()=>{const r=await request('/api/auth/login',{method:'POST',body:{email:'prelaunch_other',password:'Local-test-only-123!'}});assert.equal(r.response.status,200);assert.ok(r.cookie)});
 for(const board of ['gigz','giftz','sellz'])await check(board+' follow persists and is private',async()=>{assert.equal((await request(`/api/boards/${board}/follow`,{method:'PUT',body:{follow:true},cookie})).response.status,200);assert.equal((await request(`/api/boards/${board}/follow`,{cookie})).data.isFollowing,true);assert.equal((await request(`/api/boards/${board}/follow`,{cookie:otherCookie})).data.isFollowing,false);assert.equal((await request(`/api/boards/${board}/follow`,{method:'PUT',body:{follow:false},cookie})).data.isFollowing,false)});
 await check('Giftz posting remains open year-round',async()=>assert.equal((await request('/api/gifting/status')).data.postingOpen,true));
 const common={acceptRules:true,title:'Prelaunch test listing',description:'A local test listing for checking the complete posting workflow.',category:'Household',neighborhood:'SE Portland',pickupPreference:'Message to coordinate',photoUrls:[]};
 const cases=[['/api/gigs',{acceptRules:true,postType:'POSTING_GIG',title:common.title,name:'Prelaunch',contactEmail:'prelaunch_owner@example.invalid',description:common.description,compensation:'$25 per hour',location:'Portland',isRemote:false}],['/api/gifting',{...common,postType:'GIFT'}],['/api/sellz',{...common,price:'25.00',condition:'Good'}]];
 for(const [route,body] of cases){
  await check(route+' rejects blank listing content',async()=>assert.equal((await request(route,{method:'POST',body:{...body,title:'   ',description:'   '},cookie})).response.status,400));
  await check(route+' create read owner update and ownership protection',async()=>{const created=await request(route,{method:'POST',body,cookie});assert.equal(created.response.status,200,JSON.stringify(created.data));assert.ok(created.data.id);const detail=route+'/'+created.data.id;assert.equal((await request(detail,{cookie})).response.status,200);assert.equal((await request(detail,{method:'PUT',body:{...body,title:'   ',description:'   '},cookie})).response.status,400);const changed={...body,title:'Updated prelaunch listing'};assert.equal((await request(detail,{method:'PUT',body:changed,cookie})).response.status,200);assert.ok([400,403,404].includes((await request(detail,{method:'PUT',body:changed,cookie:otherCookie})).response.status));assert.equal((await request(detail,{cookie})).data.title,changed.title)});
 }
 const communities=(await request('/api/communities')).data;const community=(Array.isArray(communities)?communities:communities.communities||[]).find(c=>c.membershipPolicy==='open');
 if(community){await check('community join automatically follows',async()=>{const r=await request(`/api/communities/${community.slug}/join`,{method:'POST',body:{},cookie});assert.equal(r.response.status,200);assert.equal(r.data.viewerFollowing,true)});await check('community events are public',async()=>{const r=await request(`/api/communities/${community.slug}`);assert.equal(r.response.status,200);assert.ok(r.data.events)})}else failures.push('No open community fixture');
 await check('logout clears session',async()=>{assert.equal((await request('/api/auth/logout',{method:'POST',cookie})).response.status,200);assert.equal((await request('/api/auth/me',{cookie})).response.status,401)});
 console.log(`${passed} passed; ${failures.length} failed`);if(failures.length)process.exitCode=1;
}catch(e){console.error(e);process.exitCode=1}finally{server.kill('SIGTERM');await new Promise(r=>{if(server.exitCode!==null)r();else server.once('exit',r)});rmSync(dir,{recursive:true,force:true})}
