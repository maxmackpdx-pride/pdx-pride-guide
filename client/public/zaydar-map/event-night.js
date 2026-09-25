const nightClock=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'});
/** A Portland event night runs from 02:00 through 01:59 the next day. */
export function eventNight(value){
 const timestamp=typeof value==='number'?value:Date.parse(value);
 if(!Number.isFinite(timestamp))return '';
 const parts=Object.fromEntries(nightClock.formatToParts(timestamp).map(part=>[part.type,part.value]));
 const day=new Date(Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day)-(Number(parts.hour)<2?1:0)));
 return day.toISOString().slice(0,10);
}
