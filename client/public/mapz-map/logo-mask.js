// Render the venue's actual artwork as a white hologram. Different source files
// need different ink extraction; treating dark lettering as light loses the logo.
export function logoCoverage(r, g, b, alpha, mode = 'light') {
  const opacity = alpha / 255;
  if (mode === 'alpha' || mode === 'grayscale') return opacity;
  const maximum = Math.max(r, g, b) / 255;
  const minimum = Math.min(r, g, b) / 255;
  let ink = maximum * opacity, floor = .16, range = .64;
  if (mode === 'dark') { ink = 1 - (.2126 * r + .7152 * g + .0722 * b) / 255; floor = .12; range = .65; }
  if (mode === 'chroma') { ink = maximum - minimum; floor = .22; range = .35; }
  if (mode === 'light-clean') { ink = maximum; floor = .55; range = .35; }
  if (mode === 'light-faint') { ink = maximum; floor = .06; range = .27; }
  if (mode === 'white-ink') { ink = minimum; floor = .55; range = .35; }
  const edge = Math.max(0, Math.min(1, (ink - floor) / range));
  return (mode === 'light' ? 1 : opacity) * edge * edge * (3 - 2 * edge);
}

/** Reviewed white SVGs contain authored dark cutlines and light gray detail. */
export function authoredLogoMode(url, mode) {
  return /^\/(?:directory|resources)-logos\/[^?#]+-white\.svg(?:[?#]|$)/.test(url || '') ? 'grayscale' : mode;
}
export function logoTone(r, g, b, mode) {
  return mode === 'grayscale' ? Math.round(.2126*r + .7152*g + .0722*b) : 255;
}

/** Preserve every source pixel while letting gestures and paint run between rows. */
export async function maskLogoPixels(pixels,width,height,mode,{
 shouldStop=()=>false,now=()=>performance.now(),
 yieldTask=()=>new Promise(resolve=>setTimeout(resolve,0)),budgetMs=4
}={}){
 let left=width,top=height,right=0,bottom=0,deadline=now()+budgetMs;
 if(shouldStop())return null;
 for(let y=0;y<height;y++){
  for(let x=0;x<width;x++){
   const i=(y*width+x)*4;
   const coverage=logoCoverage(pixels[i],pixels[i+1],pixels[i+2],pixels[i+3],mode);
   const tone=logoTone(pixels[i],pixels[i+1],pixels[i+2],mode);
   pixels[i]=pixels[i+1]=pixels[i+2]=tone;pixels[i+3]=Math.round(coverage*255);
   if(pixels[i+3]>32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  }
  if(y+1<height&&now()>=deadline){
   await yieldTask();if(shouldStop())return null;deadline=now()+budgetMs;
  }
 }
 return {left,top,right,bottom};
}
