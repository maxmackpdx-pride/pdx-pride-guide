import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

// Exercise the actual registered handler and serializer without booting production storage.
const source=await readFile(new URL('../server/routes.ts',import.meta.url),'utf8');
const serializer=source.slice(source.indexOf('function publicGigPost('),source.indexOf('const RESTRICTED_GIFTING_TERMS'));
const route=source.slice(source.indexOf('  app.get("/api/gigs/mine"'),source.indexOf('  app.get("/api/gigs/:id"'));
test('owner Gigz feed preserves joined portraits and hides other owners and workflow fields',()=>{
 const requireAuth=()=>{};
 let handler,result;
 const own={id:17,userId:7,status:'LIVE',posterPhotoUrl:'/uploads/dj.jpg',imageUrl:null,contactEmail:'private@example.test',adminNotes:'private',contact_email:'private',admin_notes:'private'};
 vm.runInNewContext(ts.transpileModule(serializer+route,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText,{
  app:{get(path,middleware,callback){assert.equal(path,'/api/gigs/mine');assert.equal(middleware,requireAuth);handler=callback;}},
  requireAuth,sqlite:{},readBoardMotif:()=>null,isDemoAuthor:()=>false,
  storage:{getGigPosts:()=>[own,{...own,id:18,userId:8},{...own,id:19,status:'CLOSED'}]},
 });
 handler({session:{userId:7}},{json(value){result=JSON.parse(JSON.stringify(value));}});
 assert.deepEqual(result.map(post=>post.id),[17,19]);
 for(const post of result){
  assert.equal(post.posterPhotoUrl,'/uploads/dj.jpg');
  assert.equal(post.isMine,true);
  assert.equal(post.isDemo,false);
  for(const field of ['contactEmail','contact_email','adminNotes','admin_notes'])assert.equal(field in post,false);
 }
});
