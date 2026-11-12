export interface PlaceActivity {venueId:number;gigzCount:number|null;mizzedConnectionsCount:number|null;checkedAt:string;}
export function safeCount(value:number|null,checkedAt:string,now=Date.now()){
 const checked=Date.parse(checkedAt);return Number.isSafeInteger(value)&&Number(value)>=0&&checked<=now&&now-checked<=24*3600000?String(value).padStart(2,'0'):'—';
}
export function directionsFor(latitude:number|null,longitude:number|null){
 if(latitude===null||longitude===null||!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)return null;
 const destination=encodeURIComponent(`${latitude},${longitude}`);
 return{google:`https://www.google.com/maps/dir/?api=1&destination=${destination}`,apple:`https://maps.apple.com/?daddr=${destination}`};
}
