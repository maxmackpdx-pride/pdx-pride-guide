import assert from 'node:assert/strict';
import {test,after} from 'node:test';
import {copyFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import path from 'node:path';
import {beachCheckinDateOptions} from '@shared/riverBrats';
mkdirSync('.local',{recursive:true});const dir=mkdtempSync(path.resolve('.local/outz-map-test-'));process.env.DATABASE_PATH=path.join(dir,'data.db');copyFileSync('data.db',process.env.DATABASE_PATH);
const {sqlite,storage}=await import('./storage');const {getOutzMapCheckins}=await import('./outzSocial');after(()=>{sqlite.close();rmSync(dir,{recursive:true,force:true})});
test('map faces preserve masking and blocks, deduplicate dates, and cap faces at five',()=>{
 const dates=beachCheckinDateOptions();const ids=Array.from({length:8},(_,i)=>Number(sqlite.prepare('INSERT INTO users(username,email,password_hash,photo_url) VALUES(?,?,?,?)').run('map_test_'+i,'map_test_'+i+'@example.test','test','https://example.test/'+i+'.jpg').lastInsertRowid));
 const insert=sqlite.prepare("INSERT INTO outz_checkins(user_id,place_id,arrival_hour,depart_hour,note,calendar_date,is_anonymous,is_active,expires_at,created_at) VALUES(?,'test-faces',10,13,'private',?,?,1,?,?)");
 for(const id of ids)for(const day of dates.slice(1,3))insert.run(id,day,id===ids[1]?1:0,new Date(Date.now()+7*86400000).toISOString(),new Date().toISOString());
 const guest=getOutzMapCheckins().find(p=>p.placeId==='test-faces')!;assert.equal(guest.total,8);assert.equal(guest.people.length,5);assert.ok(guest.people.every(p=>p.masked&&p.photoUrl===null));assert.ok(!JSON.stringify(guest).includes('userId'));assert.ok(!JSON.stringify(guest).includes('private'));
 storage.blockMember(ids[0],ids[7]);const member=getOutzMapCheckins(ids[0]).find(p=>p.placeId==='test-faces')!;assert.equal(member.total,7);assert.ok(member.people.some(p=>p.photoUrl));assert.ok(member.people.some(p=>p.masked&&p.photoUrl===null));
});
