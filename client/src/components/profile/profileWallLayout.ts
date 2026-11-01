import {profileObject} from '@shared/profileObjects';
import type {ProfileLayout,ProfileWidget} from '@shared/profileLayout';
export type WallRect={id:string;x:number;y:number;width:number;height:number;rotation:number;z:number;pinned:boolean;widget:ProfileWidget};
export type WallMeasurements=Partial<Record<'desktop'|'mobile',Record<string,number>>>;
export function composeProfileWall(layout:ProfileLayout,mobile:boolean,width:number,heights:Record<string,number>={}):WallRect[]{
 const view=mobile?'mobile':'desktop';const rects:WallRect[]= layout.widgets.filter(w=>w.enabled).flatMap(widget=>{const object=profileObject(widget.objectId),p=widget[view];const size=object?.variants[p.variant as keyof typeof object.variants] as {width:number;height:number}|undefined;if(!size)return [];
  const w=Math.min(size.width,Math.max(136,width-16));return [{id:widget.id,x:Math.max(8,Math.min(width-w-8,mobile?p.x/360*Math.max(0,width-16):p.x)),y:p.y,width:w,height:heights[widget.id]||size.height,rotation:p.rotation,z:p.z,pinned:p.pinned,widget}];});
 return rects;
}
export function rectanglesOverlap(a:Pick<WallRect,'x'|'y'|'width'|'height'>,b:Pick<WallRect,'x'|'y'|'width'|'height'>,gap=18){return a.x<b.x+b.width+gap&&a.x+a.width+gap>b.x&&a.y<b.y+b.height+gap&&a.y+a.height+gap>b.y;}
/** Reading changes derived coordinates only; persistent anchor positions never change. */
export function expandProfileWall(rects:WallRect[],id:string,height:number,width?:number){
 const origin=rects.find(r=>r.id===id);if(!origin)return {rects,inline:true};const opening={...origin,width:width??origin.width,height:Math.max(origin.height,height)};
 if(rects.some(r=>r.id!==id&&r.pinned&&rectanglesOverlap(opening,r)))return {rects,inline:false};
 const obstacles=[opening];const moved=new Map<string,WallRect>([[id,opening]]);
 for(const r of [...rects].sort((a,b)=>a.y-b.y)){
  if(r.id===id||r.pinned||r.y<origin.y)continue;let next={...r};for(const obstacle of obstacles)if(rectanglesOverlap(next,obstacle))next.y=obstacle.y+obstacle.height+28;
  // Do not push a paper onto a protected hologram farther down the wall.
  let count=0;while(count++<rects.length){const anchor=rects.find(a=>a.pinned&&a.id!==id&&rectanglesOverlap(next,a));if(!anchor)break;next.y=anchor.y+anchor.height+28;}
  if(next.y!==r.y){moved.set(r.id,next);obstacles.push(next);}
 }
 return {rects:rects.map(r=>moved.get(r.id)||r),inline:true};
}
export function updateWallPlacement(layout:ProfileLayout,id:string,mobile:boolean,patch:Partial<ProfileWidget['desktop']>):ProfileLayout{return {...layout,widgets:layout.widgets.map(w=>w.id===id?{...w,[mobile?'mobile':'desktop']:{...w[mobile?'mobile':'desktop'],...patch}}:w)};}
/** A variant resize reflows movable neighbors and remains a single undo transaction. */
export function resizeWallWidget(layout:ProfileLayout,id:string,mobile:boolean,variant:string,width:number):ProfileLayout{
 let next=updateWallPlacement(layout,id,mobile,{variant});const rects=composeProfileWall(next,mobile,width),active=rects.find(r=>r.id===id);if(!active)return layout;
 const result=expandProfileWall(rects,id,active.height);
 if(!result.inline)return layout;
 for(const r of result.rects){const before=rects.find(row=>row.id===r.id)!;if(r.y!==before.y)next=updateWallPlacement(next,r.id,mobile,{y:r.y});}return next;
}
/** Give newly projected trail entries an initial slot. Saved/manual overlaps are untouched. */
export function placeNewProfileActivities(layout:ProfileLayout,ids:Set<string>,measurements:WallMeasurements={}):ProfileLayout{
 let next=layout;for(const mobile of [false,true]){const rects=composeProfileWall(next,mobile,mobile?390:1160,measurements[mobile?'mobile':'desktop']),placed=rects.filter(r=>!ids.has(r.id));for(const r of rects.filter(r=>ids.has(r.id))){let count=0;while(count++<rects.length*2){const hit=placed.find(other=>rectanglesOverlap(r,other,4));if(!hit)break;r.y=hit.y+hit.height+24;}placed.push(r);next=updateWallPlacement(next,r.id,mobile,{y:r.y});}}return next;
}
/** Collapse absent-widget reservations only before an owner has saved an arrangement. */
export function compactDefaultProfileLayout(layout:ProfileLayout,measurements:WallMeasurements={}):ProfileLayout{
 if(layout.revision!==0)return layout;
 let next=layout;for(const mobile of [false,true]){const rects=composeProfileWall(next,mobile,mobile?390:1160,measurements[mobile?'mobile':'desktop']),placed:WallRect[]=[];
  for(const r of [...rects].filter(r=>r.pinned).sort((a,b)=>a.y-b.y)){const overlaps=placed.filter(p=>r.x<p.x+p.width+8&&r.x+r.width+8>p.x);const y=overlaps.length?Math.max(...overlaps.map(p=>p.y+p.height))+48:Math.min(r.y,mobile?150:120);const position={...r,y};placed.push(position);next=updateWallPlacement(next,r.id,mobile,{y});}
  for(const paper of rects.filter(r=>!r.pinned&&r.widget.source.kind==='profile').sort((a,b)=>a.y-b.y)){const before=placed.filter(p=>p.x<paper.x+paper.width&&p.x+p.width>paper.x);const y=Math.max(mobile?340:360,...before.map(p=>p.y+p.height+52));placed.push({...paper,y});next=updateWallPlacement(next,paper.id,mobile,{y});}
 }
 return next;
}
