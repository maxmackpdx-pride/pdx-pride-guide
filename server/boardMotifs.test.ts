import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { readBoardMotif,saveBoardMotif,validateBoardMotif } from "./boardMotifs";
import { boardFeaturePosts } from "../client/src/lib/boardFeatures";
import { boardMotifOptions } from "../shared/boardMotifs";
test("artwork persists independently for overlapping board IDs and invalid choices cannot overwrite it",()=>{
 const db=new Database(":memory:");
 assert.equal(readBoardMotif(db,"housing",1),"default");
 saveBoardMotif(db,"housing",1,"steel-bridge");saveBoardMotif(db,"gigz",1,"photographer");
 assert.equal(readBoardMotif(db,"housing",1),"steel-bridge");assert.equal(readBoardMotif(db,"gigz",1),"photographer");
 assert.throws(()=>saveBoardMotif(db,"housing",1,"photographer"));
 assert.equal(readBoardMotif(db,"housing",1),"steel-bridge");
 for(const board of Object.keys(boardMotifOptions) as (keyof typeof boardMotifOptions)[])for(const option of boardMotifOptions[board])assert.equal(validateBoardMotif(board,option.id),option.id);
 assert.throws(()=>validateBoardMotif("mizzed","camera"));assert.throws(()=>validateBoardMotif("housing",{}));
 db.close();
});
test("persisted motif reaches shared closed cards",()=>{
 const result=boardFeaturePosts("gigz",[{id:2,title:"Photos",name:"Photographer",description:"Portraits",postType:"AVAILABLE",status:"LIVE",createdAt:"2026-10-14",motifChoice:"photographer"}] as any);
 assert.equal(result[0]?.motifChoice,"photographer");
});
