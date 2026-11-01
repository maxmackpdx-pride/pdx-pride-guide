import assert from 'node:assert/strict';
import test from 'node:test';
import type {QueryClient} from '@tanstack/react-query';
import {invalidateProfileMutation,profileQueries} from './profileQueries';
test('domain mutations refresh profile collections without changing notification read state',()=>{
 const calls:unknown[]=[];const client={invalidateQueries:(q:unknown)=>{calls.push(q);return Promise.resolve();}} as unknown as QueryClient;
 for(const url of ['/api/events/42/attend','/api/directory/12/follow','/api/boards/gigz/posts/7/save','/api/outz/checkins','/api/users/me']){calls.length=0;invalidateProfileMutation(client,'PUT',url);assert.deepEqual(calls,[{queryKey:['profile']},{queryKey:['/api/board-collection']},{queryKey:['/api/users/me/people/following']}]);}
 for(const [method,url] of [['GET','/api/users/me'],['HEAD','/api/events/42'],['POST','/api/push/read'],['POST','/api/messages/42/read']]){calls.length=0;invalidateProfileMutation(client,method,url);assert.equal(calls.length,0);}
 assert.notDeepEqual(profileQueries.projection('someone',1),profileQueries.projection('someone',2));assert.notDeepEqual(profileQueries.projection('someone',1),profileQueries.projection('someone',null));
});
