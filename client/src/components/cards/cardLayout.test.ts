import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { CARD_SIZES, expansionPlacement } from './cardLayout';

test('all card families share exactly three canonical sizes',()=>{
 assert.deepEqual(CARD_SIZES,{tall:{width:200,height:403},wide:{width:360,height:216},small:{width:136,height:170}});
});
test('three columns: first two anchor left and rightmost anchors right',()=>{
 assert.deepEqual([1,2,3].map(column=>expansionPlacement({columns:3,column,trackWidth:200,gap:20})),[
  {anchor:'left',start:1,span:3,width:640},
  {anchor:'left',start:2,span:2,width:420},
  {anchor:'right',start:1,span:3,width:640},
 ]);
});
test('one column stays within its available width without scale',()=>{
 assert.deepEqual(expansionPlacement({columns:1,column:1,trackWidth:360,gap:20}),{anchor:'left',start:1,span:1,width:360});
});
test('wide containers cap detail width while keeping rightmost edge',()=>{
 assert.deepEqual(expansionPlacement({columns:5,column:5,trackWidth:360,gap:20}),{anchor:'right',start:3,span:3,width:760});
});
