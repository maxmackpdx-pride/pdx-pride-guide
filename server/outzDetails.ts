import type { OutzDetails, OutzForecastDay, OutzSpotFact } from "@shared/outzDetails";
import type { OutzSnapshot } from "@shared/outz";
import { getOutzPlaceRating } from "./outzSocial";
import { getNudeBeachesSnapshot } from "./nudeBeaches";
import { BEACH_MAP_LOCATIONS } from "@shared/nudeBeaches";
const USFS = "https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_InfraRecreationSites_01/MapServer/0/query";
const headers = { "User-Agent": "Zaylist OutZide (https://www.zaylist.com)", Accept: "application/geo+json, application/json" };
async function json(url: string) {
  const r = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
  if (!r.ok) throw new Error(`Source returned ${r.status}`);
  return r.json();
}
export type ForecastPeriod = { startTime: string; isDaytime: boolean; temperature: number; temperatureUnit: string; shortForecast?: string; windSpeed?: string; windDirection?: string; probabilityOfPrecipitation?: { value: number | null } };
export function forecastDays(periods: ForecastPeriod[], now = Date.now()): OutzForecastDay[] {
  const today = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const days = new Map<string, OutzForecastDay>();
  for (const p of periods) {
    const date = p.startTime?.slice(0,10);
    if (!date || date < today) continue;
    const d = days.get(date) || {date,highF:null,lowF:null,summary:'',wind:'',rainChance:null};
    const temp = Number.isFinite(p.temperature) ? (p.temperatureUnit === 'C' ? p.temperature * 9 / 5 + 32 : p.temperature) : null;
    if (p.isDaytime) d.highF = temp; else d.lowF = temp;
    if (p.isDaytime || !d.summary) { d.summary = p.shortForecast || ''; d.wind = [p.windDirection,p.windSpeed].filter(Boolean).join(' '); }
    const chance = p.probabilityOfPrecipitation?.value;
    if (typeof chance === 'number') d.rainChance = Math.max(d.rainChance ?? 0, chance);
    days.set(date,d);
  }
  return [...days.values()].sort((a,b)=>a.date.localeCompare(b.date)).slice(0,7);
}
const clean = (value: unknown) => String(value ?? '').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
export function usfsFacts(a: Record<string, unknown>, href: string): OutzSpotFact[] {
  const fields: Record<string,string> = {recarea_status:'Access status',current_conditions:'Conditions',fee_description:'Fees',open_season:'Open season',operational_hours:'Hours',water_availability:'Drinking water',restroom_availability:'Restrooms',minimum_elevation:'Elevation',usage_level:'Typical use',permit_information:'Permits',restrictions:'Restrictions',passes:'Passes'};
  const asOf = typeof a.last_update === 'number' ? new Date(a.last_update).toISOString() : undefined;
  const facts = Object.entries(fields).flatMap(([field,label])=>{
    const value = clean(a[field]);
    return !value || /^(none|null|unknown|n\/a|feet)$/i.test(value) ? [] : [{label,value,source:'US Forest Service',href,asOf}];
  });
  if (!facts.some(f=>f.label==='Fees') && ['Y','N'].includes(String(a.fee_charged))) facts.push({label:'Fees',value:a.fee_charged==='Y'?'Fee charged — check visitor page':'No fee listed in USFS record',source:'US Forest Service',href,asOf});
  return facts;
}
export function forestVisitorFacts(html: string, href: string): OutzSpotFact[] {
  const facts: OutzSpotFact[] = [];
  const updated = clean(html.match(/Last updated\s+([^<]+)/i)?.[1]);
  const date = updated && Number.isFinite(Date.parse(updated)) ? new Date(updated).toISOString() : undefined;
  for (const [heading,label] of [['Parking','Parking'],['Restrooms','Restrooms'],['Water','Drinking water']]) {
    const text = html.match(new RegExp(`<h3[^>]*>\\s*${heading}\\s*</h3>[\\s\\S]*?<p>([\\s\\S]*?)</p>`, 'i'))?.[1];
    if (text) facts.push({label,value:clean(text),source:'USFS visitor page',href,asOf:date});
  }
  return facts;
}
const cache = new Map<string, {at:number; data:OutzDetails}>();
const pending = new Map<string,Promise<OutzDetails>>();
export async function getOutzDetails(id: string, snapshot: OutzSnapshot): Promise<OutzDetails | null> {
  const beach = id === 'rooster-rock' || id === 'sauvie-island' ? BEACH_MAP_LOCATIONS[id] : null;
  const place = [...snapshot.destinations,...snapshot.catalog,...snapshot.communityStays].find(p=>p.id===id);
  if (!place && !beach) return null;
  const rating = () => { const r = getOutzPlaceRating(id); return {average:r.average,count:r.count}; };
  const hit = cache.get(id);
  if (hit && Date.now()-hit.at < (hit.data.forecastUnavailable || hit.data.factsUnavailable ? 60_000 : 20*60_000)) return {...hit.data,rating:rating()};
  if (pending.has(id)) return {...await pending.get(id)!,rating:rating()};
  const request = (async()=>{
    const data:OutzDetails = {placeId:id,fetchedAt:new Date().toISOString(),forecastUpdatedAt:null,forecast:[],forecastUnavailable:false,facts:[],factsUnavailable:false,rating:rating()};
    const location = beach || place;
    await Promise.all([
      (async()=>{
        if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {data.forecastUnavailable=true;return;}
        try {
          const point = await json(`https://api.weather.gov/points/${location.lat!.toFixed(4)},${location.lng!.toFixed(4)}`);
          const url = new URL(point.properties.forecast);
          if (url.protocol !== 'https:' || url.hostname !== 'api.weather.gov') throw new Error('Invalid forecast source');
          const forecast = await json(url.href);
          data.forecast = forecastDays(forecast.properties.periods);
          data.forecastUpdatedAt = forecast.properties.updated || forecast.properties.updateTime || data.fetchedAt;
          data.forecastUnavailable = !data.forecast.length;
        } catch {data.forecastUnavailable=true;}
      })(),
      (async()=>{
        try {
          if (id.startsWith('usfs-')) {
            const cn = id.slice(5);
            if (!/^[\d.]+$/.test(cn)) throw new Error('Invalid site');
            const q = new URLSearchParams({f:'json',where:`site_cn = '${cn}'`,outFields:'*',returnGeometry:'false'});
            const response = await json(`${USFS}?${q}`);
            const a = response.features?.[0]?.attributes;
            if (!a) throw new Error('No source record');
            data.facts = usfsFacts(a, `${USFS}?${q}`);
            // Verified current visitor page; INFRA has no visitor URL for this record.
            const visitorUrl = id === 'usfs-6795235010602' ? 'https://www.fs.usda.gov/r06/mthood/recreation/44-trails-hub-trailhead' : place?.officialUrl;
            if (visitorUrl && /^https:\/\/www\.fs\.usda\.gov\/r\d+\/[^/]+\/recreation\//.test(visitorUrl)) {
              try {
                const href = visitorUrl;
                const response = await fetch(href, {headers,signal:AbortSignal.timeout(10_000)});
                if (!response.ok) throw new Error('Visitor page unavailable');
                const facts = forestVisitorFacts(await response.text(),href);
                if (!facts.length) throw new Error('Visitor page changed');
                data.facts = [...facts,...data.facts.filter(f=>!facts.some(p=>p.label===f.label))];
              } catch {data.factsUnavailable=true;}
            }
          } else if (beach) {
            const result = await getNudeBeachesSnapshot();
            const s = result.data;
            const add = (label:string,value:string|null,href:string,asOf=s.fetchedAt)=>{if(value)data.facts.push({label,value,href,asOf,source:id==='rooster-rock'?'Rooster Rock Crossing':'Sauvie Island sources'});};
            if(id==='rooster-rock') {
              const r=s.roosterRock;
              add('River level',r.riverLevelFt==null?null:`${r.riverLevelFt.toFixed(1)} ft · gauge height`, 'https://roosterrockcrossing.com/',r.riverLevelAt || s.fetchedAt);
              add('Water temperature',r.waterTempF==null?null:`${Math.round(r.waterTempF)}°F · ${r.waterTempSite || 'nearby Columbia station'}`, 'https://roosterrockcrossing.com/');
              add('Air quality',r.airQuality,'https://roosterrockcrossing.com/');
              data.factsUnavailable=Boolean(r.error) || result.stale;
            } else {
              const r=s.sauvieIsland;
              add('Water testing',r.swimStatusLabel && r.swimStatusLabel !== 'UNKNOWN' ? r.swimStatusLabel : null,'https://www.theswimguide.org/',r.lastSampleAt || s.fetchedAt);
              add('Parking',r.parkingStatusLabel,r.parkingHref);
              data.factsUnavailable=Boolean(r.error) || result.stale;
            }
          } else if (place && 'accessNote' in place) {
            data.facts.push({label:'About this stay',value:place.detail,source:'Operator listing',href:place.officialUrl,asOf:place.reviewedAt},{label:'Arrival & access',value:place.accessNote,source:'Operator listing',href:place.officialUrl,asOf:place.reviewedAt});
          } else if (place && 'sourceStatus' in place && place.sourceStatus) {
            data.facts.push({label:'Agency record',value:place.sourceStatus,source:place.sourceName,href:place.officialUrl,asOf:snapshot.fetchedAt});
          }
        } catch {data.factsUnavailable=true;}
      })(),
    ]);
    cache.set(id,{at:Date.now(),data});
    return data;
  })();
  pending.set(id,request);
  try{return await request;}finally{pending.delete(id);}
}
