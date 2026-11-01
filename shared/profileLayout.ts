import {z} from 'zod';
import {PROFILE_OBJECTS,profileObject} from './profileObjects';
const placement=z.object({variant:z.string().max(30),x:z.number().finite().min(0).max(1160),y:z.number().finite().min(0).max(100000),rotation:z.number().finite().min(-8).max(8),z:z.number().int().min(0).max(100),pinned:z.boolean()}).strict();
export const profileSourceSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('profile')}).strict(),
 z.object({kind:z.literal('event'),id:z.number().int().positive()}).strict(),
 z.object({kind:z.literal('board'),category:z.enum(['housing','gigz','giftz','sellz']),id:z.number().int().positive()}).strict(),
 z.object({kind:z.literal('trip'),id:z.number().int().positive()}).strict(),
]);
export const profileLayoutSchema=z.object({schemaVersion:z.literal(1),revision:z.number().int().min(0),widgets:z.array(z.object({id:z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),objectId:z.string().max(100),version:z.literal(1),source:profileSourceSchema,enabled:z.boolean(),desktop:placement,mobile:placement}).strict()).max(60),motion:z.enum(['system','calm']),palette:z.union([z.enum(['progress','pride','trans','bi','cyan','aurora','ember']),z.string().regex(/^#[0-9a-fA-F]{6}$/)])}).strict().superRefine((doc,ctx)=>{
 const ids=new Set<string>();for(const [i,w] of doc.widgets.entries()){
  const item=profileObject(w.objectId);if(!item)ctx.addIssue({code:'custom',path:['widgets',i,'objectId'],message:'Unsupported object'});
  if(ids.has(w.id))ctx.addIssue({code:'custom',path:['widgets',i,'id'],message:'Duplicate widget'});ids.add(w.id);
  for(const view of ['desktop','mobile'] as const){if(!item?.variants[w[view].variant as keyof typeof item.variants])ctx.addIssue({code:'custom',path:['widgets',i,view,'variant'],message:'Unsupported variant'});if(view==='mobile'&&w[view].x>360)ctx.addIssue({code:'custom',path:['widgets',i,view,'x'],message:'Mobile position out of bounds'});}
  if(w.objectId==='component:data-display/ProfileActivity'){
   const prefix=w.source.kind==='board'?'board-':w.source.kind==='event'?'event-':w.source.kind==='trip'?'outz-':null;
   if(!prefix||![w.desktop.variant,w.mobile.variant].every(v=>v.startsWith(prefix)))ctx.addIssue({code:'custom',path:['widgets',i,'source'],message:'Variant must match its source object'});
  }
  if(w.objectId!=='component:data-display/ProfileActivity'&&w.source.kind!=='profile')ctx.addIssue({code:'custom',path:['widgets',i,'source'],message:'Collection widgets resolve their owner profile'});
 }
});
export type ProfileLayout = z.infer<typeof profileLayoutSchema>;
export type ProfileWidget = ProfileLayout['widgets'][number];
export type ProfileSource = ProfileWidget['source'];
export function defaultProfileLayout():ProfileLayout {
 const defaults=[['ProfileAbout',20,30],['ProfileTop8',30,510],['ProfileUpcomingPosters',500,30],['ProfileFeaturedEvent',40,2520],['ProfileOutzCollection',640,1010],['ProfileHosting',680,1430],['ProfileStash',660,1860],['ProfileConnections',680,2300],['ProfileFavoritePlaces',640,2730],['ProfileUpdate',80,3000]] as const;
 const mobilePositions=[[0,40],[8,1030],[20,550],[30,3200],[15,1950],[0,2350],[190,150],[180,2750],[5,2790],[110,3650]];
 return {schemaVersion:1,revision:0,motion:'system',palette:'pride',widgets:defaults.map(([name,x,y],i)=>{const item=PROFILE_OBJECTS.find(o=>o.name===name)!;return {id:name,objectId:item.id,version:1,source:{kind:'profile'},enabled:true,desktop:{variant:'standard',x,y,rotation:0,z:3,pinned:item.anchor},mobile:{variant:'compact',x:mobilePositions[i][0],y:mobilePositions[i][1],rotation:i%2?1:-1,z:3,pinned:item.anchor}};})};
}
/** Visitor layout contains no private source IDs, even for invisible widgets. */
export function publicProfileLayout(layout:ProfileLayout,canRead:(ref:ProfileSource)=>boolean):ProfileLayout{return {...layout,widgets:layout.widgets.filter(w=>!profileObject(w.objectId)?.privateOnly&&canRead(w.source))};}
