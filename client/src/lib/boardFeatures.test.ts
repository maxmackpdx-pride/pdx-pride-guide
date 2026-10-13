import assert from "node:assert/strict";
import test from "node:test";
import { boardFeaturePosts, filterBoardFeatures } from "./boardFeatures";
import { boardBrowseHref } from "./boardBrowseHref";
import type { BoardPayload, BoardPost } from "./allBoards";

const gigPayload = [
 {id:1,createdAt:"2026-10-12",title:"Open gig",description:"Hosting",postType:"POSTING_GIG",status:"LIVE",userId:7,isRemote:true},
 {id:2,createdAt:"2020-01-01",title:"Demo gig",description:"Example",postType:"LOOKING_FOR_WORK",status:"LIVE",isDemo:true,userId:99},
 {id:3,createdAt:"2026-10-13",title:"Completed gig",description:"Closed",postType:"POSTING_GIG",status:"CLOSED",userId:7},
] as BoardPayload;

test("public browsing retains demos without leaking inactive owner posts",()=>{
 const posts=boardFeaturePosts("gigz",gigPayload,7);
 assert.deepEqual(posts.map(p=>p.id),[1,2]);assert.equal(posts[1].isDemo,true);
});
test("management includes completed owner posts, excluding other people's demos",()=>{
 assert.deepEqual(boardFeaturePosts("gigz",gigPayload,7,true).map(p=>p.id),[1,3]);
});
test("marketplace filters combine price, condition and neighborhood; real posts precede demos",()=>{
 const base={category:"sellz",intent:"selling",description:"",detail:"",value:"",title:"Chair",createdAt:"2026-10-12"};
 const posts=[{...base,id:1,key:"sellz:1",priceCents:2400,condition:"Good",area:"SE Portland",isDemo:true},{...base,id:2,key:"sellz:2",priceCents:2500,condition:"Good",area:"SE Portland"},{...base,id:3,key:"sellz:3",priceCents:2300,condition:"Good",area:"SE Portland"}] as BoardPost[];
 assert.deepEqual(filterBoardFeatures(posts,{price:"under25",condition:"Good",neighborhood:"SE",sort:"price-low"}).map(p=>p.id),[3,1]);
 assert.deepEqual(filterBoardFeatures(posts,{price:"25to100"}).map(p=>p.id),[2]);
});
test("housing tags and remote filters only include requested posts",()=>{
 const posts=boardFeaturePosts("gigz",gigPayload,7);
 assert.deepEqual(filterBoardFeatures(posts,{remote:true}).map(p=>p.id),[1]);
 assert.equal(filterBoardFeatures(posts,{tags:["verified"]}).length,0);
});
test("old category, saved and tools links retain post IDs in unified Boards",()=>{
 for(const board of ["housing","gigz","giftz","sellz","mizzed"] as const){
  const u=new URL(boardBrowseHref(board,"?post=9&view=tools"),"https://www.zaylist.com");
  assert.equal(u.pathname,"/boards");assert.equal(u.searchParams.get("post"),`${board}:9`);assert.equal(u.searchParams.get("mine"),"1");
 }
 const u=new URL(boardBrowseHref("housing","?type=FORMING&filter=SAVED&join=1"),"https://www.zaylist.com");
 assert.equal(u.searchParams.get("intent"),"forming");assert.equal(u.searchParams.get("saved"),"1");assert.equal(u.searchParams.get("join"),"1");
});

test("housing owner inventory uses the actual author userId and retains every subsection demo",()=>{
 const post={id:18,createdAt:"2020-01-01",type:"FORMING",author:{userId:7},isDemo:true,headline:"Build together",displayName:"Our Hoüz",body:"",areas:[],photos:[],household:[],status:"FILLED",tags:["pets"],openSlots:2};
 const payload={posts:[post]} as unknown as BoardPayload;
 const rows=boardFeaturePosts("housing",payload,7,true);
 assert.equal(rows.length,1);assert.equal(rows[0].isMine,true);assert.equal(rows[0].isDemo,true);assert.equal(rows[0].intent,"forming");assert.equal(filterBoardFeatures(rows,{tags:["pets"]}).length,1);
});
test("open-grab gifting is a distinct retained subsection",()=>{
 const payload=[{id:21,createdAt:"2020-01-01",postType:"GIFT",status:"OPEN",isDemo:true,title:"Boxes",description:"",neighborhood:"SE",pickupPreference:"Open grab · porch pickup",photoUrls:[]}] as unknown as BoardPayload;
 const rows=boardFeaturePosts("giftz",payload);
 assert.equal(rows[0].intent,"grab");assert.equal(rows[0].isDemo,true);
});
