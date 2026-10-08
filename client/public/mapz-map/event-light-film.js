// Clean optical interference, generated once on first use. No captured map,
// logo or marker pixels; no image downloads, decoder, GPU context or timer.
export const LIGHT_WIDTH=64,LIGHT_HEIGHT=256;
const TAU=Math.PI*2;
export function lightTick(seconds,variant=0,reduced=false){
  return reduced?0:((Math.floor((seconds+variant*.67)*24)%168)+168)%168;
}
export function lightPalette(color){
  const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255);
  const max=Math.max(...rgb),min=Math.min(...rgb),delta=max-min,l=(max+min)/2;
  const s=delta?delta/(1-Math.abs(2*l-1)):0;
  let hue=delta?(max===rgb[0]?(rgb[1]-rgb[2])/delta:max===rgb[1]?(rgb[2]-rgb[0])/delta+2:(rgb[0]-rgb[1])/delta+4)*60:0;
  hue=(hue+360)%360;
  const tint=offset=>`hsl(${(hue+offset+360)%360} ${s*100}% ${l*100}%)`;
  // The assigned token remains the center and dominant color; fine spectral
  // fringes carry nearby hues rather than painting the whole beam another day.
  return [tint(-24),color,tint(24)];
}
export function createLightFilm(){
  const bases=new Map(),films=new Map();
  function base(variant){
    if(bases.has(variant))return bases.get(variant);
    let seed=1271+variant*7919;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const canvas=document.createElement('canvas');canvas.width=LIGHT_WIDTH;canvas.height=LIGHT_HEIGHT;
    const g=canvas.getContext('2d'),image=g.createImageData(LIGHT_WIDTH,LIGHT_HEIGHT);
    for(let y=0;y<LIGHT_HEIGHT;y++)for(let x=0;x<LIGHT_WIDTH;x++){
      const u=x/(LIGHT_WIDTH-1)*2-1,v=y/(LIGHT_HEIGHT-1),i=(y*LIGHT_WIDTH+x)*4;
      // Diffuse film + very faint fixed grain. Never moving square particles.
      image.data[i]=image.data[i+1]=image.data[i+2]=255;
      image.data[i+3]=(10+24*Math.exp(-((u-.12)**2)*4)+50*v**4+(random()-.5)*4)*(1-Math.abs(u)**6);
    }
    g.putImageData(image,0,0);g.strokeStyle='#fff';g.lineWidth=.45;
    for(let i=0;i<72;i++){
      const x=random()*LIGHT_WIDTH,y=random()*LIGHT_HEIGHT,length=3+random()*31;
      g.globalAlpha=.08+random()*.24;g.beginPath();g.moveTo(x,y);
      g.lineTo(x+(random()-.5)*1.3,Math.min(LIGHT_HEIGHT,y+length));g.stroke();
    }
    // Disconnected, irregular interference fragments, without rings or a grid.
    for(let i=0;i<25;i++){
      const x=random()*LIGHT_WIDTH,y=random()*LIGHT_HEIGHT;
      g.globalAlpha=.025+random()*.05;g.beginPath();g.moveTo(x,y);g.lineTo(x+4+random()*20,y+.3);g.stroke();
    }
    bases.set(variant,canvas);return canvas;
  }
  return {
    get(color,variant,seconds,reduced){
      const tick=lightTick(seconds,variant,reduced),key=color+variant;
      let entry=films.get(key);
      if(!entry){
        const canvas=document.createElement('canvas');canvas.width=LIGHT_WIDTH;canvas.height=LIGHT_HEIGHT;
        const g=canvas.getContext('2d'),[cool,primary,warm]=lightPalette(color);
        const tint=g.createLinearGradient(0,0,LIGHT_WIDTH,0);
        for(const [q,c] of [[0,cool],[.3,primary],[.67,primary],[1,warm]])tint.addColorStop(q,c);
        entry={canvas,tint,tick:-1};films.set(key,entry);
      }
      if(entry.tick===tick)return entry.canvas;
      entry.tick=tick;
      const g=entry.canvas.getContext('2d'),angle=tick/168*TAU;
      g.globalAlpha=1;g.globalCompositeOperation='copy';g.drawImage(base(variant),0,0);
      g.globalCompositeOperation='lighter';
      // Periodic, uneven brightness inside the light layers. Position and slope
      // match at both ends of the seven-second loop, including Calm Mode.
      for(let i=0;i<3;i++){
        const x=LIGHT_WIDTH*(.5+.2*Math.sin(angle+i*2.3)),y=LIGHT_HEIGHT*(.2+i*.29)+Math.sin(angle+i)*11;
        const glow=g.createRadialGradient(x,y,0,x,y,42);
        glow.addColorStop(0,'#ffffff14');glow.addColorStop(1,'#ffffff00');
        g.fillStyle=glow;g.fillRect(x-42,y-42,84,84);
      }
      // Small jagged signal tears. Their intensity drifts, never flashes boxes.
      g.strokeStyle='#fff';g.lineWidth=.45;
      for(let i=0;i<7;i++){
        const x=11+(i*13+variant*7)%44,y=33+(i*61+variant*29)%192;
        const size=i%3===0?1.4:.65;
        g.globalAlpha=.10+.16*(.5+.5*Math.sin(angle+i*2.1));
        g.beginPath();g.moveTo(x-size,y-3*size);g.lineTo(x,y-size);g.lineTo(x-.5*size,y);
        g.lineTo(x+size,y+.5*size);g.lineTo(x+.5*size,y+2*size);g.lineTo(x+2*size,y+3*size);g.stroke();
      }
      g.globalAlpha=1;g.globalCompositeOperation='source-in';g.fillStyle=entry.tint;
      g.fillRect(0,0,LIGHT_WIDTH,LIGHT_HEIGHT);g.globalCompositeOperation='source-over';
      return entry.canvas;
    },
    dispose(){for(const c of [...bases.values(),...[...films.values()].map(e=>e.canvas)])c.width=c.height=1;bases.clear();films.clear();}
  };
}
