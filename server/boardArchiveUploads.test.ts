import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import {mkdtempSync,writeFileSync,existsSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {cleanBoardArchiveUploads} from './boardArchiveUploads';
test('cleanup removes only unreferenced local files, preserving shared photos, JSON attachments and unsafe paths',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'board-cleanup-'));const db=new Database(':memory:');
 try{
  db.exec('CREATE TABLE board_archive_upload_cleanup(upload_path TEXT PRIMARY KEY,queued_at TEXT); CREATE TABLE users(photo_url TEXT); CREATE TABLE messages(attachments TEXT);');
  const outside=path.join(dir,'outside.jpg'),root=path.join(dir,'uploads');
  const {mkdirSync}=await import('node:fs');mkdirSync(root);writeFileSync(outside,'outside');
  for(const name of ['orphan.jpg','profile.jpg','inbox.jpg'])writeFileSync(path.join(root,name),name);
  symlinkSync(outside,path.join(root,'link.jpg'));
  db.prepare('INSERT INTO users VALUES(?)').run('/uploads/profile.jpg');
  db.prepare('INSERT INTO messages VALUES(?)').run('["\\/uploads\\/inbox.jpg"]');
  for(const p of ['orphan.jpg','profile.jpg','inbox.jpg','link.jpg','../outside.jpg','missing.jpg'])db.prepare('INSERT INTO board_archive_upload_cleanup VALUES(?,?)').run('/uploads/'+p,'2026-01-01');
  await cleanBoardArchiveUploads(db,root);
  assert.equal(existsSync(path.join(root,'orphan.jpg')),false);
  for(const p of ['profile.jpg','inbox.jpg','link.jpg'])assert.equal(existsSync(path.join(root,p)),true);
  assert.equal(existsSync(outside),true);
  assert.equal(db.prepare("SELECT COUNT(*) FROM board_archive_upload_cleanup WHERE upload_path IN ('/uploads/orphan.jpg','/uploads/missing.jpg')").pluck().get(),0);
 }finally{db.close();rmSync(dir,{recursive:true,force:true});}
});
test('new references while the scan yields prevent deletion',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'board-race-'));const db=new Database(':memory:');
 try{
  db.exec("CREATE TABLE board_archive_upload_cleanup(upload_path TEXT PRIMARY KEY,queued_at TEXT); CREATE TABLE users(photo_url TEXT); CREATE TABLE filler(body TEXT); INSERT INTO board_archive_upload_cleanup VALUES('/uploads/photo.jpg','2026-01-01');");
  writeFileSync(path.join(dir,'photo.jpg'),'photo');
  const cleaning=cleanBoardArchiveUploads(db,dir);
  setImmediate(()=>db.prepare('INSERT INTO users VALUES(?)').run('/uploads/photo.jpg'));
  await cleaning;assert.equal(existsSync(path.join(dir,'photo.jpg')),true);
 }finally{db.close();rmSync(dir,{recursive:true,force:true});}
});
