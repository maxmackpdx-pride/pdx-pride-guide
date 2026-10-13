/** A single user-requested fix, cancelable while a retained map is hidden. */
export function oneShotMapLocation(
  geolocation: Pick<Geolocation,'watchPosition'|'clearWatch'>,
  onPosition: PositionCallback,
  onError: PositionErrorCallback,
  active:()=>boolean,
):()=>void {
  let settled=false,watchId:number|null=null;
  const finish=()=>{
    if(settled)return false;
    settled=true;
    if(watchId!==null)geolocation.clearWatch(watchId);
    return true;
  };
  watchId=geolocation.watchPosition(
    position=>{if(finish()&&active())onPosition(position);},
    error=>{if(finish()&&active())onError(error);},
    {enableHighAccuracy:true,timeout:12000},
  );
  // Browser callbacks are asynchronous; synchronous test/provider callbacks are safe too.
  if(settled)geolocation.clearWatch(watchId);
  return ()=>{finish();};
}
