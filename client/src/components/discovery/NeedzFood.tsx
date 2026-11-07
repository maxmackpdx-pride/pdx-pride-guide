import {useState, type FormEvent} from 'react';
import {useQuery} from '@tanstack/react-query';
import {ArrowUpRight, Search, ChevronLeft, ChevronRight, MapPin} from 'lucide-react';
import type {FoodResults,FoodType} from '@shared/foodResources';

const options:{id:FoodType;label:string}[]=[{id:'groceries',label:'Pantries & groceries'},{id:'meals',label:'Meals'},{id:'produce',label:'Produce'},{id:'snap',label:'SNAP & Double Up'}];
const validZip=(zip:string)=>/^\d{5}$/.test(zip);
export function NeedzFood(){
 const initial=new URLSearchParams(window.location.search);
 const [input,setInput]=useState(initial.get('zip')||'');
 const [zip,setZip]=useState(validZip(initial.get('zip')||'')?initial.get('zip')!:'');
 const [type,setType]=useState<FoodType>(options.find(o=>o.id===initial.get('foodType'))?.id||'groceries');
 const [page,setPage]=useState(1);
 const [zipError,setZipError]=useState('');
 const sourceUrl=`https://foodfinder.oregonfoodbank.org/?q=${encodeURIComponent(zip)}${type==='snap'?'&campaign=1':''}`;
 const save=(nextZip:string,nextType:FoodType)=>{const url=new URL(window.location.href);url.searchParams.set('need','food');if(nextZip)url.searchParams.set('zip',nextZip);url.searchParams.set('foodType',nextType);window.history.replaceState(window.history.state,'',`${url.pathname}${url.search}${url.hash}`);};
 const results=useQuery<FoodResults>({queryKey:[`/api/food-resources?zip=${zip}&type=${type}&page=${page}`],enabled:validZip(zip),staleTime:5*60_000,retry:1});
 const search=(event:FormEvent)=>{event.preventDefault();const next=input.trim();if(!validZip(next)){setZipError('Enter a five-digit ZIP Code.');return;}setZipError('');setPage(1);setZip(next);save(next,type);};
 const select=(next:FoodType)=>{setType(next);setPage(1);save(zip,next);};
 return <section className="nf" aria-labelledby="needz-food-title">
  <p className="rd-eyebrow">Food & groceries</p><h2 id="needz-food-title">Find food near you.</h2>
  <p className="nf-intro">Pantries, meals and ways to stretch your SNAP benefits. Search Oregon and Southwest Washington.</p>
  <form className="nf-search" onSubmit={search}><label htmlFor="needz-food-zip">ZIP Code</label><div><input id="needz-food-zip" name="zip" inputMode="numeric" autoComplete="postal-code" maxLength={5} placeholder="e.g. 97215" value={input} aria-invalid={Boolean(zipError)} aria-describedby={zipError?'needz-food-error':undefined} onChange={e=>setInput(e.target.value)}/><button type="submit"><Search size={18}/>Find food</button></div>{zipError&&<p id="needz-food-error" role="alert">{zipError}</p>}</form>
  <div className="nf-types" role="group" aria-label="Food resources">{options.map(option=><button type="button" key={option.id} aria-pressed={type===option.id} onClick={()=>select(option.id)}>{option.label}</button>)}</div>
  {type==='snap'&&<div className="nf-benefits"><h3>Get more from SNAP</h3><p>These locations participate in Double Up Food Bucks. Check each program’s rules and availability.</p><div><a href="https://www.oregon.gov/odhs/food/Pages/snap.aspx" target="_blank" rel="noopener noreferrer">Apply for Oregon SNAP <ArrowUpRight size={15}/></a><a href="https://doubleuporegon.org/how-it-works/" target="_blank" rel="noopener noreferrer">How Double Up works <ArrowUpRight size={15}/></a><a href="https://www.dshs.wa.gov/esa/community-services-offices/basic-food" target="_blank" rel="noopener noreferrer">Washington Basic Food <ArrowUpRight size={15}/></a></div></div>}
  {!zip&&<p className="nf-status">Enter your ZIP Code to find nearby options. No account needed.</p>}
  {zip&&results.isPending&&<p className="nf-status" role="status">Finding food resources near {zip}…</p>}
  {zip&&results.isError&&<div className="nf-status" role="alert"><p>We couldn’t refresh Food Finder right now.</p><button className="rd-text" type="button" onClick={()=>void results.refetch()}>Try again</button><a href={sourceUrl} target="_blank" rel="noopener noreferrer">Search Oregon Food Bank <ArrowUpRight size={15}/></a></div>}
  {zip&&results.data&&<>
   <div className="nf-result-head"><p role="status">{results.data.total} option{results.data.total===1?'':'s'} near {zip}{results.isFetching?' · Updating…':''}</p></div>
   {results.data.stale&&<p className="nf-stale" role="status">Showing saved results while Food Finder is unavailable. Confirm details with the provider.</p>}
   {!results.data.resources.length?<p className="nf-status">No matching locations found. Try another food type or a nearby ZIP Code.</p>:<ul className="nf-results">{results.data.resources.map(resource=><li key={resource.id}>
    <div className="nf-result-title"><h3>{resource.name}</h3>{resource.distance&&<span>{resource.distance}</span>}</div>
    <p className="nf-kind">{resource.categories.join(' · ')}</p><p className="nf-address"><MapPin size={15}/>{resource.address}</p>
    {resource.hours.length?<ul className="nf-hours" aria-label="Listed hours">{resource.hours.map((hour,i)=><li key={i}>{hour}</li>)}</ul>:<p className="nf-muted">Check the provider for current hours.</p>}
    {resource.notes&&<p className="nf-notes">{resource.notes}</p>}{resource.serviceArea&&<p className="nf-muted">Service area: {resource.serviceArea}</p>}
    <div className="nf-links">{resource.onlineUrl&&<a className="nf-online" href={resource.onlineUrl} target="_blank" rel="noopener noreferrer">{resource.onlineLabel}<ArrowUpRight size={15}/></a>}
     <a href={resource.website||resource.sourceUrl} target="_blank" rel="noopener noreferrer">{resource.website?'Visit website':'Food Finder details'}<ArrowUpRight size={15}/></a>
     {resource.phone&&<a href={`tel:${resource.phone.replace(/[^\d+]/g,'')}`}>Call {resource.phone}</a>}
    </div>
   </li>)}</ul>}
   {results.data.totalPages>1&&<div className="nf-pagination"><button type="button" disabled={page<=1||results.isFetching} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={18}/>Previous</button><span>Page {results.data.page} of {results.data.totalPages}</span><button type="button" disabled={page>=results.data.totalPages||results.isFetching} onClick={()=>setPage(p=>p+1)}>Next<ChevronRight size={18}/></button></div>}
   <p className="nf-updated">Retrieved {new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'America/Los_Angeles',timeZoneName:'short'}).format(new Date(results.data.fetchedAt))}. Hours and availability can change.</p>
  </>}
  <footer className="nf-source">Listings from <a href={sourceUrl} target="_blank" rel="noopener noreferrer">Oregon Food Bank’s Food Finder <ArrowUpRight size={14}/></a>. Links open the provider’s site when available.</footer>
 </section>;
}
