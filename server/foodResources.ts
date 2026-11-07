import type {Express} from 'express';
import rateLimit from 'express-rate-limit';
import {z} from 'zod';
import {FOOD_TYPES, type FoodType, type FoodResource, type FoodResults} from '../shared/foodResources';

const ORIGIN = 'https://foodfinder.oregonfoodbank.org';
const TTL = 30 * 60_000;
const STALE_LIMIT = 24 * 60 * 60_000;
const categoryNames: Record<number,string> = {2:'Free meals',3:'Free produce & more',4:'Free groceries',5:'Other food programs',6:'SNAP at grocery stores',7:'SNAP at farmers markets',8:'SNAP at CSAs',9:'SNAP at farm stands'};
const categoryIds: Record<FoodType,number | null> = {groceries:4,meals:2,produce:3,snap:null};
const schema = z.object({
  id:z.string(),name:z.string(),address:z.string(),distance:z.string().nullable().optional(),
  location_categories:z.array(z.object({id:z.number()})).default([]),
  grouped_location_hours:z.array(z.object({days:z.array(z.number()).default([]),open_time:z.string().nullable().optional(),close_time:z.string().nullable().optional(),comment:z.string().nullable().optional()})).default([]),
  comment:z.string().nullable().optional(),hours_comment:z.string().nullable().optional(),
  served_areas:z.array(z.string()).default([]),website:z.array(z.string()).default([]),phone:z.string().nullable().optional(),
  location_closures:z.array(z.unknown()).default([]),
});
const responseSchema = z.object({locations:z.array(z.unknown()),meta:z.object({pagination:z.object({page:z.number(),count:z.number(),total_pages:z.number(),total_count:z.number()})})});

// Text only: source HTML is never rendered or executed in Needz.
export function foodText(value: string | null | undefined): string {
  return (value || '').replace(/<\/(?:p|li|div)>|<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,'')
    .replace(/&#(x[0-9a-f]+|\d+);/gi,(_,code:string)=>{const n=code[0].toLowerCase()==='x'?parseInt(code.slice(1),16):Number(code);return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';})
    .replace(/&(amp|quot|apos|lt|gt|nbsp);/g,(_,key:string)=>({amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '}[key]!))
    .replace(/[ \t]+/g,' ').replace(/\n\s*\n/g,'\n').trim().slice(0,3000);
}
function externalUrl(value: unknown): string | null {
  if(typeof value!=='string')return null;
  try {const url=new URL(value);if(!/^https?:$/.test(url.protocol)||url.username||url.password)return null;return url.href;}catch{return null;}
}
function time(value?: string | null) {
  const match=value?.match(/T(\d{2}):(\d{2})/);if(!match)return '';
  const h=Number(match[1]);return `${h%12||12}${match[2]==='00'?'':`:${match[2]}`} ${h>=12?'pm':'am'}`;
}
export function foodFinderUrl(zip:string,type:FoodType='groceries') {
  const url=new URL(ORIGIN);url.searchParams.set('q',zip);if(type==='snap')url.searchParams.set('campaign','1');return url.href;
}
export function normalizeFoodResource(input: unknown): FoodResource | null {
  const result=schema.safeParse(input);if(!result.success)return null;const row=result.data;
  const website=row.website.map(externalUrl).find(Boolean) || null;
  const notes=[foodText(row.hours_comment),foodText(row.comment)].filter(Boolean).join('\n');
  const sourceUrl=`${ORIGIN}/locations/${encodeURIComponent(row.id)}`;
  // The source has no uniform online-order field. Only label explicit ordering links;
  // CSC's current provider page confirms appointments/delivery requests, not generic ordering.
  const explicit=row.website.map(externalUrl).find(url=>url&&/\/(?:order-online|online-order|order)(?:[/?#]|$)/i.test(new URL(url).pathname));
  const csc=row.id==='clackamas-service-center-day-and-night-markets';
  const onlineUrl=csc?'https://www.cscoregon.org/order-online':explicit||null;
  const hours=row.grouped_location_hours.map(slot=>{
    const days=slot.days.map(d=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).filter(Boolean).join(', ');
    const start=time(slot.open_time),end=time(slot.close_time);
    return [days,start&&(end?`${start} to ${end}`:`from ${start}`),foodText(slot.comment)].filter(Boolean).join(' · ');
  }).filter(Boolean);
  // Closures remain text, with no inferred "open now" status.
  const closures=row.location_closures.map(c=>typeof c==='string'?foodText(c):c&&typeof c==='object'?Object.entries(c).filter(([k,v])=>/date|start|end|comment|reason|description/.test(k)&&typeof v==='string').map(([,v])=>foodText(v as string)).join(' · '):'').filter(Boolean);
  return {id:row.id,name:row.name,address:row.address.replace(/\s+/g,' ').trim(),distance:row.distance||null,categories:row.location_categories.map(c=>categoryNames[c.id]).filter(Boolean),hours,notes:[notes,...closures.map(c=>`Closure: ${c}`)].filter(Boolean).join('\n'),serviceArea:row.served_areas.join('; '),phone:row.phone||null,website,sourceUrl,onlineUrl,onlineLabel:onlineUrl?(csc?'Appointments & delivery':'Order online'):null};
}

export function createFoodFinder(fetcher: typeof fetch = fetch, now:()=>number=Date.now) {
  const cache=new Map<string,{at:number;value:FoodResults}>();
  const pending=new Map<string,Promise<FoodResults>>();
  return async (zip:string,type:FoodType,page=1):Promise<FoodResults>=>{
    const key=`${zip}:${type}:${page}`,hit=cache.get(key);
    if(hit&&now()-hit.at<TTL)return hit.value;
    const existing=pending.get(key);if(existing)return existing;
    const task=(async()=>{
      try {
        const url=new URL('/api/v1/locations',ORIGIN);
        url.searchParams.set('user_search',zip);url.searchParams.set('locale','en');url.searchParams.set('page',String(page));
        if(type==='snap')url.searchParams.set('active_campaign','true');
        else url.searchParams.append('location_categories[]',String(categoryIds[type]));
        const res=await fetcher(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(10_000)});
        if(!res.ok)throw new Error('Food Finder unavailable');
        const data=responseSchema.parse(await res.json());const meta=data.meta.pagination;
        // Food Finder returns map pins for every match, but details for this page only.
        const start=(meta.page-1)*meta.count;
        const resources=data.locations.slice(start,start+meta.count).map(normalizeFoodResource).filter((row):row is FoodResource=>Boolean(row));
        const value:FoodResults={resources,zip,type,page:meta.page,totalPages:meta.total_pages,total:meta.total_count,fetchedAt:new Date(now()).toISOString(),stale:false,sourceUrl:foodFinderUrl(zip,type)};
        if(cache.size>=120)cache.delete(cache.keys().next().value!);
        cache.set(key,{at:now(),value});return value;
      }catch(error){if(hit&&now()-hit.at<STALE_LIMIT)return {...hit.value,stale:true};throw error;}
      finally{pending.delete(key);}
    })();pending.set(key,task);return task;
  };
}
export function registerFoodResources(app: Express) {
  const finder=createFoodFinder();
  app.get('/api/food-resources',rateLimit({windowMs:60_000,limit:30,standardHeaders:true,legacyHeaders:false}),async(req,res)=>{
    const zip=String(req.query.zip||''),type=String(req.query.type||'groceries') as FoodType,page=Number(req.query.page||1);
    if(!/^\d{5}$/.test(zip)||!FOOD_TYPES.includes(type)||!Number.isInteger(page)||page<1||page>100){res.status(400).json({error:'Enter a five-digit ZIP Code and choose a food type.'});return;}
    res.setHeader('Cache-Control','no-store');
    try{res.json(await finder(zip,type,page));}catch{res.status(503).json({error:'Food Finder is taking longer than usual. Try again or search directly on Oregon Food Bank.',sourceUrl:foodFinderUrl(zip,type)});}
  });
}
