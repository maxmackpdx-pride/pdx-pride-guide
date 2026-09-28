// Source: Tucker's ten Hawks screenshots supplied 2026-09-28.
// Supplied Thursday schedule takes precedence over the older public calendar.
// Date-only starts preserve unknown event times without inventing midnight starts.
import { withHawksLockerSpecial } from './hawksLockerSpecial';
export const HAWKS_SOURCE = 'https://hawkspdx.com/';
export function hawksThroughApril2027() {
 const events: Array<{title:string;dateStart:string;dateEnd:string;dayOfWeek:string;description:string;admission:string}> = [];
 const date=(d:Date)=>d.toISOString().slice(0,10);
 for(let d=new Date('2026-09-28T12:00:00Z');date(d)<='2027-04-30';d=new Date(d.getTime()+86400000)) {
  const day=date(d),w=d.getUTCDay(),nth=Math.floor((d.getUTCDate()-1)/7)+1;
  const add=(title:string,start:string,end:string,description:string,free=false)=>events.push({title,dateStart:day+(start?`T${start}`:''),dateEnd:end?`${date(new Date(d.getTime()+(end<=start?86400000:0)))}T${end}`:'',dayOfWeek:['SUN','MON','TUE','WED','THU','FRI','SAT'][w],admission:free?'FREE':'DOOR_FEE',description:description+(start?'':' Event time unconfirmed; contact Hawks before attending.')+(free?' Free testing; confirm clinic access requirements with Hawks.':' Hawks is a private members-only venue. Ages 18+; valid ID and active membership required. Room or locker charges apply.')});
  if(w===2||w===3) add('Midweek Hump','','','Tuesday and Wednesday membership special: double long-term memberships for the same price.');
  if(w===1) add('Bear Mondays','','','Monday male-only night for bears, cubs, otters, chubs and admirers.');
  if(w===2) {
   add('EveryBody Tuesdays','','','All genders and expressions welcome. Courtyard Naked Yin Yoga starts at 7 p.m.; free confidential STI testing runs 5–8 p.m.');
   add('Tuesday Community Health Clinic','17:00','20:00','Free, confidential STI testing, Tuesdays 5–8 p.m.',true);
  }
  if(w===3) {
   add('Sexy Senior Social','10:00','16:00','Wednesday social for guests 65 and older, 10 a.m.–4 p.m.');
   add('OMEN Wednesdays! (M4M)','','','Wednesday evening male-only gathering with Oregon Men Enjoying Naturism, focused on naturism and community.');
  }
  if(w===4) add('Thursdays Men4Men / Karaoke','10:00','02:00','Men4Men 10 a.m.–4 p.m. for people who identify as more masculine. All genders and expressions welcome 4 p.m.–2 a.m. Karaoke on the south patio 7–11 p.m.');
  if(w===5) add('GENDER GLOW Fridays!','','','Friday LGBTQIA2S+ mixer with karaoke, blacklight and glow sticks. Queer and questioning guests welcome.');
  if(w===6) {
   if(nth===1) add('TranSocial','','','First Saturday: day and night gathering centering trans-identified guests and their friends.');
   if(nth===2||nth===4) add('Saturday Bears and Cubs','','','Second and fourth Saturdays: M4M gathering for bears, cubs and admirers.');
   if(nth===3) add('TransMasc Social','','','Third Saturday: a gathering celebrating trans masculine identity and community.');
   if(nth===5) add('5th Saturday Puppy Pileup','','','Fifth Saturday: all-gender gathering for pups, handlers and people curious about pup play.');
  }
  if(w===0) add('Bi Sundays & Nude Yoga','','','Sunday gathering for bisexual, pansexual and gender-expansive community. Includes courtyard nude yoga; yoga time unconfirmed.');
 }
 return events.map(event => ({ ...event, description: withHawksLockerSpecial(event.description) }));
}
