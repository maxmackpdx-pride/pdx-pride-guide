/** Use the host's Pacific-normalized timestamp and the map's displayed clock. */
export function eventCountdown(startsAt,now,seconds=false){
 if(typeof startsAt!=='number'||!Number.isFinite(startsAt)||!Number.isFinite(now))return '';
 const remaining=startsAt-now;
 if(remaining<=0)return 'STARTED';
 if(seconds){const total=Math.ceil(remaining/1000),s=total%60,m=Math.floor(total/60)%60,h=Math.floor(total/3600)%24,d=Math.floor(total/86400);return `IN ${d?`${d}D `:''}${h||d?`${h}H `:''}${m}M ${s}S`;}
 const minutes=Math.ceil(remaining/60000);
 if(minutes<60)return `IN ${minutes} MIN`;
 const hours=Math.floor(minutes/60),rest=minutes%60;
 if(hours<24)return `IN ${hours}H${rest?` ${rest}M`:''}`;
 const days=Math.floor(hours/24),restHours=hours%24;
 return `IN ${days}D${restHours?` ${restHours}H`:''}`;
}

/** Foreground-only digital readout; the button retains the full spoken status. */
export function appendEventCountdown(element,status){
 element.setAttribute('aria-hidden','true');
 const live=status==='STARTED';element.dataset.state=live?'live':'upcoming';
 const add=(className,text)=>{const node=document.createElement('span');node.className=className;node.textContent=text;element.appendChild(node);};
 if(live){add('event-countdown-dot','');add('event-countdown-live','Live');return;}
 const parts=[...String(status).matchAll(/(\d+)\s*(MIN|H|M|D|S)/g)];
 if(!parts.length){element.textContent=status;return;}
 add('event-countdown-prefix','IN');
 parts.forEach((part,index)=>{
  if(index)add('event-countdown-separator',':');
  const group=document.createElement('span');group.className='event-countdown-group';
  const value=document.createElement('span');value.className='event-countdown-number';value.textContent=part[1].padStart(2,'0');
  const unit=document.createElement('span');unit.className='event-countdown-unit';unit.textContent=part[2]==='MIN'?'m':part[2].toLowerCase();
  group.append(value,unit);element.appendChild(group);
 });
}
