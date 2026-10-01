import test from 'node:test';
import assert from 'node:assert/strict';
import {createMotionPreference} from '../client/public/zaydar-map/motion-preference.js';

test('motion checks never reread storage; host and OS changes notify and clean up',()=>{
 let reads=0,changes=0;
 const events=new Map(),mediaEvents=new Map();
 const media={matches:false,addEventListener:(key,fn)=>mediaEvents.set(key,fn),removeEventListener:key=>mediaEvents.delete(key)};
 const storage={getItem(){reads++;return 'false';}};
 const scope={localStorage:storage,matchMedia:()=>media,addEventListener:(key,fn)=>events.set(key,fn),removeEventListener:key=>events.delete(key)};
 const preference=createMotionPreference(scope);
 const listener=()=>changes++;
 preference.addEventListener('change',listener);
 for(let i=0;i<10000;i++)assert.equal(preference.matches,false);
 assert.equal(reads,1);
 const emit=(key,newValue,storageArea=storage)=>events.get('storage')({key,newValue,storageArea});
 emit('unrelated','true');emit('pdx-calm-mode','true',{});assert.equal(changes,0);
 emit('pdx-calm-mode','true');assert.equal(preference.matches,true);assert.equal(changes,1);
 emit('pdx-calm-mode','true');assert.equal(changes,1);
 emit('pdx-calm-mode','false');assert.equal(preference.matches,false);assert.equal(changes,2);
 media.matches=true;mediaEvents.get('change')();assert.equal(preference.matches,true);
 emit('pdx-calm-mode','true');emit(null,null);assert.equal(preference.matches,true);
 media.matches=false;mediaEvents.get('change')();assert.equal(preference.matches,false);
 emit('pdx-calm-mode','true');emit(null,null);assert.equal(preference.matches,false);
 assert.equal(reads,1);
 preference.removeEventListener('change',listener);const count=changes;
 emit('pdx-calm-mode','true');assert.equal(changes,count);
 preference.dispose();assert.equal(events.size,0);assert.equal(mediaEvents.size,0);
});
test('blocked storage does not break rendering or OS motion preferences',()=>{
 const preference=createMotionPreference({get localStorage(){throw Error('blocked');},matchMedia:()=>({matches:true,addEventListener(){},removeEventListener(){}})});
 assert.equal(preference.matches,true);preference.dispose();
});
