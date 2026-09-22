import test from 'node:test';import assert from 'node:assert/strict';
import {feedIdentity} from '../client/public/outzide-map/assets/feed-identity.js';
const date='2026-09-22T12:00:00Z',now=Date.parse(date)+3600000;
test('feed uses profile avatar, escaped author and a relative timestamp',()=>{
 const html=feedIdentity({kind:'post',author:'Alex <Park>',authorAvatarUrl:'/avatars/rose.webp',createdAt:date},'Trail note',now);
 assert.match(html,/src="\/avatars\/rose.webp"/);assert.match(html,/Alex &lt;Park&gt;/);assert.match(html,/1h ago/);
 assert.doesNotMatch(feedIdentity({kind:'post',author:'Alex',authorAvatarUrl:'javascript:alert(1)'},'Post'),/<img/);
});
test('aggregate check-ins and demo posts never acquire a real member photo',()=>{
 for(const item of [{kind:'checkin',author:'Private member'},{kind:'post',demo:true,author:'Demo Alex'}]){
  const html=feedIdentity({...item,authorAvatarUrl:'https://example.com/private.jpg',createdAt:date},'Update',now);
  assert.doesNotMatch(html,/private.jpg|Private member/);
 }
});
