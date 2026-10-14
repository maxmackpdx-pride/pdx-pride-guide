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

test("housing artwork honors post intent and actual pets, never pet-friendly policy", async()=>{
 const { hasHousingPets, housingMotifOptions, resolveHousingMotif, normalizeHousingMotif } = await import("../shared/boardMotifs");
 for(const type of ["MANAGED","FORMING"] as const) for(const choice of ["steel-bridge","pet"]) {
  assert.equal(normalizeHousingMotif(type,choice,true),"default");
  assert.equal(resolveHousingMotif(type,choice,true).main,type === "FORMING" ? "boardHouseBlueprint" : "keysHome");
  assert.equal(housingMotifOptions(type,true).length,1);
 }
 assert.equal(resolveHousingMotif("OFFERING","steel-bridge",false).main,"keysHome");
 assert.equal(hasHousingPets(["pets-welcome","dogs-welcome"]),false);
 assert.equal(resolveHousingMotif("OFFERING","pet",hasHousingPets(["pets-welcome"])).main,"keysHome");
 for(const tags of [["existing-dog"],["existing-cat"]]) {
  assert.equal(hasHousingPets(tags),true);
  assert.equal(resolveHousingMotif("OFFERING","pet",hasHousingPets(tags)).main,"boardPet");
 }
 assert.equal(hasHousingPets([], [{kind:"PET"}]),true);
 assert.equal(resolveHousingMotif("LOOKING","pet",true).main,"boardPet");
 assert.notEqual(resolveHousingMotif("LOOKING","pet",false).main,"boardPet");
 assert.equal(resolveHousingMotif("LOOKING","steel-bridge",false).main,"boardSteelBridge");
 assert.equal(housingMotifOptions("LOOKING",false).length,6);
 assert.equal(housingMotifOptions("LOOKING",true).length,7);
});
test("shared housing cards derive pet eligibility from actual tags and members",()=>{
 const base={id:1,type:"OFFERING",createdAt:"2026-10-14",headline:"Room",body:"",areas:[],photos:[],household:[],status:"ACTIVE",tags:["pets-welcome"]};
 const rows=boardFeaturePosts("housing",{posts:[base,{...base,id:2,tags:["existing-cat"]},{...base,id:3,household:[{kind:"PET"}]}]} as any);
 assert.deepEqual(rows.map(post=>post.hasPets),[false,true,true]);
});
