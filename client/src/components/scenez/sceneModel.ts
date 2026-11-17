import {resolveDirectoryLogo} from '@shared/directoryLogos';
import type {CommunitySummary,CommunityDetail} from '@shared/community';
export const sceneTypes=[['club','Clubs','#FFD700'],['party-collective','Party Collectives','#FF7B00'],['organization','Organizations','#ffffff']] as const;
export function sceneCategory(c:CommunitySummary){return (c as CommunitySummary & {sceneCategory?:string}).sceneCategory||null;}
export function sceneModel(c:CommunitySummary,detail?:CommunityDetail){
 const key=sceneCategory(c);const known:Record<string,Partial<Record<'id'|'wordmark'|'customArt'|'logo'|'color'|'image'|'imageAlt'|'imageLabel'|'artLayout',string>>>={
 'portland-gay-men-s-chorus':{image:'/scenez-native/pgmc/representative-piano.png',logo:'/scenez-native/pgmc/white-logo.svg',imageAlt:'Illustrative close-up of piano keys, not a documented PGMC instrument.',imageLabel:'Illustrative music image',artLayout:'pgmc'},
 // Q Center's community image is a legacy brand graphic; keep its data intact
 // while the separate logo slot uses the reviewed directory SVG.
 'q-center':{logo:resolveDirectoryLogo('Q Center')!},
 'lesbian-culture-club':{id:'club',wordmark:'LESBIAN\nCULTURE\nCLUB'},
 'pride-northwest':{id:'org',customArt:'/scenez-native/pride-collage.png',logo:'/scenez-native/pride.png'},
 'bearracuda':{id:'party',customArt:'/scenez-native/party-collage.png',wordmark:'BEARRACUDA',color:'#ff7800'},
 'pink-ponies':{id:'pink-ponies',logo:'/scenez-native/pink-ponies.png',color:'#f15aa9'},
 'yes-coach-productions':{id:'yes-coach',customArt:'/scenez-native/party-collage.png',logo:'/scenez-native/yes-coach.png',color:'#e62026'},
 'yes-coach':{id:'yes-coach',customArt:'/scenez-native/party-collage.png',logo:'/scenez-native/yes-coach.png',color:'#e62026'},
 };
 return {id:c.slug,name:c.name,kind:key==='party-collective'?'Party Collective':key==='organization'?'Organization':key==='club'?'Club':'Scene',page:'scenez',color:sceneTypes.find(t=>t[0]===key)?.[2]||'#FFD700',wordmark:c.name.toUpperCase(),logo:c.imageUrl||resolveDirectoryLogo(c.name)||undefined,short:c.neighborhood||'Community & connection',...known[c.slug],events:detail?.events.upcoming||(c.nextEvent?[c.nextEvent]:[])};
}
