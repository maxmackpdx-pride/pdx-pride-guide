const hashKey=key=>{let hash=2166136261;for(const c of key)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;return hash;};
export const REFLECTION_COLORS=['#69bfc8','#a18dcb','#bd82a5'];

// Broken ribbons are anchored in meters around their light source. Animation
// changes only intensity, so neither zoom nor shimmer moves the reflection.
export function waterReflectionSegments(coordinate){
  const [lng,lat]=coordinate,seed=hashKey(`${lng.toFixed(5)},${lat.toFixed(5)}`);
  const latitudeMeter=1/111320,longitudeMeter=latitudeMeter/Math.cos(lat*Math.PI/180);
  return Array.from({length:6},(_,i)=>{
    const bit=hashKey(`${seed}:${i}`),distance=16+i*8+(bit%4),offset=((bit>>>4)%7)-3;
    const halfWidth=2+((bit>>>8)%5);
    return {a:[lng+(offset-halfWidth)*longitudeMeter,lat-distance*latitudeMeter],
      b:[lng+(offset+halfWidth)*longitudeMeter,lat-distance*latitudeMeter],group:(seed%3)*3+i%3};
  });
}

// Cached wall paths replace the old full-screen moving sheen. Face direction
// supplies a cheap chrome highlight; it requires no blur or reflected scene.
export function createBuildingChrome(){
  const cache=new WeakMap();
  return {
    draw(ctx,map,buildings,fade){
      if(!buildings.length||fade<=0)return;
      const center=map.getCenter(),zoom=map.getZoom(),pitch=map.getPitch(),bearing=map.getBearing();
      const key=[center.lng,center.lat,zoom,pitch,bearing,ctx.canvas.width,ctx.canvas.height].join(':');
      let cached=cache.get(map);
      if(!cached||cached.key!==key||cached.buildings!==buildings){
        const groups=Array.from({length:16},()=>({wall:new Path2D(),glint:new Path2D()}));
        const zoomScale=512*Math.pow(2,zoom)/40075016.686,tilt=Math.sin(pitch*Math.PI/180);
        const polygon=(path,points)=>{points.forEach((p,i)=>i?path.lineTo(p.x,p.y):path.moveTo(p.x,p.y));path.closePath();};
        for(const building of buildings){
          const latitudeScale=Math.cos(building.center[1]*Math.PI/180),lift=building.height*zoomScale/latitudeScale*tilt;
          if(lift<2)continue;
          const footprint=building.ring.map(p=>map.project(p));
          const winding=footprint.reduce((sum,a,i)=>{const b=footprint[(i+1)%footprint.length];return sum+a.x*b.y-b.x*a.y;},0);
          for(let i=0;i<footprint.length;i++){
            const a=footprint[i],b=footprint[(i+1)%footprint.length];
            if((b.x-a.x)*winding>=0||Math.hypot(b.x-a.x,b.y-a.y)<2)continue;
            const worldA=building.ring[i],worldB=building.ring[(i+1)%building.ring.length];
            const normal=Math.atan2((worldB[0]-worldA[0])*latitudeScale,worldB[1]-worldA[1])+(winding>0?Math.PI:0);
            const index=(Math.round(normal*8/Math.PI)+32)%16,group=groups[index];
            polygon(group.wall,[{x:a.x,y:a.y-lift},{x:b.x,y:b.y-lift},b,a]);
            // A narrow material glint stays inside the wall, away from the roof.
            const inner={x:a.x+(b.x-a.x)*.075,y:a.y+(b.y-a.y)*.075};
            polygon(group.glint,[{x:a.x,y:a.y-lift*.93},{x:inner.x,y:inner.y-lift*.93},
              {x:inner.x,y:inner.y-lift*.08},{x:a.x,y:a.y-lift*.08}]);
          }
        }
        cached={key,buildings,groups};cache.set(map,cached);
      }
      ctx.save();ctx.globalCompositeOperation='screen';
      const view=bearing*Math.PI/180;
      cached.groups.forEach((group,i)=>{
        const facing=i*Math.PI/8-view,blue=(Math.sin(facing+.65)+1)/2;
        const specular=Math.pow(Math.max(0,Math.cos(facing-1.2)),10);
        const r=Math.round(112-39*blue),g=Math.round(96+36*blue),b=Math.round(166+16*blue);
        ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.globalAlpha=fade*(.035+.085*specular);ctx.fill(group.wall);
        ctx.fillStyle='#acc4de';ctx.globalAlpha=fade*.10*specular;ctx.fill(group.glint);
      });
      ctx.restore();
    },
  };
}
