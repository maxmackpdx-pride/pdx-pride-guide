import assert from 'node:assert/strict';
import test from 'node:test';
import {oneShotMapLocation} from './oneShotMapLocation';
function provider(){
 let fix!:PositionCallback,error!:PositionErrorCallback;
 const cleared:number[]=[],options:PositionOptions[]=[];
 const geo={watchPosition:(success:PositionCallback,failure:PositionErrorCallback|null,request?:PositionOptions)=>{fix=success;error=failure!;options.push(request!);return 7;},clearWatch:(id:number)=>cleared.push(id)};
 return{geo,cleared,options,fix:()=>fix,error:()=>error};
}
const point={coords:{latitude:45.52,longitude:-122.67}} as GeolocationPosition;
const denied={code:1,message:'Denied'} as GeolocationPositionError;
test('the first fix ends GPS and later fixes cannot move the map',()=>{
 const p=provider();let moved=0;
 oneShotMapLocation(p.geo,()=>moved++,()=>{},()=>true);
 assert.deepEqual(p.options,[{enableHighAccuracy:true,timeout:12000}]);
 p.fix()(point);p.fix()(point);assert.equal(moved,1);assert.deepEqual(p.cleared,[7]);
});
test('hiding or disposing the map cancels a pending request and ignores a late fix',()=>{
 const p=provider();let moved=0;
 const cancel=oneShotMapLocation(p.geo,()=>moved++,()=>{},()=>true);
 cancel();cancel();p.fix()(point);assert.equal(moved,0);assert.deepEqual(p.cleared,[7]);
});
test('a hidden map cannot consume a fix even before cleanup runs',()=>{
 const p=provider();let active=true,moved=0;
 oneShotMapLocation(p.geo,()=>moved++,()=>{},()=>active);
 active=false;p.fix()(point);assert.equal(moved,0);assert.deepEqual(p.cleared,[7]);
});
test('an error ends GPS once without following fixes or repeated errors',()=>{
 const p=provider();let errors=0,moved=0;
 oneShotMapLocation(p.geo,()=>moved++,()=>errors++,()=>true);
 p.error()(denied);p.error()(denied);p.fix()(point);assert.equal(errors,1);assert.equal(moved,0);assert.deepEqual(p.cleared,[7]);
});
