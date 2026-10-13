import test from "node:test";
import assert from "node:assert/strict";
import { mergeCommunityResources } from "./communityResources";
import type { CommunitySummary } from "@shared/community";
import type { ResourceCategory } from "./resourcesData";
const category = {id:"community",name:"Find Your People",color:"cyan",orgs:[]} as unknown as ResourceCategory;
const group = (name:string, visibility="public") => ({id:name,slug:name.toLowerCase().replaceAll(" ","-"),name,description:"Live community",visibility,memberCount:3,imageUrl:null,neighborhood:null}) as CommunitySummary;
test("all discoverable clubs become cards while private memberships stay private",()=>{
 const result=mergeCommunityResources([], [group("Club One"),group("Group Two","discoverable"),group("Private Group","private")],category);
 assert.equal(result.length,2); assert.deepEqual(result.map(r=>r.org.url),["/z/club-one","/z/group-two"]); assert.ok(result.every(r=>r.community && r.category.id==="community"));
});
test("a matching organization receives its full workspace without a duplicate or altered source row",()=>{
 const rows=[{org:{name:"Q Center",aliases:["The Q Center"],desc:"Care",scope:"Portland"},category:{...category,id:"health"}}];
 const result=mergeCommunityResources(rows,[group("The Q Center")],category);
 assert.equal(result.length,1); assert.equal(result[0].community?.slug,"the-q-center"); assert.deepEqual(result[0].org.categoryIds,["community"]); assert.equal(rows[0].org.desc,"Care"); assert.equal("community" in rows[0],false);
});
