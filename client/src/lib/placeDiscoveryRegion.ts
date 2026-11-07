/** Region filters use listing evidence, never device location or guessed coordinates. */
export type PlaceDiscoveryRegion = 'ALL' | 'OR' | 'VAN';
export function readPlaceDiscoveryRegion(value:string|null):PlaceDiscoveryRegion{return value==='OR'||value==='VAN'?value:'ALL';}
export function matchesPlaceDiscoveryRegion(place:{address?:string|null;neighborhood?:string|null},region:PlaceDiscoveryRegion):boolean{
 if(region==='ALL')return true;
 const address=place.address||'';
 const neighborhood=place.neighborhood||'';
 const text=`${address} ${neighborhood}`;
 const inBC=/\bBC\b|British Columbia/i.test(text);
 const inWA=/\bWA\b|Washington/i.test(address);
 const vancouver=/\bVancouver\b/i.test(text)&&!inBC&&(inWA||/\bVancouver\b/i.test(neighborhood));
 return region==='VAN'?vancouver:!vancouver&&!inWA&&!inBC;
}
