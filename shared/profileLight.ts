export const PROFILE_LIGHT_PALETTES={progress:['#ffffff','#f5a9b8','#5bcefa','#784f17','#222222','#ff5959','#ffae4b','#ffee75','#42d6a1','#4a9dff','#cf73ff'],pride:['#ff5959','#ffae4b','#ffee75','#42d6a1','#4a9dff','#cf73ff'],trans:['#5bcefa','#f5a9b8','#ffffff','#f5a9b8'],bi:['#d60270','#9b4f96','#0038a8'],cyan:['#a4ffe0','#57dcff','#3792ff'],aurora:['#b174ff','#65f3df','#71ffa1'],ember:['#ff687d','#ffad58','#fff0a1']};
export function profileNodePhase(id:string){let h=0;for(const c of id)h=(h*31+c.charCodeAt(0))>>>0;return (h%997)/997;}
export function profileLightColor(palette:string,phase:number){const colors=palette.startsWith('#')?[palette]:PROFILE_LIGHT_PALETTES[palette as keyof typeof PROFILE_LIGHT_PALETTES]||PROFILE_LIGHT_PALETTES.pride;const p=((phase%1)+1)%1*colors.length,index=Math.floor(p),t=p-index,a=colors[index],b=colors[(index+1)%colors.length];return `rgb(${[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t)).join(', ')})`;}
/** Stable identity branches, independent of placement: dragging can make them cross or run backward. */
export function profileLightEdges(nodes:Array<{id:string;anchor:boolean}>):Array<[string,string]>{
 const anchors=nodes.filter(n=>n.anchor).map(n=>n.id).sort(),trail=nodes.filter(n=>!n.anchor).map(n=>n.id);const edges:Array<[string,string]>=[];
 if(anchors.length)edges.push(['portrait',anchors.includes('ProfileAbout')?'ProfileAbout':anchors[0]]);
 for(let i=1;i<anchors.length;i++){const parent=anchors.slice(0,i).sort((a,b)=>profileNodePhase(`${anchors[i]}:${b}`)-profileNodePhase(`${anchors[i]}:${a}`))[0];edges.push([parent,anchors[i]]);}
 for(let i=0;i<trail.length;i++){if(i)edges.push([trail[i-1],trail[i]]);if(anchors.length&&(i===0||profileNodePhase(trail[i])>.6)){const anchor=[...anchors].sort((a,b)=>profileNodePhase(`${trail[i]}:${b}`)-profileNodePhase(`${trail[i]}:${a}`))[0];edges.push([anchor,trail[i]]);}}
 return edges;
}

export type RibbonPoint={x:number;y:number};
/** Project a continuously rotating sheet. Time changes the geometry, not only its color. */
export function ribbonGeometry(a:RibbonPoint,b:RibbonPoint,time:number,phase=0){
 const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length,half=Math.min(7,length*.035),front:string[]=[],back:string[]=[];
 for(let i=0;i<=40;i++){const t=i/40;const width=half*Math.sin(Math.PI*t)*Math.cos(Math.PI*t+time*.8+phase),bow=Math.sin(Math.PI*t)*Math.min(10,length*.02),x=a.x+dx*t+nx*bow,y=a.y+dy*t+ny*bow;front.push(`${(x+nx*width).toFixed(2)},${(y+ny*width).toFixed(2)}`);back.push(`${(x-nx*width).toFixed(2)},${(y-ny*width).toFixed(2)}`);}
 return `M${front.join(' L')} L${back.reverse().join(' L')} Z`;
}
/** The luminous core follows the same sheet center, including its gentle bow. */
export function ribbonCenterline(a:RibbonPoint,b:RibbonPoint){const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1;return 'M'+Array.from({length:41},(_,i)=>{const t=i/40,bow=Math.sin(Math.PI*t)*Math.min(10,length*.02);return `${(a.x+dx*t-dy/length*bow).toFixed(2)},${(a.y+dy*t+dx/length*bow).toFixed(2)}`;}).join(' L');}
