import { winterResorts } from '../shared/outzWinterCatalog';
export const plainText = (value: unknown) => String(value ?? '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&quot;|&#34;/gi,'"').replace(/&amp;/gi,'&').replace(/&#0?39;|&apos;/gi,"'").replace(/\s+/g,' ').trim();
const inches=(v:any):number|null=>v?.countryUnit==='INCH'&&Number.isFinite(v.countryValue)?v.countryValue:v?.unit==='CENTIMETER'&&Number.isFinite(v.value)?Math.round(v.value/2.54*10)/10:null;
const number=(v:unknown):number|null=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
export type ResortReport={sourceUrl:string;updatedAt:string|null;dateLabel?:string;freshness:'recent'|'stale'|'unknown';snow24In:number|null;baseIn:number|null;lifts:Array<{name:string;status:string;updatedAt?:string|null}>;summary?:string;unavailable?:boolean};
export function freshness(updatedAt:string|null, now=Date.now()):ResortReport['freshness'] {const t=Date.parse(updatedAt||'');return !Number.isFinite(t)||t>now+3600000?'unknown':now-t>24*3600000?'stale':'recent'}
export function parseMeadows(raw:any,poi:any,sourceUrl:string):ResortReport{
 const zone=raw?.data?.snow?.snowZones?.find((z:any)=>z.altitudeLevel==='LOW');const updatedAt=zone?.lastModified||null;
 const lifts=(Array.isArray(poi?.data)?poi.data:[]).filter((p:any)=>p.name&&p.types?.some((t:string)=>/LIFT|CHAIR|GONDOLA|CARPET|TOW/.test(t))&&!p.types.includes('SECTOR')).map((p:any)=>({name:String(p.name),status:String(p.availability?.openingStatus||p.status||'Unknown'),updatedAt:p.lastModified||null}));
 return {sourceUrl,updatedAt,freshness:freshness(updatedAt),snow24In:inches(zone?.freshSnowFallDepth24H),baseIn:inches(zone?.snowTotalDepth),lifts};
}
export function parseBachelor(rows:any,lifts:any,sourceUrl:string):ResortReport{
 const r=Array.isArray(rows)?[...rows].sort((a,b)=>(b.updated||0)-(a.updated||0))[0]:null;const updatedAt=Number.isFinite(r?.updated)?new Date(r.updated*1000).toISOString():null;
 return {sourceUrl,updatedAt,freshness:freshness(updatedAt),snow24In:r?.unit_of_measurement==='in'?number(r?.computed?.['24_hour']):null,baseIn:r?.unit_of_measurement==='in'?number(r?.base_depth):null,summary:plainText(r?.report).slice(0,700),lifts:(Array.isArray(lifts)?lifts:[]).filter(l=>l.season==='winter').map(l=>({name:String(l.name),status:String(l.status||'Unknown'),updatedAt:Number.isFinite(l.updated)?new Date(l.updated*1000).toISOString():null}))};
}
export function parseReportHtml(html:string,sourceUrl:string):ResortReport{
 const text=plainText(html);const dateLabel=text.match(/Updated\s+([A-Z][a-z]+\s+\d{1,2},\s+20\d{2}\s+at\s+\d{1,2}:\d{2}\s*[AP]M)/)?.[1];
 // Do not invent a timezone or call a retrieval time the report's observation time.
 const snow=text.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(?:"|inches)\s*24[- ]Hour Snowfall/i);
 const base=text.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(?:"|inches)\s*(?:Lower Mountain|Base Depth)/i);
 const table=[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>[...m[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(c=>plainText(c[1])));
 const lifts=table.filter(row=>row.length>=2&&/chair|carpet|express|gondola|lift/i.test(row[0])&&/^(open|closed|hold|scheduled|delayed|standby)/i.test(row[1])).map(row=>({name:row[0],status:row[1]}));
 return {sourceUrl,updatedAt:null,dateLabel,freshness:'unknown',snow24In:snow?Number(snow[1]):null,baseIn:base?Number(base[1]):null,lifts};
}
export function parsePassPrices(html:string){
 const quotes=[...html.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(m=>plainText(m[1])).filter(t=>/\$\d/.test(t)&&/age|adult|youth|senior|teen|child|pass/i.test(t)&&t.length<500);
 return [...new Set(quotes)].slice(0,4);
}
async function get(url:string,json=true){const response=await fetch(url,{headers:{'User-Agent':'Zaylist Outzide (+https://www.zaylist.com)',Accept:json?'application/geo+json, application/json':'text/html'},signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error(`Source HTTP ${response.status}`);return json?response.json():response.text();}
export async function getWinterWeather(lat:number,lng:number){
 const point=await get(`https://api.weather.gov/points/${lat.toFixed(4)},${lng.toFixed(4)}`);const url=point?.properties?.forecast;
 if(typeof url!=='string'||new URL(url).origin!=='https://api.weather.gov')throw Error('Forecast unavailable');const data=await get(url);
 return {sourceUrl:url,updatedAt:data.properties?.updated||null,periods:(data.properties?.periods||[]).slice(0,6).map((p:any)=>({name:p.name,startTime:p.startTime,temperature:p.temperature,temperatureUnit:p.temperatureUnit,windSpeed:p.windSpeed,shortForecast:p.shortForecast,detailedForecast:p.detailedForecast}))};
}
const cache=new Map<string,{at:number;data:any}>();const pending=new Map<string,Promise<any>>();
export async function getWinterConditions(id:string){
 const resort=winterResorts.find(p=>p.id===id);if(!resort)return null;
 const old=cache.get(id);if(old&&Date.now()-old.at<10*60_000)return old.data;if(pending.has(id))return pending.get(id);
 const work=(async()=>{
 const [report,weather,prices]=await Promise.allSettled([(async()=>{
  if(resort.key==='meadows'){const [raw,poi]=await Promise.all([get('https://www.skihood.com/api/weather/report?includeResortInfo=true&includeSnowInfo=true'),get('https://www.skihood.com/api/weather/poi?include=Nordic%20Center,Lifts,Parking%20Lots,Access%20Gates,TERRAIN_PARKS')]);return parseMeadows(raw,poi,resort.reportUrl)}
  if(resort.key==='bachelor'){const [raw,lifts]=await Promise.all([get('https://api.mtbachelor.com/api/v1/dor/drupal/snow-reports?sort=date&direction=desc'),get('https://api.mtbachelor.com/api/v1/dor/drupal/lifts')]);return parseBachelor(raw,lifts,resort.reportUrl)}
  return parseReportHtml(await get(resort.reportUrl,false),resort.reportUrl);
 })(),resort.state==='BC'?Promise.resolve(null):getWinterWeather(resort.lat,resort.lng),get(resort.passUrl,false).then(parsePassPrices)]);
 const data={placeId:id,fetchedAt:new Date().toISOString(),report:report.status==='fulfilled'?report.value:{sourceUrl:resort.reportUrl,updatedAt:null,freshness:'unknown',snow24In:null,baseIn:null,lifts:[],unavailable:true},weather:weather.status==='fulfilled'?weather.value:null,passes:{url:resort.passUrl,note:resort.priceNote,quotes:prices.status==='fulfilled'?prices.value:[],checkedAt:new Date().toISOString()}};
 cache.set(id,{at:Date.now(),data});return data;
 })().finally(()=>pending.delete(id));pending.set(id,work);return work;
}
