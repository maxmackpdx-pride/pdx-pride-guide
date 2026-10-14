import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createServer} from 'node:http';
import Database from 'better-sqlite3';
import {registerBoardArchiveRoutes,archivedRequestTarget} from './boardArchiveRoutes';
test('archive endpoints are owner-only and archived direct actions cannot resurrect posts',async()=>{
 const db=new Database(':memory:');
 db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,display_name TEXT); INSERT INTO users VALUES(7,'owner','Owner'),(8,'other','Other'); CREATE TABLE gig_posts(id INTEGER PRIMARY KEY,user_id INTEGER,status TEXT,created_at TEXT,title TEXT,post_type TEXT); CREATE TABLE housing_posts(id INTEGER PRIMARY KEY,user_id INTEGER,status TEXT,created_at TEXT,headline TEXT,type TEXT);`);
 db.prepare('INSERT INTO gig_posts VALUES(1,7,?,?,?,?)').run('ACTIVE',new Date().toISOString(),'Private gig','LOOKING_FOR_WORK');
 db.prepare('INSERT INTO housing_posts VALUES(2,7,?,?,?,?)').run('ACTIVE',new Date().toISOString(),'Private house','FORMING');
 const app=express(),server=createServer(app);
 app.use((req,_res,next)=>{req.session={userId:Number(req.headers['x-user'])||undefined} as any;next();});
 registerBoardArchiveRoutes(app,db,(req,res,next)=>req.session.userId?next():void res.sendStatus(401),server);
 app.use((_req,res)=>res.json({reached:true}));
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${(server.address() as any).port}`;
 const call=(url:string,user?:number,method='GET')=>fetch(base+url,{method,headers:user?{'x-user':String(user)}:{}});
 try{
  assert.equal((await call('/api/board-archive')).status,401);
  assert.equal((await call('/api/board-collection')).status,401);
  assert.equal((await call('/api/board-archive/gigz/1',8,'POST')).status,404);
  assert.equal((await call('/api/board-archive/gigz/1',7,'POST')).status,200);
  assert.equal((await call('/api/board-archive/gigz/1',7,'POST')).status,200);
  assert.deepEqual(await (await call('/api/board-archive',8)).json(),[]);
  assert.deepEqual(await (await call('/api/board-collection',8)).json(),[]);
  const own=await call('/api/board-archive',7);assert.equal(own.headers.get('cache-control'),'private, no-store');assert.equal((await own.json()).length,1);
  for(const url of ['/api/gigs/1','/api/gigs/1/renew','/api/boards/gigz/posts/1/map-location','/API/GIGS/1','/api/gigs/%31','/api/gigs/1e0','/api/gigs/0x1','/api/content/GIG/1/replies'])for(const method of ['GET','POST','PATCH','DELETE'])assert.equal((await call(url,7,method)).status,404,url);
  assert.equal((await call('/api/housing/2/archive',7,'POST')).status,200);
  assert.equal((await call('/api/boards/houz/posts/2/map-location',7,'POST')).status,404);
  assert.deepEqual(await (await call('/api/gigs/3')).json(),{reached:true});
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));db.close();}
});
test('target matching does not confuse board identity or collection endpoints',()=>{
 assert.equal(archivedRequestTarget('/api/gigs'),null);assert.equal(archivedRequestTarget('/api/board-archive'),null);
 assert.deepEqual(archivedRequestTarget('/api/content/SPOTTED/44/replies'),{board:'mizzed',id:44});
});
