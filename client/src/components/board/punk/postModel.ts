import {intentLabels,type BoardPost} from '@/lib/allBoards';
import {boardPaperChoice} from '@shared/boardCardPresentation';

/** One adapter for form previews, browse faces and open-card heroes. Never supplies demo people or photos. */
export function toPunkPost(post:BoardPost&{kicker?:string;logo?:string}){
 const housing=post.housing;
 const household=housing?.household.filter(p=>p.kind!=='PET')||[];
 const author=housing?.author;
 const others=household.filter(p=>!(p.kind==='MEMBER'&&p.userId===author?.userId)&&p.role!=='LEAD');
 const filled=housing?1+others.length:Math.max(0,post.householdCount||0);
 const open=Math.max(0,housing?.openSlots??post.openSlots??0);
 const money=String(post.value||'').trim().replace(/\s*(?:budget|\/\s*mo(?:nth)?|(?:a|per) month|monthly)\s*$/i,'').replace(/^\$\s*/,'');
 return {...post,kind:'board',kicker:(post.kicker||intentLabels[post.intent]).toUpperCase(),logo:post.logo||(post.category==='housing'?'my-houz.svg':post.category==='mizzed'?'mizzed-connection.svg':`${post.category}.svg`),
   detail:post.area,description:post.category==='gigz'?post.detail||post.description:post.description||post.detail,
   value:post.category==='mizzed'?'':/^\d/.test(post.value)&&post.category==='gigz'?'$'+post.value:post.value,
   photos:post.category==='mizzed'?[]:post.photos?.length?post.photos:post.photo?[post.photo]:[],
   collageChoice:boardPaperChoice(post.motifChoice),
   amount:money,priceSuffix:post.intent==='forming'?'BUDGET':'/MO',
   author, members:[{name:author?.displayName||'Poster',photo:author?.photoUrl},...others.map(p=>({name:p.name,photo:p.photoUrl}))],
   lookingPeople:Math.min(2,1+others.length),
   peopleIn:filled,openRooms:open,capacity:Math.max(1,filled+open),
 };
}
