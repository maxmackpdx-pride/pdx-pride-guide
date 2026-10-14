import assert from "node:assert/strict";
import test from "node:test";
import { toBoardPosts, type BoardPayload } from "./allBoards";

test("real talent keeps its existing portrait and explicit post uploads take priority", () => {
 const base={id:17,createdAt:"2026-10-13",title:"DJ in Portland",description:"DJ",postType:"LOOKING_FOR_WORK",status:"LIVE",isDemo:false,posterPhotoUrl:"/uploads/portrait.jpg"};
 const photo=(patch:object)=>toBoardPosts("gigz",[{...base,...patch}] as BoardPayload)[0].photo;
 assert.equal(photo({imageUrl:null}),"/uploads/portrait.jpg");
 assert.equal(photo({imageUrl:"/uploads/post.jpg"}),"/uploads/post.jpg");
 assert.equal(photo({isDemo:true}),undefined);
 assert.equal(photo({postType:"POSTING_GIG"}),undefined);
 assert.equal(photo({posterPhotoUrl:null}),undefined);
});
