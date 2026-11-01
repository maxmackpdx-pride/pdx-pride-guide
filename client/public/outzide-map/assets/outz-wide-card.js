import {photoMarkup,createPhotoMotion,createBlendEnhancer} from './destination-photos.js';
import {motifImage,networkMarkup} from './library-motifs.js';
import {uiIcon} from './ui-icons.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kinds={winter:'Winter sports',dayuse:'Day use',fishing:'Fishing',boating:'Boating',atv:'ATV',watercamp:'Lake / river camp',coastcamp:'Coastal camp',spring:'Hot spring',trail:'Trail',camp:'Camp + hike',stay:'Community stay',beach:'Nude beach'};
const icons={winter:'<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-1-1-4M20 14l-4 1 1 4M4 14l4 1-1 4M20 10l-4-1 1-4"/>',dayuse:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',fishing:'<path d="M3 12q7-9 14-1l4-4v10l-4-4q-7 8-14-1ZM13 7q-2 5 0 10M8 7l2-3 3 3"/><circle cx="6.5" cy="11" r=".7"/>',boating:'<path d="M3 15h18l-4 5H7l-4-5ZM12 3v12M10 5l-6 8h6V5ZM14 7l6 6h-6V7ZM2 22q2.5-2 5 0t5 0 5 0 5 0"/>',atv:'<circle cx="6" cy="17" r="4"/><circle cx="19" cy="17" r="4"/><path d="m5 13 4-4h6l3 4M9 17h6M10 9l2-5h4M4 10h5M14 12h5M6 17h.1M19 17h.1"/>',watercamp:'<path d="m4 15 7-12 7 12H4Zm5 0 2-5 2 5M2 18.5q2.5-2 5 0t5 0 5 0 5 0M2 22q2.5-2 5 0t5 0 5 0 5 0"/>',coastcamp:'<path d="m3 14 6-11 6 11H3Zm4 0 2-5 2 5M2 19q3-4 6 0t6 0 7 0M2 23q3-4 6 0t6 0 7 0"/>',spring:'<path d="M6 14q-3-3 0-6t0-5M12 14q-3-3 0-6t0-5M18 14q-3-3 0-6t0-5M3 18q9 8 18 0M3 22h18"/>',trail:'<path d="M4 3h7v7l3 3 5 1a3 3 0 0 1 2 3v3H3v-7l1-3V3ZM3 17h18M6 20v1M10 20v1M15 20v1M19 20v1M8 7h3M8 10h3M10 12l2-1M12 14l2-1"/>',stay:'<path d="m3 11 9-8 9 8M6 9v12h12V9M10 21v-7h4v7"/>',beach:'<path d="M3 16q3-4 6 0t6 0 6 0M3 21q3-4 6 0t6 0 6 0"/><circle cx="12" cy="7" r="3"/>',camp:'<path d="m2 19 7-15 7 15H2Zm5 0 2-6 2 6M7 3l4 4M18 17c-3-2-2-4 0-6 0 2 2 2 2 0 3 3 3 5 0 6M16 20l6 2M16 22l6-2"/>'};
const icon=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[k]}</svg>`;

export function outzWideMarkup(p,{area=p.region||'',active=false,accent='var(--neon-orange)',variant='wide'}={}){
 const line=p.routeMatch&&Number.isFinite(p.routeMiles)?p.routeMiles+' mi mapped':p.kind==='spring'?'Soak':['stay','camp','watercamp','coastcamp'].includes(p.kind)?'Overnight':p.kind==='trail'?'Route distance not verified':'';
 const state=p.state==='OR'?'Oregon':p.state==='WA'?'Washington':p.state||'';
 const title=String(p.name||'').split(/\s+/).map((word,i)=>`<span class="outz-word ${i%2?'outz-word--dark':'outz-word--light'}">${esc(word)}</span>`).join(' ');
 return `<button type="button" class="place-card outz-destination-card ${p.photo?'has-photo':''} ${active?'active':''}" data-variant="${esc(variant)}" data-center="${esc(p.id)}" style="--c:${esc(accent)}" aria-label="Open ${esc(p.name)}">${p.photo?photoMarkup(p.photo,'place-photo',p.id):motifImage(p,'place-art')}<span class="card-waypoint" aria-hidden="true">${icon(p.kind)}</span><span class="place-copy"><span class="kind-label">${esc(kinds[p.kind]||'Destination')}</span><strong aria-label="${esc(p.name)}">${title}</strong><small>${esc([area,state].filter(Boolean).join(' · '))}</small>${line?`<span class="trail-facts">${esc(line)}</span>`:''}</span><span class="place-arrow" aria-hidden="true">${uiIcon('arrow-up-right',18)}</span>${p.photo?'':networkMarkup(p.id)}</button>`;
}
export function mountOutzWideCard(host,place,options={}){
 host.innerHTML=outzWideMarkup(place,options);const photos=createPhotoMotion(),blend=createBlendEnhancer();photos.refresh(host);blend.refresh(host);
 const open=()=>options.onOpen?.(place);host.querySelector('button').addEventListener('click',open);
 return ()=>{photos.dispose();blend.dispose();host.querySelector('button')?.removeEventListener('click',open);host.replaceChildren();};
}
if(typeof window!=='undefined')window.__outzWideCard={mountOutzWideCard};
