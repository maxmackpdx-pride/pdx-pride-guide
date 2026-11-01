/** Executable profile object contracts. Variants are compositions, never scaled copies. */
export const PROFILE_OBJECT_VERSION = 1;
const object = (name: string, label: string, variants: Record<string, {width:number;height:number}>, anchor=true, privateOnly=false) => ({id:`component:${name==='ProfileWall'||name==='ProfileHologram'||name==='ProfileLightRibbon'?'layout':'data-display'}/${name}`,name,label,version:1,variants,anchor,privateOnly});
export const PROFILE_OBJECTS = [
 object('ProfileIdentity','Identity',{standard:{width:620,height:280},compact:{width:330,height:240}}),
 object('ProfileAbout','About',{standard:{width:310,height:300},compact:{width:164,height:250}}),
 object('ProfileTop8','Top 8',{standard:{width:440,height:720},compact:{width:330,height:820}}),
 object('ProfileUpcomingPosters','Upcoming',{standard:{width:620,height:460},compact:{width:330,height:330}}),
 object('ProfileFeaturedEvent','Featured event',{standard:{width:310,height:460},compact:{width:190,height:290}},false),
 object('ProfileHosting','Hosting',{standard:{width:440,height:350},compact:{width:330,height:300}}),
 object('ProfileStash','The Stash',{standard:{width:440,height:390},compact:{width:164,height:270}}),
 object('ProfileFavoritePlaces','Favorite places',{standard:{width:440,height:350},compact:{width:164,height:270}},true,true),
 object('ProfileOutzCollection','Outz adventures',{standard:{width:490,height:350},compact:{width:330,height:300}},true,true),
 object('ProfileConnections','My corners',{standard:{width:440,height:350},compact:{width:164,height:280}}),
 object('ProfileUpdate','Updates',{standard:{width:310,height:300},compact:{width:240,height:250}},false),
 object('ProfileSoundCloud','SoundCloud',{standard:{width:440,height:300},compact:{width:330,height:166}}),
 object('ProfileSocialLinks','Social links',{standard:{width:310,height:160},compact:{width:164,height:180}}),
 object('ProfileMarquee','Marquee',{standard:{width:620,height:100},compact:{width:330,height:100}}),
 object('ProfilePhotos','Photos',{standard:{width:440,height:350},compact:{width:240,height:260}}),
 object('ProfileMedia','Media',{standard:{width:440,height:350},compact:{width:330,height:300}}),
 object('ProfilePack','My pack',{standard:{width:440,height:320},compact:{width:240,height:260}}),
 object('ProfileActivity','Activity',{'board-large':{width:360,height:360},'board-small':{width:136,height:180},'event-poster':{width:310,height:460},'event-pocket':{width:190,height:290},'outz-wide':{width:550,height:324},'outz-compressed':{width:330,height:200}},false),
] as const;
export function profileObject(id:string){return PROFILE_OBJECTS.find(item=>item.id===id);}
export type ProfileObjectDefinition = typeof PROFILE_OBJECTS[number];
