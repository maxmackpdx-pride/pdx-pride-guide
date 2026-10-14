export function oneShotMapLocation(
 geolocation:Pick<Geolocation,'watchPosition'|'clearWatch'>,
 onPosition:PositionCallback,
 onError:PositionErrorCallback,
 active:()=>boolean,
 options?:PositionOptions,
):()=>void;
