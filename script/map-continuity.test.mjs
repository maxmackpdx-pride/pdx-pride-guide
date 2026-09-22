import test from 'node:test';
import assert from 'node:assert/strict';
import {faceStackHtml} from '../client/public/outzide-map/assets/community-ui.js';

test('both map renderers share five visible people with exact overflow',()=>{
 const people=Array.from({length:8},(_,i)=>({displayName:`Visitor ${i}`,photoUrl:`https://example.com/${i}.jpg`}));
 const html=faceStackHtml(people,12);
 assert.equal((html.match(/<img /g)||[]).length,5);
 assert.match(html,/>\+7</);
 assert.match(html,/12 people planning a visit/);
 assert.equal(faceStackHtml([],0),'');
});
test('face stacks mask private identities and reject unsafe images',()=>{
 const html=faceStackHtml([{masked:true,displayName:'Private name',photoUrl:'https://example.com/private.jpg'},{displayName:'<script>',photoUrl:'javascript:alert(1)'}],2);
 assert.doesNotMatch(html,/Private name|private.jpg|javascript:|<script>/);
 assert.match(html,/Anonymous/);
 assert.match(html,/&lt;script&gt;/);
});
