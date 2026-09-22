import {winterResorts} from '../shared/outzWinterCatalog';
const schedules:Record<string,string>={meadows:'https://www.skihood.com/explore/schedule',hoodoo:'https://hoodoo.com/hours/'};
export function parseWinterSeason(key:string,html:string,now=Date.now()){
 // Some official sites embed their schedule as escaped HTML in the page payload.
 const text=html.replace(/\\u003c/gi,'<').replace(/\\u003e/gi,'>').replace(/\\u0026/gi,'&').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ');
 const dates=[...text.matchAll(/Opening Day\s*:\s*(\d{1,2})\/(\d{1,2})\/(20\d{2})/gi)].map(m=>`${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`).filter(d=>{const t=Date.parse(d+'T00:00:00-08:00');return Number.isFinite(t)&&t>now&&t-now<365*86400000&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;});
 const expectedOpening=dates.sort()[0]||null;
 const closed=/\b(?:winter operations|skiing\s*(?:&|and)\s*snowboarding)\s*[:–—-]?\s*(?:are\s*)?closed (?:for|until) (?:the |next )?season/i.test(text)
  ||key==='hoodoo'&&/HOURS\s+Closed until next season/i.test(text)
  ||key==='49north'&&/Chairs Operating\s+Closed for the season/i.test(text);
 const open=/\b(?:winter operations|skiing\s*(?:&|and)\s*snowboarding)\s*(?:[:–—-]\s*(?:are\s*)?|are\s+)open\b/i.test(text);
 // A planned future season can be pre-season; passing the date never proves opening.
 const preseason=key==='meadows'&&!!expectedOpening&&/Planned Schedule for the 20\d{2}[-–]\d{2} Season/i.test(text);
 return {status:open&&!closed?'open':closed||preseason?'seasonal':'unknown',expectedOpening,scope:'winter',reason:closed?'Winter operations closed for the season':preseason?'Winter season has not started':open?'Winter operations open':'Winter status not verified'};
}
export async function getWinterSeasonStatuses(){return Promise.all(winterResorts.map(async p=>{
 const sourceUrl=schedules[p.key]||p.reportUrl,checkedAt=new Date().toISOString();
 try{const response=await fetch(sourceUrl,{signal:AbortSignal.timeout(9000)});if(!response.ok)throw Error();const season=parseWinterSeason(p.key,await response.text());return {placeId:p.id,...season,sourceUrl,checkedAt,sourceUpdatedAt:null};}
 catch{return {placeId:p.id,status:'unknown',scope:'winter',expectedOpening:null,reason:'Winter status source unavailable',sourceUrl,checkedAt,sourceUpdatedAt:null};}
}));}
