import {useEffect,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {apiRequest} from '@/lib/queryClient';

type AccessRow={placeId:string;status:'open'|'closed'|'seasonal'|'unknown';sourceUrl?:string;scope?:string;checkedAt?:string;expectedOpening?:string};
const labels={open:'Source reports open',closed:'Source reports closed',seasonal:'Closed for the season',unknown:'Status unknown'};
function webUrl(value?:string|null) {
 try { const url=new URL(value??''); return ['https:','http:'].includes(url.protocol)?url.href:undefined; }
 catch { return undefined; }
}
export function OutzDestinationAccess({placeId,officialUrl}:{placeId:string;officialUrl:string|null}){
 const [now,setNow]=useState(Date.now);
 useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),30_000);return()=>window.clearInterval(timer);},[]);
 const access=useQuery<{statuses:AccessRow[]}>({
   queryKey:['/api/outz/closures'],
   queryFn:async()=>{const res=await apiRequest('GET','/api/outz/closures');return res.json();},
   staleTime:5*60_000,
 });
 const row=access.data?.statuses?.find(record=>record.placeId===placeId);
 const checked=Date.parse(row?.checkedAt??'');
 const age=Math.max(now,access.dataUpdatedAt)-checked;
 const current=row&&row.status!=='unknown'&&age>=0&&age<15*60_000&&!access.isError;
 const source=webUrl(row?.sourceUrl)||webUrl(officialUrl);
 return <section className="outz-access-source" aria-label="Current access" aria-live="polite">
   <strong>{current?labels[row.status]:access.isPending?'Checking access…':'Current access unverified'}</strong>
   {row&&!current&&<p>Last report: {labels[row.status]}. This is not a current opening-status report.</p>}
   {Number.isFinite(checked)&&<p>Source checked <time dateTime={row!.checkedAt}>{new Date(checked).toLocaleString()}</time>. This is not the observation time.</p>}
   {current&&row.expectedOpening&&<p>Source estimate: {row.expectedOpening}. This is not a confirmed opening.</p>}
   {access.isError&&<p>Access couldn’t refresh. Check the managing agency before visiting.</p>}
   {!row&&!access.isPending&&!access.isError&&<p>No current status is available. Check the managing agency before visiting.</p>}
   <div>{source&&<a href={source} target="_blank" rel="noopener noreferrer">Check official status</a>}
     <button type="button" disabled={access.isFetching} onClick={()=>{setNow(Date.now());void access.refetch();}}>Refresh access</button></div>
 </section>;
}
