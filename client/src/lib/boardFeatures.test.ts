import assert from "node:assert/strict";
import test from "node:test";
import { boardFeaturePosts, filterBoardFeatures, canSaveBoardPost } from "./boardFeatures";
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
  assert.equal(u.pathname,"/boardz");assert.equal(u.searchParams.get("post"),`${board}:9`);assert.equal(u.searchParams.get("mine"),"1");
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

test("completed and demo posts cannot become new saved availability",()=>{const posts=boardFeaturePosts("gigz",gigPayload,7,true);assert.equal(canSaveBoardPost(posts.find(p=>p.id===1)!),true);assert.equal(canSaveBoardPost(posts.find(p=>p.id===3)!),false);assert.equal(canSaveBoardPost(boardFeaturePosts("gigz",gigPayload)[1]),false);});


test("View all chronology orders every category newest first, including clearly marked demos",()=>{
 const base=boardFeaturePosts("gigz",gigPayload,7)[0];
 const rows=[{...base,key:"gigz:1",createdAt:"2026-10-01T12:00:00Z"},{...base,category:"housing",key:"housing:2",createdAt:"2026-10-03T12:00:00Z"},{...base,category:"sellz",key:"sellz:3",createdAt:"2026-10-05T12:00:00Z"},{...base,key:"gigz:4",isDemo:true,createdAt:"2026-10-06T12:00:00Z"}] as BoardPost[];
 assert.deepEqual(filterBoardFeatures(rows,{}).map(p=>p.key),["gigz:4","sellz:3","housing:2","gigz:1"]);
 assert.deepEqual(filterBoardFeatures(rows,{sort:"oldest"}).map(p=>p.key),["gigz:1","housing:2","sellz:3","gigz:4"]);
});

test("category deep links ignore another room's hidden controls and invalid options", async()=>{
 const {readBoardFeatureFilters,boardIntentForSelection}=await import('./boardFeatures');
 const p=new URLSearchParams('category=Furniture&condition=Good&price=under25&remote=1&source=events&tags=pets&sort=price-low&neighborhood= SE ');
 assert.deepEqual(readBoardFeatureFilters(p,'gigz'),{itemCategory:'',condition:'',price:'',remote:true,source:'',neighborhood:'SE',sort:'newest',tags:[]});
 assert.equal(boardIntentForSelection('available','giftz'),'all');
 assert.equal(boardIntentForSelection('iso','giftz'),'iso');
 assert.equal(boardIntentForSelection('not-a-type','all'),'all');
 assert.equal(readBoardFeatureFilters(new URLSearchParams('price=bad&sort=bad'),'sellz').price,'');
 assert.equal(readBoardFeatureFilters(new URLSearchParams('source=bad'),'mizzed').source,'');
});
test("the selected room retains its own real filters and My Hoüz tags deduplicate", async()=>{
 const {readBoardFeatureFilters}=await import('./boardFeatures');
 const sell=readBoardFeatureFilters(new URLSearchParams('category=Furniture&condition=Good&price=25to100&sort=price-high'),'sellz');
 assert.equal(sell.itemCategory,'Furniture');assert.equal(sell.condition,'Good');assert.equal(sell.price,'25to100');assert.equal(sell.sort,'price-high');
 assert.deepEqual(readBoardFeatureFilters(new URLSearchParams('tags=pets,pets, verified'),'housing').tags,['pets','verified']);
 assert.equal(readBoardFeatureFilters(new URLSearchParams('source=outzide'),'mizzed').source,'outzide');
});
