import type {PlacePerson} from './PlacePeople';
export interface PublicTalentCredit {
  person:PlacePerson;
  venueId:number;
  eventId:string;
  eventTitle:string;
  startsAt:string;
  endsAt?:string;
  visibility:'public';
  sourceUrl:string;
}
export interface PlaceTalentData {venueId:number;checkedAt:string;status:'available'|'unavailable';credits:PublicTalentCredit[];message?:string;}
export function talentTiming(credit:PublicTalentCredit,now=Date.now()) {
  if(!/(Z|[+-]\d{2}:\d{2})$/.test(credit.startsAt))return 'unknown';
  const start=Date.parse(credit.startsAt);if(!Number.isFinite(start))return 'unknown';
  const end=credit.endsAt?Date.parse(credit.endsAt):NaN;
  if(credit.endsAt&&(!/(Z|[+-]\d{2}:\d{2})$/.test(credit.endsAt)||!Number.isFinite(end)||end<=start))return 'unknown';
  if(start>now)return 'upcoming';
  if(!Number.isFinite(end))return 'unknown';
  return now<end?'now':'past';
}
export function talentGroups(data:PlaceTalentData|undefined,venueId:number,now=Date.now()) {
  const checked=Date.parse(data?.checkedAt||'');
  const available=Boolean(data&&data.venueId===venueId&&data.status==='available'&&checked<=now&&now-checked<=86400000);
  const active:PublicTalentCredit[]=[],past:PublicTalentCredit[]=[];
  if(available)for(const credit of data!.credits){
    if(credit.venueId!==venueId||credit.visibility!=='public'||!credit.person.id||!credit.person.name||!/^https:\/\//.test(credit.sourceUrl))continue;
    const when=talentTiming(credit,now);if(when==='now'||when==='upcoming')active.push(credit);else if(when==='past')past.push(credit);
  }
  active.sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt));past.sort((a,b)=>Date.parse(b.endsAt!)-Date.parse(a.endsAt!));
  const unique=(list:PublicTalentCredit[])=>list.filter((c,i)=>list.findIndex(x=>x.person.id===c.person.id)===i);
  return {available,active:unique(active),past:unique(past)};
}
