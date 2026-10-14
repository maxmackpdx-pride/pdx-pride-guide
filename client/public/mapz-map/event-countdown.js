/** Use the host's Pacific-normalized timestamp and the map's displayed clock. */
export function eventCountdown(startsAt,now){
 if(typeof startsAt!=='number'||!Number.isFinite(startsAt)||!Number.isFinite(now))return '';
 const remaining=startsAt-now;
 if(remaining<=0)return 'STARTED';
 const minutes=Math.ceil(remaining/60000);
 if(minutes<60)return `IN ${minutes} MIN`;
 const hours=Math.floor(minutes/60),rest=minutes%60;
 if(hours<24)return `IN ${hours}H${rest?` ${rest}M`:''}`;
 const days=Math.floor(hours/24),restHours=hours%24;
 return `IN ${days}D${restHours?` ${restHours}H`:''}`;
}
