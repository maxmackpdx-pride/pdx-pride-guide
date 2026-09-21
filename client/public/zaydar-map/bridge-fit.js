import {bridgeNetwork,deckHeight} from '../home-flight/bridge-roads.js';

const latitudeScale=111320;
export function fitBridgeRoad(features,definition,elevation){
 const anchor=definition.center,longitudeScale=latitudeScale*Math.cos(anchor[1]*Math.PI/180);
 const project=p=>[(p[0]-anchor[0])*longitudeScale,-(p[1]-anchor[1])*latitudeScale];
 const rail=definition.id.startsWith('bnsf');
 const radius=definition.length+400;
 const eligible=features.filter(f=>{
  if(f.properties?.brunnel!=='bridge'||(rail?f.properties.class!=='rail':['rail','path'].includes(f.properties.class)))return false;
  const lines=f.geometry?.type==='LineString'?[f.geometry.coordinates]:f.geometry?.type==='MultiLineString'?f.geometry.coordinates:[];
  return lines.some(line=>{const points=line.map(project);return Math.min(...points.map(p=>p[0]))<=radius&&Math.max(...points.map(p=>p[0]))>=-radius&&Math.min(...points.map(p=>p[1]))<=radius&&Math.max(...points.map(p=>p[1]))>=-radius;});
 });
 // Rail and pedestrian crossings still need a connected centerline for their structures.
 const network=bridgeNetwork(eligible.map(f=>({geometry:f.geometry,properties:{...f.properties,class:rail?'service':f.properties.class==='path'?'minor':f.properties.class}})),project,elevation);
 let seed=null,best=Infinity;
 for(const edge of network.edges){const a=network.nodes[edge.a],b=network.nodes[edge.b],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,-(a.x*dx+a.y*dy)/(edge.length**2))),distance=Math.hypot(a.x+t*dx,a.y+t*dy);if(distance<best){best=distance;seed=edge;}}
 if(!seed||best>Math.min(180,Math.max(75,definition.length*.12)))return null;
 const used=new Set([seed]);
 function extend(start,previous){const result=[];let current=start,prior=previous,length=0;while(length<definition.length){const node=network.nodes[current],from=network.nodes[prior],dx=node.x-from.x,dy=node.y-from.y;const choices=node.edges.filter(e=>!used.has(e)).map(edge=>{const next=edge.a===current?edge.b:edge.a,p=network.nodes[next];return {edge,next,straight:(dx*(p.x-node.x)+dy*(p.y-node.y))/(Math.hypot(dx,dy)*edge.length)};}).filter(c=>c.straight>.7).sort((a,b)=>b.straight-a.straight);if(!choices.length)break;const {edge,next}=choices[0];used.add(edge);result.push({edge,node:next});length+=edge.length;prior=current;current=next;}return result;}
 const left=extend(seed.a,seed.b),right=extend(seed.b,seed.a);
 const ids=[...left.map(v=>v.node).reverse(),seed.a,seed.b,...right.map(v=>v.node)];
 const edges=[...left.map(v=>v.edge).reverse(),seed,...right.map(v=>v.edge)];
 let distance=0;const points=ids.map((id,i)=>{if(i)distance+=edges[i-1].length;const node=network.nodes[id];return {...node,distanceAlong:distance,width:edges[Math.min(i,edges.length-1)].width};});
 // Keep the full connected road profile; clamp the authored structure around the anchor.
 let closestAlong=0,closest=Infinity;
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),t=Math.max(0,Math.min(1,-(a.x*dx+a.y*dy)/(len*len))),d=Math.hypot(a.x+t*dx,a.y+t*dy);if(d<closest){closest=d;closestAlong=a.distanceAlong+t*len;}}
 const length=Math.min(definition.length,distance),start=Math.max(0,Math.min(distance-length,closestAlong-length/2));
 if(length<definition.length*.55)return null;
 return {points,length,start,anchor,longitudeScale,terrainAnchored:!!elevation,retainDeck:rail||eligible.every(f=>f.properties.class==='path'),signature:JSON.stringify(points.map(p=>[p.x,p.y,p.width,p.distance,p.baseline]))};
}

export function sampleBridgeRoad(fit,fraction){
 const d=fit.start+Math.max(0,Math.min(1,fraction))*fit.length,points=fit.points;
 let i=1;while(i<points.length-1&&points[i].distanceAlong<d)i++;
 const a=points[i-1],b=points[i],length=b.distanceAlong-a.distanceAlong,t=(d-a.distanceAlong)/length;
 const x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
 const distance=Math.min(a.distance+length*t,b.distance+length*(1-t));
 return {x,y,dx:(b.x-a.x)/length,dy:(b.y-a.y)/length,width:a.width+(b.width-a.width)*t,height:deckHeight(distance,true)+(a.baseline??0)*(1-t)+(b.baseline??0)*t,coordinate:[fit.anchor[0]+x/fit.longitudeScale,fit.anchor[1]-y/latitudeScale]};
}

// Only the ground-level rail strokes under a ready raised rail crossing are
// suppressed. The approach tracks and all non-bridge streets keep their style.
export function railBridgeFootprint(fit){
 const coordinates=fit.points.map(p=>[fit.anchor[0]+p.x/fit.longitudeScale,fit.anchor[1]-p.y/latitudeScale]);
 const west=Math.min(...coordinates.map(p=>p[0]))-8/fit.longitudeScale,east=Math.max(...coordinates.map(p=>p[0]))+8/fit.longitudeScale;
 const south=Math.min(...coordinates.map(p=>p[1]))-8/latitudeScale,north=Math.max(...coordinates.map(p=>p[1]))+8/latitudeScale;
 return {type:'Polygon',coordinates:[[[west,south],[east,south],[east,north],[west,north],[west,south]]]};
}
