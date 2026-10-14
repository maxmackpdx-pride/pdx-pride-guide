const zone = 'America/Los_Angeles';
const formatter = new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'});
/** Midnight of a Pacific calendar day, including daylight-saving boundaries. */
export function pacificDayStart(now:Date,daysAgo=0):Date {
 const parts=Object.fromEntries(formatter.formatToParts(now).map(p=>[p.type,p.value]));
 const calendar=new Date(Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day)-daysAgo));
 const key=calendar.toISOString().slice(0,10);
 // Pacific midnight is UTC 07:00 or 08:00; verify the actual zone offset at each candidate.
 const hours=new Intl.DateTimeFormat('en-US',{timeZone:zone,hour:'2-digit',hourCycle:'h23'});
 for(const offset of [7,8]){const candidate=new Date(`${key}T0${offset}:00:00.000Z`);if(hours.format(candidate)==='00')return candidate;}
 throw Error('Could not resolve reporting day');
}
