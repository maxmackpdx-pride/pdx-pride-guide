/** Use the catalog pin for both providers, never an ambiguous place-name search. */
export function directionsFor(place){
 const {lat,lng}=place;
 if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)throw new Error('Invalid destination coordinates');
 const destination=`${lat},${lng}`;
 const google=new URL(place.directionsDisabled?'https://www.google.com/maps/search/':'https://www.google.com/maps/dir/');
 google.searchParams.set('api','1');google.searchParams.set(place.directionsDisabled?'query':'destination',destination);
 const apple=new URL('https://maps.apple.com/');
 if(place.directionsDisabled){apple.searchParams.set('ll',destination);apple.searchParams.set('q',place.name);}else apple.searchParams.set('daddr',destination);
 return {google:google.href,apple:apple.href,mapOnly:!!place.directionsDisabled};
}
