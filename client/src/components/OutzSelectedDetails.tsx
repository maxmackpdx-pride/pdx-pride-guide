import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { OutzDiscoveryPlace } from '@/pages/Outz';
import type { OutzDetails } from '@shared/outzDetails';
import { haversineMeters, type GeoPoint } from '@shared/geo';
import { apiRequest } from '@/lib/queryClient';
import { publicHttpUrl } from '@shared/safeHttpUrl';
import './OutzSelectedDetails.css';
const stamp = (s:string)=>new Date(s).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
export default function OutzSelectedDetails({place}:{place:OutzDiscoveryPlace}) {
  const [origin,setOrigin]=useState<GeoPoint|null>(null);
  const [locationStatus,setLocationStatus]=useState('');
  const [locating,setLocating]=useState(false);
  const hasPoint=Number.isFinite(place.lat)&&Number.isFinite(place.lng);
  const q=useQuery<OutzDetails>({queryKey:['/api/outz/details',place.id],queryFn:()=>apiRequest('GET',`/api/outz/details?place=${encodeURIComponent(place.id)}`).then(r=>r.json()),staleTime:60_000});
  const locate=()=>{
    if(!navigator.geolocation){setLocationStatus('Location is unavailable in this browser.');return;}
    setLocating(true);setLocationStatus('');
    navigator.geolocation.getCurrentPosition(p=>{setOrigin({lat:p.coords.latitude,lng:p.coords.longitude});setLocating(false);setLocationStatus('');},e=>{setLocating(false);setLocationStatus(e.code===1?'Location access is off. Enable it in browser settings to show miles.':'Couldn’t find your location. Try again.');},{enableHighAccuracy:false,timeout:12_000,maximumAge:60_000});
  };
  const miles=origin&&hasPoint?haversineMeters(origin,{lat:place.lat!,lng:place.lng!})/1609.344:null;
  return <div className="outz-spot-details">
    <div className="outz-spot-summary">
      <div><h3>From you</h3>{miles!==null?<><b>{miles.toFixed(1)} mi</b><small>Straight-line to published waypoint</small></>:<small>{hasPoint?'Use your location to see miles.':'No published location'}</small>}{hasPoint&&<button type="button" disabled={locating} onClick={locate}>{locating?'Locating…':origin?'Update location':'Use my location'}</button>}<small role="status">{locationStatus}</small></div>
      <div><h3>Community rating</h3>{q.isPending?<small>Loading…</small>:q.isError?<small>Rating unavailable</small>:q.data?.rating.average!=null?<><b>★ {q.data.rating.average.toFixed(1)} / 5</b><small>{q.data.rating.count} {q.data.rating.count===1?'rating':'ratings'} · OutZide</small></>:<><b>Not rated yet</b><small>OutZide community</small></>}</div>
    </div>
    {q.isPending?<p role="status">Loading forecast and spot details…</p>:q.isError?<div role="status"><p>Spot details couldn’t load.</p><button type="button" onClick={()=>q.refetch()}>Try again</button></div>:q.data&&<>
      <h3>7-day forecast</h3>
      {q.data.forecastUnavailable?<p>{hasPoint?'Forecast temporarily unavailable.':'A published location is needed for a local forecast.'}</p>:<>
        <div className="outz-spot-forecast" role="region" tabIndex={0} aria-label="Seven-day area forecast">{q.data.forecast.map(day=><div key={day.date} className="outz-spot-day"><time dateTime={day.date}>{new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}</time><b>{day.highF==null?'—':`${Math.round(day.highF)}°`} / {day.lowF==null?'—':`${Math.round(day.lowF)}°`} F</b><span>{day.summary}</span>{day.rainChance!=null&&<small>Precip. {day.rainChance}%</small>}{day.wind&&<small>{day.wind}</small>}</div>)}</div>
        <small>High / low · {q.data.forecast.length<7?'Only the available forecast days are shown. ':''}A dash means that day or night period is unavailable.</small>
      </>}
      {hasPoint&&<small><a href={`https://forecast.weather.gov/MapClick.php?lat=${place.lat}&lon=${place.lng}`} target="_blank" rel="noopener noreferrer">National Weather Service ↗</a>{q.data.forecastUpdatedAt&&` · Updated ${stamp(q.data.forecastUpdatedAt)}`}</small>}
      <h3>At this spot</h3>
      {q.data.factsUnavailable&&<p role="status">Some spot data could not refresh. Check source dates below.</p>}
      {q.data.facts.length?<dl className="outz-spot-facts">{q.data.facts.map((fact,i)=><div key={`${fact.label}-${i}`}><dt>{fact.label}</dt><dd>{fact.value}<small>{publicHttpUrl(fact.href)?<a href={publicHttpUrl(fact.href)!} target="_blank" rel="noopener noreferrer">{fact.source} ↗</a>:fact.source}{fact.asOf&&` · ${stamp(fact.asOf)}`}</small></dd></div>)}</dl>:<p>No additional verified stats published for this spot yet.</p>}
    </>}
  </div>;
}
