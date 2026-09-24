import test from 'node:test';
import assert from 'node:assert/strict';
import {eventCardA11yProps} from './eventCardInteraction';
const rect={left:1,top:2,width:30,height:40};
const element={getBoundingClientRect:()=>rect};
test('event cards are named and activate on Enter and Space',()=>{
 const opened:unknown[]=[];const props=eventCardA11yProps(r=>opened.push(r),'Trivia');
 assert.equal(props['aria-label'],'Open Trivia');assert.equal(props.tabIndex,0);
 for(const key of ['Enter',' ']){let prevented=false;props.onKeyDown({key,target:element,currentTarget:element,preventDefault(){prevented=true}} as any);assert.ok(prevented);}
 assert.deepEqual(opened,[rect,rect]);
});
test('nested buttons links and fields keep keyboard activation',()=>{
 const props=eventCardA11yProps(()=>assert.fail('opened outer card'),'Trivia');
 for(const tagName of ['BUTTON','A','INPUT','TEXTAREA','SELECT'])for(const key of ['Enter',' '])props.onKeyDown({key,target:{tagName},currentTarget:element,preventDefault(){assert.fail('intercepted')}} as any);
});
test('unrelated keys retain normal behavior',()=>{
 eventCardA11yProps(()=>assert.fail('opened'),'Trivia').onKeyDown({key:'Tab',target:element,currentTarget:element,preventDefault(){assert.fail('prevented')}} as any);
});
