// Avatar/name/time hierarchy informed by 21st's Activity Feed (comment-thread-3).
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function feedIdentity(item,label,now=Date.now()){
 const system=item.kind==='weather'||item.kind==='checkin';
 const name=system?(item.kind==='weather'?'Weather update':'Community check-ins'):(item.author||'Community');
 const initials=name.trim().split(/\s+/).slice(0,2).map(n=>Array.from(n)[0]||'').join('').toUpperCase();
 let photo='';
 if(!system&&!item.demo&&item.authorAvatarUrl){try{const u=new URL(item.authorAvatarUrl,'https://outzide.invalid');if(u.protocol==='https:')photo=u.origin==='https://outzide.invalid'?u.pathname+u.search:u.href;}catch{}}
 const symbol=item.kind==='weather'?'<path d="M6 16a4 4 0 1 1 1-7 5 5 0 0 1 10-1 4 4 0 0 1 1 8H6Z"/>':'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5"/>';
 const created=new Date(item.createdAt),minutes=Math.max(0,Math.floor((now-created.getTime())/60000));
 const time=Number.isFinite(minutes)?minutes<1?'Just now':minutes<60?minutes+'m ago':minutes<1440?Math.floor(minutes/60)+'h ago':Math.floor(minutes/1440)+'d ago':'';
 return '<header class="field-post-identity"><span class="field-avatar" aria-hidden="true">'+(system?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">'+symbol+'</svg>':'<span>'+escape(initials)+'</span>'+(photo?'<img src="'+escape(photo)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':''))+'</span><div class="field-author"><strong>'+escape(name)+'</strong><span>'+escape(label)+(item.demo?' · Demo':'')+'</span></div>'+(time?'<time datetime="'+created.toISOString()+'" title="'+escape(created.toLocaleString())+'">'+time+'</time>':'')+'</header>';
}
