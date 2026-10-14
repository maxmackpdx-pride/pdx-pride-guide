/** One requested fix; clear the watch on completion or when its map becomes hidden. */
export function oneShotMapLocation(geolocation,onPosition,onError,active,options={enableHighAccuracy:true,timeout:12000}){
 let settled=false,watchId=null;
 const finish=()=>{if(settled)return false;settled=true;if(watchId!==null)geolocation.clearWatch(watchId);return true;};
 watchId=geolocation.watchPosition(
  position=>{if(finish()&&active())onPosition(position);},
  error=>{if(finish()&&active())onError(error);},
  options,
 );
 if(settled)geolocation.clearWatch(watchId);
 return ()=>{finish();};
}
