import type {ProfileSource} from '@shared/profileLayout';
import type {PosterEvent} from './ProfilePosters';
import {ProfilePoster} from './ProfilePosters';
import {ProfileActivityFrame} from './ProfileObjects';
import ProfileBoardObject from './ProfileBoardObject';
import OutzWideCard,{type OutzDestinationCardData} from '@/components/outz/OutzWideCard';
export type ProfileActivityProps={source:ProfileSource;variant:string;event?:PosterEvent;place?:OutzDestinationCardData;date?:string;open?:boolean;inline?:boolean;onOpen:()=>void;onClose:()=>void;onRequireAuth:()=>void;onSelect:(key:string)=>void;onEvent:(id:number)=>void;onOutz:(id:string)=>void};
/** One source-aware renderer shared by the wall, specimens and portable package. */
export function ProfileActivity(p:ProfileActivityProps){
 if(p.source.kind==='board')return <ProfileBoardObject category={p.source.category} id={p.source.id} small={p.variant==='board-small'} open={!!p.open} inline={p.inline!==false} onOpen={p.onOpen} onClose={p.onClose} onRequireAuth={p.onRequireAuth} onSelect={p.onSelect}/>;
 if(p.source.kind==='event')return p.event?<ProfilePoster event={p.event} onOpen={p.onEvent}/>:<p>This event is unavailable.</p>;
 if(p.source.kind==='trip')return p.place?<ProfileActivityFrame label="Check-in plan" date={p.date}><OutzWideCard place={p.place} variant={p.variant==='outz-compressed'?'compressed':'wide'} onOpen={()=>p.onOutz(p.place!.id)}/></ProfileActivityFrame>:<p>This destination is unavailable.</p>;
 return null;
}
