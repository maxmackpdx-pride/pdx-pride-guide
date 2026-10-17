import test from 'node:test';
import assert from 'node:assert/strict';
import {toPunkPost} from './postModel';
import {toBoardPosts} from '../../../lib/allBoards';
import {boardMotionTiming} from '../../../../../shared/boardMotion';
import {boardTextError,BOARD_TEXT_LIMITS} from '../../../../../shared/boardCardPresentation';
import {housingPrice,housingFaceSlots} from './houz-model.js';
const house:any={id:12,type:'OFFERING',headline:'A bright room',body:'Full description',areas:['NE'],photos:['room1.jpg','room2.jpg'],rent:'900/mo',budget:null,author:{userId:1,displayName:'Alex',photoUrl:'profile.jpg'},household:[{kind:'OFFPLATFORM',name:'Jo',photoUrl:'jo.jpg'},{kind:'OFFPLATFORM',name:'Sam',photoUrl:'sam.jpg'}],openSlots:1,tags:[],motifChoice:'paper:mount-hood'};
test('Hoüz adds the poster once, preserves roommates and open spots, and keeps all photos',()=>{
 const post=toPunkPost(toBoardPosts('housing',{posts:[house]} as any)[0]);
 assert.equal(post.capacity,4);assert.equal(post.openRooms,1);assert.equal(post.peopleIn,3);
 assert.deepEqual(post.photos,house.photos);assert.equal(post.collageChoice,'mount-hood');
 assert.equal(post.kicker,'JOIN OUR HOÜZ');assert.equal(housingPrice(post.amount,post.priceSuffix),'$900/MO');
 const faces=housingFaceSlots(post);assert.equal(faces.length,4);assert.equal(faces[0].photo,'profile.jpg');assert.equal(faces[3].open,true);
 const withLead=toPunkPost(toBoardPosts('housing',{posts:[{...house,household:[{kind:'MEMBER',role:'LEAD',userId:1},...house.household]}]} as any)[0]);assert.equal(withLead.capacity,4);
});
test('forming budget keeps four digits and budget label; looking limits portraits to two',()=>{
 const forming=toPunkPost(toBoardPosts('housing',{posts:[{...house,type:'FORMING',budget:'3795 BUDGET'}]} as any)[0]);
 assert.equal(housingPrice(forming.amount,forming.priceSuffix),'$3795 BUDGET');assert.equal(housingPrice('750–950','/MO'),'$750–950/MO');assert.equal(housingPrice(forming.amount,forming.priceSuffix,true),'$3795');
 assert.equal(toPunkPost(toBoardPosts('housing',{posts:[{...house,type:'LOOKING'}]} as any)[0]).lookingPeople,2);
});
test('Sellz and Giftz keep upload order; Mizzed never uses a source photo',()=>{
 for(const category of ['sellz','giftz'] as const){const raw:any={id:2,title:'A chair',description:'Good chair',photoUrls:['one.jpg','two.jpg'],priceCents:2500,status:category==='sellz'?'ACTIVE':'LOOKING',postType:'ISO',neighborhood:'NE',motifChoice:'paper:hearts'};const card=toPunkPost(toBoardPosts(category,[raw])[0]);assert.deepEqual(card.photos,raw.photoUrls);assert.equal(card.title,raw.title);if(category==='sellz')assert.equal(card.value,'$25');}
 const card=toPunkPost({key:'mizzed:2',id:2,category:'mizzed',intent:'connection',title:'Met at the show',detail:'',description:'Red jacket',area:'Downtown',value:'',createdAt:'',photos:['source.jpg']});assert.deepEqual(card.photos,[]);assert.equal(card.description,'Red jacket');assert.equal(card.value,'');
});
test('input limits accept boundary lengths and reject overflow on create and partial edits',()=>{
 assert.equal(boardTextError({title:'a'.repeat(BOARD_TEXT_LIMITS.title)}),null);
 assert.match(boardTextError({title:'a'.repeat(61)})!,/60/);
 assert.match(boardTextError({headline:'a'.repeat(61)},true)!,/60/);
 assert.equal(boardTextError({budget:'$9999 BUDGET'},true),null);
 assert.equal(boardTextError({status:'CLOSED'}),null);
});
test('neighboring cards get stable, distinct pin and network clocks on exactly one plane',()=>{
 const clocks=Array.from({length:50},(_,i)=>boardMotionTiming(`housing:${i}`));
 assert.deepEqual(clocks[0],boardMotionTiming('housing:0'));
 assert.equal(new Set(clocks.map(c=>`${c.pinCycle}:${c.pinPhase}`)).size,50);
 assert.equal(new Set(clocks.map(c=>`${c.networkCycle}:${c.networkPhase}`)).size,50);
 assert.equal(new Set(clocks.map(c=>c.plane)).size,2);
 assert.ok(clocks.every(c=>c.networkCycle>=16&&c.pinCycle>=9&&c.networkPhase<=0));
});
