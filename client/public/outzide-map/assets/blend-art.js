// Blended Outzide art: a small one-size dot halftone base, six real-photo cutouts, and free-floating topo, water and mesh lines.
// One recipe per photo (outline polygons) and one rule table (class to overlay). Used by the Outzide map and by the React cards.
// Docs: the outzide-blend-card skill.
const NS='http://www.w3.org/2000/svg';
const tile=(c,kind)=>{const g=kind==='anti'
 ?"<linearGradient id='g' x1='1' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#000'/><stop offset='.25' stop-color='#fff'/><stop offset='.5' stop-color='#000'/><stop offset='.75' stop-color='#fff'/><stop offset='1' stop-color='#000'/></linearGradient>"
 :kind==='diag'
 ?"<linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#000'/><stop offset='.25' stop-color='#fff'/><stop offset='.5' stop-color='#000'/><stop offset='.75' stop-color='#fff'/><stop offset='1' stop-color='#000'/></linearGradient>"
 :"<radialGradient id='g'><stop offset='0' stop-color='#fff'/><stop offset='1' stop-color='#000'/></radialGradient>";
 return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns='${NS}' width='${c}' height='${c}'><defs>${g}</defs><rect width='${c}' height='${c}' fill='url(#g)'/></svg>`)};
const screenFilter=(id,cell,shape,sat,floor,lift)=>{const lum=`${.2126} ${.7152} ${.0722} 0 ${lift} `.repeat(3)+'0 0 0 0 1';
 const scr=shape==='hatch'
  ?`<feImage href="${tile(cell,'diag')}" x="0" y="0" width="${cell}" height="${cell}" preserveAspectRatio="none" result="ia"/><feTile in="ia" result="ta"/><feImage href="${tile(cell,'anti')}" x="0" y="0" width="${cell}" height="${cell}" preserveAspectRatio="none" result="ib"/><feTile in="ib" result="tb"/><feBlend in="ta" in2="tb" mode="lighten" result="screen"/>`
  :`<feImage href="${tile(cell,'dot')}" x="0" y="0" width="${cell}" height="${cell}" preserveAspectRatio="none" result="ci"/><feTile in="ci" result="screen"/>`;
 return `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
<feColorMatrix in="SourceGraphic" values="${lum}" result="lum"/>${scr}
<feComposite in="lum" in2="screen" operator="arithmetic" k1="0" k2="1" k3="1" k4="-1" result="raw"/>
<feComponentTransfer in="raw" result="bin"><feFuncR type="linear" slope="60"/><feFuncG type="linear" slope="60"/><feFuncB type="linear" slope="60"/><feFuncA type="linear" slope="0" intercept="1"/></feComponentTransfer>
<feColorMatrix in="SourceGraphic" type="saturate" values="${sat}" result="sc"/><feComposite in="sc" in2="bin" operator="arithmetic" k1="${1-floor}" k2="${floor}" k3="0" k4="0" result="ink"/>
<feComposite in="ink" in2="SourceGraphic" operator="in"/></filter>`};
const copier=(id,sat,curve)=>`<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
<feColorMatrix in="SourceGraphic" type="saturate" values="${sat}" result="g"/>
<feComponentTransfer in="g" result="c"><feFuncR type="table" tableValues="${curve}"/><feFuncG type="table" tableValues="${curve}"/><feFuncB type="table" tableValues="${curve}"/></feComponentTransfer>
<feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="3" result="n1"/>
<feColorMatrix in="n1" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  9 0 0 0 -5.5" result="blk"/>
<feTurbulence type="fractalNoise" baseFrequency=".004 .55" numOctaves="1" seed="5" result="n3"/>
<feColorMatrix in="n3" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.1 0 0 0 -.5" result="stk"/>
<feComposite in="blk" in2="c" operator="over" result="a"/><feComposite in="stk" in2="a" operator="over" result="d"/>
<feComposite in="d" in2="SourceGraphic" operator="in"/></filter>`;
let blDefs=null;const ensureDefs=()=>{if(blDefs&&blDefs.isConnected)return blDefs;let el=document.getElementById('bl-defs');if(!el){const sv=document.createElementNS('http://www.w3.org/2000/svg','svg');sv.setAttribute('width','0');sv.setAttribute('height','0');sv.style.position='absolute';sv.setAttribute('aria-hidden','true');el=document.createElementNS('http://www.w3.org/2000/svg','defs');el.id='bl-defs';sv.appendChild(el);document.body.appendChild(sv);el.innerHTML=DEFS_HTML}return blDefs=el};
const DEFS_HTML=screenFilter('xdots',3,'dot',1.4,.86,.12)+screenFilter('xpop',4,'hatch',1.8,.12,.05)+'<filter id="xpopcool" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feColorMatrix in="SourceGraphic" type="matrix" values=".2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 0 0 0 1 0" result="lum"/><feTurbulence type="fractalNoise" baseFrequency=".011 .018" numOctaves="3" seed="7" result="nz"/><feColorMatrix in="nz" type="matrix" values="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 1" result="nzg"/><feComposite in="lum" in2="nzg" operator="arithmetic" k1="0" k2="1" k3=".3" k4="-.15" result="mix"/><feComponentTransfer in="mix" result="post"><feFuncR type="discrete" tableValues=".02 .06 .16 .75 .94"/><feFuncG type="discrete" tableValues=".03 .30 .54 .89 .91"/><feFuncB type="discrete" tableValues=".04 .36 .65 .93 .86"/></feComponentTransfer><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="11" result="sp"/><feColorMatrix in="sp" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 9 0 0 0 -7.4" result="spk"/><feComposite in="spk" in2="post" operator="over" result="d"/><feComposite in="d" in2="SourceGraphic" operator="in"/></filter>'+
 '<filter id="xzor" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feColorMatrix in="SourceGraphic" type="matrix" values=".2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 0 0 0 1 0" result="lum"/><feTurbulence type="fractalNoise" baseFrequency=".02" numOctaves="2" seed="3" result="nz"/><feColorMatrix in="nz" type="matrix" values="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 1" result="nzg"/><feComposite in="lum" in2="nzg" operator="arithmetic" k1="0" k2="1" k3=".18" k4="-.09" result="mix"/><feComponentTransfer in="mix" result="tri"><feFuncR type="discrete" tableValues="0 1 1"/><feFuncG type="discrete" tableValues="0 .4 1"/><feFuncB type="discrete" tableValues="0 0 1"/></feComponentTransfer><feComposite in="tri" in2="SourceGraphic" operator="in"/></filter>'+copier('xcopyBW',0,'0 .02 .1 .42 .92 1 1')+copier('xcopyLC',.4,'0 .02 .16 .52 .9 1 1')+copier('xcopyCOL',.95,'0 .03 .2 .52 .88 1 1')+
 '<filter id="xglow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="h"/><feGaussianBlur in="SourceGraphic" stdDeviation="10" result="b"/><feComponentTransfer in="b" result="b2"><feFuncA type="linear" slope=".4"/></feComponentTransfer><feMerge><feMergeNode in="b2"/><feMergeNode in="h"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';

// ======== geometry helpers ========
let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const f1=v=>v.toFixed(1);
const cssPoly=(P,W,H)=>'polygon('+P.map(q=>(q[0]/W*100).toFixed(2)+'% '+(q[1]/H*100).toFixed(2)+'%').join(',')+')';
const inPoly=(x,y,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){if(((P[i][1]>y)!=(P[j][1]>y))&&(x<(P[j][0]-P[i][0])*(y-P[i][1])/(P[j][1]-P[i][1])+P[i][0]))c=!c}return c};
const bbox=P=>{const xs=P.map(q=>q[0]),ys=P.map(q=>q[1]);return {x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)}};
const area=P=>Math.abs(P.reduce((a,q,i)=>{const r=P[(i+1)%P.length];return a+q[0]*r[1]-r[0]*q[1]},0))/2;
const centroid=P=>[P.reduce((a,q)=>a+q[0],0)/P.length,P.reduce((a,q)=>a+q[1],0)/P.length];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// ---- low-resolution fields (computed once per image; the page only draws static SVG afterwards) ----
const GW=96;
const mkGrid=rec=>{const gh=Math.round(GW*rec.H/rec.W);return {gw:GW,gh,sx:rec.W/GW,sy:rec.H/gh}};
const raster=(P,g)=>{const m=new Uint8Array(g.gw*g.gh);for(let y=0;y<g.gh;y++)for(let x=0;x<g.gw;x++)m[y*g.gw+x]=inPoly((x+.5)*g.sx,(y+.5)*g.sy,P)?1:0;return m};
const chamfer=(m,gw,gh)=>{const d=new Float32Array(gw*gh);for(let i=0;i<d.length;i++)d[i]=m[i]?1e6:0;const a=1,b=1.4142;
 for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){const i=y*gw+x;if(!d[i])continue;let v=d[i];if(x>0)v=Math.min(v,d[i-1]+a);if(y>0){v=Math.min(v,d[i-gw]+a);if(x>0)v=Math.min(v,d[i-gw-1]+b);if(x<gw-1)v=Math.min(v,d[i-gw+1]+b)}d[i]=v}
 for(let y=gh-1;y>=0;y--)for(let x=gw-1;x>=0;x--){const i=y*gw+x;if(!d[i])continue;let v=d[i];if(x<gw-1)v=Math.min(v,d[i+1]+a);if(y<gh-1){v=Math.min(v,d[i+gw]+a);if(x<gw-1)v=Math.min(v,d[i+gw+1]+b);if(x>0)v=Math.min(v,d[i+gw-1]+b)}d[i]=v}
 return d};
const isoLines=(f,g,lv)=>{const {gw,gh,sx,sy}=g,segs=[];
 for(let y=0;y<gh-1;y++)for(let x=0;x<gw-1;x++){
  const a=f[y*gw+x],b=f[y*gw+x+1],c=f[(y+1)*gw+x+1],d=f[(y+1)*gw+x],pts=[];
  if((a>lv)!==(b>lv))pts.push([x+(lv-a)/(b-a),y]);
  if((b>lv)!==(c>lv))pts.push([x+1,y+(lv-b)/(c-b)]);
  if((d>lv)!==(c>lv))pts.push([x+(lv-d)/(c-d),y+1]);
  if((a>lv)!==(d>lv))pts.push([x,y+(lv-a)/(d-a)]);
  if(pts.length===2)segs.push(pts);else if(pts.length===4){segs.push([pts[0],pts[3]]);segs.push([pts[1],pts[2]])}}
 const key=p=>Math.round(p[0]*200)+'_'+Math.round(p[1]*200),ends=new Map(),used=new Uint8Array(segs.length);
 segs.forEach((s,i)=>{for(const p of s){const k=key(p);if(!ends.has(k))ends.set(k,[]);ends.get(k).push(i)}});
 const lines=[];
 for(let i=0;i<segs.length;i++){if(used[i])continue;used[i]=1;const line=[segs[i][0],segs[i][1]];
  for(const dir of [1,0]){for(;;){const tip=dir?line[line.length-1]:line[0],cand=(ends.get(key(tip))||[]).find(j=>!used[j]);if(cand===undefined)break;used[cand]=1;const s=segs[cand],nx=key(s[0])===key(tip)?s[1]:s[0];dir?line.push(nx):line.unshift(nx)}}
  if(line.length>=5)lines.push(line)}
 return lines.map(l=>{const px=l.map(p=>[(p[0]+.5)*sx,(p[1]+.5)*sy]);return px.map((p,i)=>{const a=px[Math.max(0,i-1)],b=px[Math.min(px.length-1,i+1)];return [(a[0]+p[0]*2+b[0])/4,(a[1]+p[1]*2+b[1])/4]})})};
// photo samples for roughness, glare and light/shadow (one small canvas read per image)
function samplePhoto(src,g){return new Promise(res=>{const im=new Image();im.onload=()=>{try{const c=document.createElement('canvas');c.width=g.gw;c.height=g.gh;const x=c.getContext('2d');x.drawImage(im,0,0,g.gw,g.gh);const d=x.getImageData(0,0,g.gw,g.gh).data,B=new Float32Array(g.gw*g.gh),T=new Float32Array(g.gw*g.gh),Sa=new Float32Array(g.gw*g.gh);
  for(let i=0;i<B.length;i++){B[i]=(d[i*4]*.3+d[i*4+1]*.59+d[i*4+2]*.11)/255;const mx=Math.max(d[i*4],d[i*4+1],d[i*4+2]),mn=Math.min(d[i*4],d[i*4+1],d[i*4+2]);Sa[i]=mx?(mx-mn)/mx:0}
  for(let y=1;y<g.gh-1;y++)for(let xx=1;xx<g.gw-1;xx++){const i=y*g.gw+xx;T[i]=Math.abs(B[i]-B[i-1])+Math.abs(B[i]-B[i+1])+Math.abs(B[i]-B[i-g.gw])+Math.abs(B[i]-B[i+g.gw])}
  res({B,T,Sa})}catch(e){res({B:new Float32Array(g.gw*g.gh).fill(.5),T:new Float32Array(g.gw*g.gh).fill(.1),Sa:new Float32Array(g.gw*g.gh)})}};im.onerror=()=>res({B:new Float32Array(g.gw*g.gh).fill(.5),T:new Float32Array(g.gw*g.gh).fill(.1),Sa:new Float32Array(g.gw*g.gh)});im.src=src})}
let uid=0;
// ---- line drawing: every line is kept to its object and out of the other lines' zones ----
let CLIPS=[],EXCL=[],SKIP=[],ROUTE=null,RW=800,SWEEP='';
const blocked=q=>EXCL.some(c=>Math.hypot(q[0]-c[0],q[1]-c[1])<c[2])||SKIP.some(P=>inPoly(q[0],q[1],P));
const rawPath=(pts,cls,col,w,op,extra='')=>`<path ${cls?`class="${cls}" `:''}${extra}d="${pts.map((q,i)=>(i?'L':'M')+f1(q[0])+','+f1(q[1])).join('')}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
const path=(pts,cls,col,w,op,extra='')=>{let run=[],d='';const flush=()=>{if(run.length>1)d+=run.map((q,i)=>(i?'L':'M')+f1(q[0])+','+f1(q[1])).join('');run=[]};
 for(const q of pts){if((!CLIPS.length||CLIPS.some(P=>inPoly(q[0],q[1],P)))&&!blocked(q))run.push(q);else flush()}flush();
 return d?`<path ${cls?`class="${cls}" `:''}${extra}d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`:''};
const mix=(a,b,t)=>{const h=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));const A=h(a),B=h(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')};
const topoColor=(k,n)=>{const t=n>1?Math.round(k/(n-1)*100):0;return `color-mix(in srgb,var(--neon-orange,#FF6600) ${100-t}%,var(--outz-clay,#a8552b))`};
// (5) route weighting: lines are dense and bright near the route and fade with distance from it
const routeDist=q=>{let m=1e9;for(const r of ROUTE){const d=Math.hypot(q[0]-r[0],q[1]-r[1]);if(d<m)m=d}return m};
const routeW=q=>ROUTE?.35+.65*Math.exp(-routeDist(q)/(RW*.2)):1;
const weighted=(pts,draw)=>{let out='',cur=[],cb=-1;const flush=()=>{if(cur.length>1)out+=draw(cur,[.4,.7,1][cb]);cur=[]};
 for(const q of pts){const b=Math.min(2,Math.floor(routeW(q)*3));if(b!==cb){const last=cur[cur.length-1];flush();cur=last?[last]:[];cb=b}cur.push(q)}flush();return out};
// a terrain line, plus a white copy for the scan sweep, plus a white flash copy on some lines
const topoLine=(pts,k,n)=>{const wide=k%5===4;let o=weighted(pts,(seg,m)=>path(seg,'',topoColor(k,n),wide?3:1.7,((1-k*.04)*m).toFixed(2)));
 SWEEP+=weighted(pts,(seg,m)=>path(seg,'','var(--text-hi,#fff)',wide?3.4:2.2,(.95*m).toFixed(2)));
 if(k%3===1)o+=path(pts,'wfl','var(--text-hi,#fff)',wide?2.4:1.3,.9,`style="animation-delay:${(-rnd()*6).toFixed(1)}s" `);return o};
// ======== the rule table: object class -> overlay ========
// (1)+(2) one terrain map across all the land: height by place in the frame plus distance in from the outline,
//          so lines run on across neighbouring peaks, bunch on steep edges and hug every silhouette
const terrain=(rec,g,N)=>{const land=rec.cutouts.filter(c=>['mountain','snow','rock'].includes(c.cls));if(!land.length)return '';
 const M=new Uint8Array(g.gw*g.gh);land.forEach(c=>{const m=raster(c.poly,g);for(let i=0;i<M.length;i++)if(m[i])M[i]=1});
 const D=chamfer(M,g.gw,g.gh);let maxD=1;for(let i=0;i<D.length;i++)if(M[i]&&D[i]<1e5&&D[i]>maxD)maxD=D[i];
 const f=new Float32Array(M.length);let lo=1e9,hi=-1e9;
 for(let y=0;y<g.gh;y++)for(let x=0;x<g.gw;x++){const i=y*g.gw+x;if(!M[i]){f[i]=-1;continue}const e=.55*(1-y/g.gh)+.45*Math.min(1,D[i]/(maxD*.6));f[i]=e;lo=Math.min(lo,e);hi=Math.max(hi,e)}
 CLIPS=land.map(c=>c.poly);let o='';
 for(let k=0;k<N;k++){const lv=lo+(hi-lo)*(k+1)/(N+1);for(const pl of isoLines(f,g,lv))o+=topoLine(pl,k,N)}
 CLIPS=[];return o};
// (water) shore-parallel lines near land, rounding into rings toward the focal point, drawn only where the water is rough or glaring
const waterLines=(c,rec,g,S,ctx)=>{const PW=c.lines||c.poly,m=raster(PW,g),D=chamfer(m,g.gw,g.gh),W=rec.W,H=rec.H,bb=bbox(PW);
 const F=ctx.focus||[(bb.x0+bb.x1)/2,bb.y0+(bb.y1-bb.y0)*.72],f=new Float32Array(m.length);
 for(let y=0;y<g.gh;y++)for(let x=0;x<g.gw;x++){const i=y*g.gw+x;if(!m[i]){f[i]=-1;continue}const dS=D[i]*g.sx,px=(x+.5)*g.sx,py=(y+.5)*g.sy,dF=Math.hypot(px-F[0],(py-F[1])*2.4),t=clamp(dS/(.2*W),0,1);f[i]=(1-t)*dS+t*(.2*W+.55*dF)}
 const lv=[.02,.05,.085].slice(0,ctx.shore||3).map(v=>v*W).concat([.28,.34,.4,.47].slice(0,ctx.rings||3).map(v=>v*W));
 CLIPS=[c.lines||c.poly];SKIP=ctx.skip||[];let o='',idx=0,lines=[];
 for(const L of lv){for(const pl of isoLines(f,g,L)){idx++;lines.push(pl);
  // roughness and glare decide how strong each stretch is
  let run=[],cb=-1,first=true;const flush=()=>{if(run.length>1)o+=path(run,'','var(--neon-cyan,#00FFFF)',1.2,[.16,.34,.52][cb]*(1-idx*.01));run=[]};
  for(const q of pl){const gi=clamp(Math.floor(q[1]/g.sy),0,g.gh-1)*g.gw+clamp(Math.floor(q[0]/g.sx),0,g.gw-1),r=S.T[gi]*3.2+Math.max(0,S.B[gi]-.62)*1.4,b=r>.34?2:(r>.16?1:0);if(b!==cb){const last=run[run.length-1];flush();run=last?[last]:[];cb=b}run.push(q)}flush()}}
 // (water) one bright pulse travels along two of the lines
 lines.slice().sort((a,b)=>b.length-a.length).slice(0,2).forEach((pl,i)=>{o+=path(pl,'pulse','var(--text-hi,#fff)',2.4,.9,`style="animation-delay:${(-rnd()*6).toFixed(1)}s" `)});
 // (water) reflection echo: the subject or the highest mountain mirrored into the water, broken by wave gaps
 const subj=rec.cutouts.find(c2=>c2.subject),mt=rec.cutouts.filter(c2=>['mountain','snow'].includes(c2.cls)).sort((a,b)=>area(b.poly)-area(a.poly))[0],src=subj||mt;
 if(src){const b=bbox(src.poly),ys=subj?b.y1:bb.y0+6,k=subj?.8:.5,mir=src.poly.map(q=>[q[0],ys+(ys-q[1])*k]);
  const seg=[];for(let i=0;i<mir.length;i++){const a=mir[i],b2=mir[(i+1)%mir.length],n=Math.max(1,Math.round(Math.hypot(b2[0]-a[0],b2[1]-a[1])/14));for(let j=0;j<n;j++)seg.push([a[0]+(b2[0]-a[0])*j/n,a[1]+(b2[1]-a[1])*j/n+Math.sin(j*1.7+i)*2])}
  let run=[];seg.forEach((q,i)=>{if(i%9===8){if(run.length>1)o+=path(run,'','var(--neon-cyan,#00FFFF)',1,.22);run=[]}else run.push(q)});if(run.length>1)o+=path(run,'','var(--neon-cyan,#00FFFF)',1,.22)}
 CLIPS=[];SKIP=[];return o};
const fallLines=(P,n)=>{const b=bbox(P),rows=[];for(let y=b.y0+10;y<=b.y1-10;y+=20){let l=1e9,r=-1e9;for(let x=b.x0;x<=b.x1;x+=4)if(inPoly(x,y,P)){l=Math.min(l,x);r=Math.max(r,x)}if(r>l)rows.push([y,(l+r)/2,(r-l)*.7])}
 let o='';CLIPS=[P];for(let k=0;k<n;k++){const u=k/(n-1)-.5,pts=rows.map(([y,c,w])=>[c+u*w+Math.sin(y/37+k*1.9)*3,y]);o+=path(pts,k%2?'flow':'','var(--neon-cyan,#00FFFF)',1.6+(k%3)*.5,.7)}CLIPS=[];return o};
// (mesh) wire mesh that hugs one object: an outline ring, a ring inset from it, then an even fill; spacing follows the object's size;
//        edges fade on the shadow side
const largest=ls=>ls.sort((a,b)=>b.length-a.length)[0];
const meshObj=(P,g,S)=>{const A=area(P),minD=clamp(Math.sqrt(A)/4.2,26,48),pts=[];
 const ring=pl=>{for(let i=0;i<pl.length-1;i++){const a=pl[i],b=pl[i+1],n=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/minD));for(let j=0;j<n;j++)pts.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n])}};
 ring(P.concat([P[0]]));
 const m=raster(P,g),D=chamfer(m,g.gw,g.gh),inner=largest(isoLines(D,g,Math.max(1.4,minD*.9/g.sx)));if(inner)ring(inner);
 const bb=bbox(P);
 for(let t=0;t<1500;t++){const x=bb.x0+rnd()*(bb.x1-bb.x0),y=bb.y0+rnd()*(bb.y1-bb.y0);if(!inPoly(x,y,P))continue;if(pts.some(q=>Math.hypot(q[0]-x,q[1]-y)<minD*.95))continue;pts.push([x,y])}
 const seen=new Set(),buckets=['','',''];let nodes='';
 pts.forEach((a,i)=>{const near=pts.map((b,j)=>[Math.hypot(a[0]-b[0],a[1]-b[1]),j]).filter(t=>t[1]!==i).sort((x,y)=>x[0]-y[0]).slice(0,3);
  near.forEach(([d,j])=>{const k=i<j?i+'-'+j:j+'-'+i,b=pts[j];if(d>minD*2.3||seen.has(k))return;const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;if(!inPoly(mx,my,P))return;seen.add(k);
   const gi=clamp(Math.floor(my/g.sy),0,g.gh-1)*g.gw+clamp(Math.floor(mx/g.sx),0,g.gw-1),br=S.B[gi],bi=br>.55?2:(br>.35?1:0);buckets[bi]+=`M${f1(a[0])},${f1(a[1])}L${f1(b[0])},${f1(b[1])}`});
  nodes+=`<circle cx="${f1(a[0])}" cy="${f1(a[1])}" r="1.6" fill="var(--amber,#FFB23D)"/>`});
 return {bb,svg:`<path d="${buckets[0]}" fill="none" stroke="var(--neon-orange,#FF6600)" stroke-width="1.1" opacity=".3"/><path d="${buckets[1]}" fill="none" stroke="var(--neon-orange,#FF6600)" stroke-width="1.2" opacity=".6"/><path d="${buckets[2]}" fill="none" stroke="var(--neon-orange,#FF6600)" stroke-width="1.3" opacity="1"/>${nodes}`}};
const objCircle=P=>{const c=centroid(P);return [c[0],c[1],Math.max(...P.map(q=>Math.hypot(q[0]-c[0],q[1]-c[1])))+16]};
// ======== recipes: one per photo (the baker writes the same shape; these four are hand-corrected) ========
const RECIPES={
 garibaldi:{W:800,H:1000,ownMesh:true,avoid:[[110,860,170]],cutouts:[
  {cls:'water',look:'col',poly:[[0,385],[100,370],[170,350],[207,320],[260,310],[330,308],[400,312],[430,335],[420,350],[470,375],[540,385],[640,392],[740,395],[800,400],[800,900],[700,890],[600,880],[500,840],[400,790],[300,740],[200,700],[100,660],[40,640],[0,620]],ring:[470,690],shore:3},
  {cls:'snow',look:'pop',poly:[[60,215],[100,195],[150,200],[190,215],[250,205],[300,185],[345,160],[385,135],[430,133],[470,150],[530,195],[600,215],[700,200],[640,235],[560,255],[500,230],[430,215],[380,230],[320,250],[270,245],[230,235],[200,250],[150,255],[100,240]]},
  {cls:'mountain',look:'bw',poly:[[0,195],[20,185],[60,225],[130,275],[190,305],[207,318],[170,350],[100,370],[40,385],[0,385]]},
  {cls:'mountain',look:'bw',poly:[[420,350],[470,310],[560,255],[640,235],[700,210],[740,185],[800,178],[800,400],[740,395],[640,390],[540,385],[470,375]]},
  {cls:'rock',look:'bw',poly:[[0,620],[40,640],[55,700],[120,780],[200,830],[290,870],[370,920],[420,1000],[0,1000]]},
  {cls:'veg',look:'lc',poly:[[40,670],[120,720],[250,800],[400,870],[520,890],[600,880],[700,890],[800,900],[800,1000],[420,1000],[370,920],[290,870],[200,830],[120,780],[55,700]]}
 ]},
 falls:{W:800,H:1000,hideov:true,mesh:[[[200,585],[260,580],[320,598],[346,640],[340,692],[290,684],[222,682],[200,640]],[[0,650],[60,622],[122,680],[190,760],[200,822],[160,900],[104,978],[0,1000]]],cutouts:[
  {cls:'fall',look:'bw',poly:[[375,170],[420,155],[470,150],[480,200],[462,300],[452,420],[442,540],[447,640],[470,720],[420,745],[340,735],[345,640],[350,520],[358,400],[362,300],[368,220]]},
  {cls:'rock',look:'pop',poly:[[0,165],[100,170],[250,165],[370,175],[362,300],[358,420],[350,520],[330,540],[200,520],[80,520],[0,500]]},
  {cls:'rock',look:'bw',poly:[[470,150],[540,120],[620,90],[700,50],[800,8],[800,500],[700,500],[600,490],[500,430],[450,420],[462,300],[480,200]]},
  {cls:'veg',look:'bw',poly:[[0,530],[100,545],[220,560],[340,560],[345,640],[345,700],[300,690],[200,700],[100,690],[0,640]]},
  {cls:'veg',look:'lc',poly:[[450,540],[560,545],[700,530],[800,510],[800,720],[700,700],[600,690],[480,690],[445,640]]},
  {cls:'water',look:'col',poly:[[200,745],[340,735],[420,745],[500,740],[640,740],[760,770],[800,790],[800,1000],[160,1000],[180,880],[200,800]],shore:2,minY:810,focusFrom:'fall'}
 ]},
 rooster:{W:800,H:1000,hideov:true,mesh:[[[0,322],[60,300],[130,310],[182,358],[150,392],[0,396]],[[668,232],[690,200],[722,194],[756,214],[762,250],[742,272],[690,270]]],cutouts:[
  {cls:'sky',look:'pop',poly:[[0,0],[260,0],[270,210],[150,225],[0,235]]},
  {cls:'mountain',look:'bw',poly:[[270,210],[310,150],[400,100],[480,50],[550,10],[600,0],[800,0],[800,270],[700,265],[600,260],[500,255],[400,250],[320,235]]},
  {cls:'veg',look:'lc',poly:[[0,235],[100,230],[250,225],[400,255],[600,260],[800,270],[800,380],[600,375],[400,370],[200,385],[0,400]]},
  {cls:'water',look:'col',poly:[[0,415],[480,412],[483,540],[490,600],[500,670],[480,760],[300,780],[0,820]],lines:[[0,414],[800,412],[800,1000],[0,1000]],shore:2,rings:6,focusFrom:'person'},
  {cls:'veg',look:'bw',poly:[[10,740],[50,610],[110,590],[130,690],[200,810],[110,850],[100,1000],[0,1000]]},
  {cls:'person',look:'bw',subject:true,poly:[[582,478],[585,458],[610,451],[640,455],[660,475],[662,505],[640,530],[650,550],[670,580],[690,640],[697,700],[680,730],[640,735],[560,735],[530,730],[528,700],[498,665],[484,650],[484,620],[495,570],[515,545],[540,535],[570,520],[582,500]]}
 ]},
 hero:{W:1360,H:800,ownMesh:true,avoid:[[150,640,230]],cutouts:[
  {cls:'water',look:'col',poly:[[255,375],[330,330],[470,310],[550,262],[640,258],[730,290],[800,320],[950,330],[1100,335],[1230,330],[1360,320],[1360,700],[1250,730],[1050,745],[900,720],[700,690],[540,620],[420,560],[330,470]],ring:[900,610],shore:3},
  {cls:'snow',look:'pop',poly:[[430,175],[500,160],[560,150],[620,140],[690,115],[740,112],[800,135],[820,160],[760,180],[700,185],[620,190],[560,185],[500,200],[470,190]]},
  {cls:'mountain',look:'bw',poly:[[170,230],[260,170],[330,160],[380,155],[420,180],[480,215],[550,255],[540,280],[470,305],[390,320],[300,335],[240,340],[200,290]]},
  {cls:'mountain',look:'bw',poly:[[730,290],[800,240],[890,200],[970,160],[1040,150],[1100,165],[1200,170],[1360,175],[1360,320],[1300,315],[1230,330],[1150,335],[1050,335],[950,325],[850,322],[760,300]]},
  {cls:'rock',look:'bw',poly:[[0,130],[40,150],[120,200],[200,290],[260,380],[330,490],[390,560],[440,620],[470,700],[520,800],[0,800]]},
  {cls:'veg',look:'lc',poly:[[420,555],[540,600],[700,690],[850,740],[1000,755],[1150,740],[1360,700],[1360,800],[520,800],[470,700],[440,620]]}
 ]},
 roosterHero:{W:1360,H:800,mesh:[[[255,268],[330,262],[420,266],[520,280],[538,312],[258,312]],[[1052,180],[1088,158],[1140,158],[1166,190],[1160,238],[1100,248],[1058,226]]],cutouts:[
  {cls:'sky',look:'pop',poly:[[0,0],[820,0],[690,70],[625,150],[620,185],[500,175],[300,185],[0,190]]},
  {cls:'mountain',look:'bw',poly:[[620,185],[640,130],[700,80],[780,30],[850,0],[1360,0],[1360,215],[1200,200],[1050,215],[900,205],[780,195]]},
  {cls:'veg',look:'lc',poly:[[0,190],[300,175],[500,185],[620,185],[780,195],[900,205],[1050,215],[1200,200],[1360,215],[1360,330],[900,325],[600,325],[300,320],[0,330]]},
  {cls:'water',look:'col',poly:[[0,334],[790,334],[788,520],[800,610],[810,700],[780,800],[0,800]],lines:[[0,334],[1360,334],[1360,800],[0,800]],shore:2,rings:6,focusFrom:'person'},
  {cls:'veg',look:'bw',poly:[[250,650],[300,500],[350,480],[410,590],[470,650],[540,650],[480,720],[420,800],[330,800],[290,720]]},
  {cls:'person',look:'bw',subject:true,poly:[[582,478],[585,458],[610,451],[640,455],[660,475],[662,505],[640,530],[650,550],[670,580],[690,640],[697,700],[680,730],[640,735],[560,735],[530,730],[528,700],[498,665],[484,650],[484,620],[495,570],[515,545],[540,535],[570,520],[582,500]].map(q=>[q[0]*.8+400,q[1]*.8])}
 ]}
,
 smithrock:{"W":800,"H":1000,"mesh":[[[368,540],[382,575],[400,610],[420,630],[428,670],[420,705],[395,732],[355,735],[325,720],[308,690],[322,650],[340,625],[350,590],[358,560]]],"cutouts":[{"cls":"sky","look":"pop","poly":[[0,0],[555,0],[548,120],[525,230],[525,330],[508,372],[498,382],[460,402],[400,408],[370,420],[345,435],[322,405],[300,392],[262,392],[232,410],[195,440],[165,480],[135,510],[110,505],[80,470],[45,420],[15,385],[0,372]]},{"cls":"rock","look":"bw","poly":[[555,0],[800,0],[800,770],[700,765],[620,760],[545,745],[480,700],[450,640],[470,560],[490,470],[505,390],[525,330],[525,230],[548,120]]},{"cls":"rock","look":"bw","poly":[[0,372],[15,385],[45,420],[80,470],[110,505],[135,510],[165,480],[195,440],[232,410],[262,392],[300,392],[322,405],[345,435],[370,420],[400,408],[460,402],[498,382],[490,470],[470,520],[440,560],[400,580],[300,560],[200,550],[120,545],[0,550]]},{"cls":"water","look":"col","poly":[[215,640],[300,640],[325,690],[318,725],[300,745],[260,765],[235,778],[260,795],[400,805],[480,810],[600,820],[800,822],[800,850],[560,852],[300,848],[100,832],[0,815],[0,790],[40,780],[120,765],[190,750],[230,725],[225,690],[212,655]],"ring":[150,805],"shore":2},{"cls":"veg","look":"lc","poly":[[0,550],[120,545],[200,550],[300,560],[400,580],[440,560],[470,520],[450,640],[480,700],[545,745],[620,760],[700,765],[800,770],[800,820],[600,815],[480,808],[400,800],[260,795],[235,778],[260,765],[300,745],[318,725],[325,690],[305,645],[240,640],[215,645],[212,655],[225,690],[230,725],[190,750],[120,765],[40,780],[0,790]]},{"cls":"veg","look":"bw","poly":[[368,540],[382,575],[400,610],[420,630],[428,670],[420,705],[395,732],[355,735],[325,720],[308,690],[322,650],[340,625],[350,590],[358,560]]}]},
 trillium:{"W":800,"H":1000,"mesh":[[[342,822],[365,805],[395,803],[425,820],[455,850],[430,872],[385,872],[350,845]]],"cutouts":[{"cls":"sky","look":"pop","poly":[[0,0],[800,0],[800,235],[720,225],[640,245],[580,290],[552,310],[550,420],[480,410],[400,390],[330,365],[270,323],[245,328],[200,350],[140,380],[60,400],[0,415]]},{"cls":"mountain","look":"bw","poly":[[0,415],[60,400],[140,380],[200,350],[245,328],[270,323],[330,365],[400,390],[480,410],[550,420],[550,440],[400,450],[250,455],[100,450],[0,440]]},{"cls":"veg","look":"bw","poly":[[0,440],[100,450],[250,455],[400,450],[550,440],[550,500],[460,495],[310,505],[100,510],[0,512]]},{"cls":"veg","look":"bw","poly":[[552,420],[560,300],[600,250],[640,245],[720,225],[800,235],[800,520],[720,515],[640,520],[555,515]]},{"cls":"water","look":"col","poly":[[0,512],[300,505],[450,497],[555,515],[640,520],[740,520],[760,545],[730,570],[700,610],[640,650],[580,700],[540,760],[500,780],[520,850],[540,900],[510,960],[530,1000],[0,1000]],"ring":[330,700],"shore":3},{"cls":"veg","look":"lc","poly":[[800,540],[760,545],[730,570],[700,610],[640,650],[580,700],[540,760],[500,780],[520,850],[540,900],[510,960],[530,1000],[800,1000]]}]},
 tamolitch:{"W":800,"H":1000,"mesh":[[[358,308],[375,284],[405,282],[416,310],[406,338],[376,344]]],"cutouts":[{"cls":"water","look":"col","poly":[[0,480],[100,455],[250,420],[400,395],[560,385],[640,350],[720,330],[800,320],[800,960],[380,960],[250,850],[130,770],[100,700],[85,640],[40,590],[0,560]],"ring":[430,680],"shore":3},{"cls":"rock","look":"bw","poly":[[0,130],[60,160],[130,230],[250,258],[300,262],[300,410],[250,420],[100,455],[0,480]]},{"cls":"rock","look":"bw","poly":[[300,262],[350,265],[450,290],[560,300],[680,300],[720,330],[640,350],[560,385],[400,395],[300,410]]},{"cls":"veg","look":"bw","poly":[[90,100],[170,60],[260,40],[380,60],[480,100],[515,150],[480,235],[400,230],[330,255],[230,230],[150,170]]},{"cls":"veg","look":"lc","poly":[[520,0],[800,0],[800,235],[700,265],[640,230],[580,190],[540,110]]},{"cls":"rock","look":"pop","poly":[[0,560],[40,590],[85,640],[100,700],[130,770],[250,850],[350,940],[380,960],[400,1000],[0,1000]]}]},
 capedis:{"W":800,"H":1000,"mesh":[[[75,925],[100,885],[140,860],[190,855],[230,880],[270,945],[220,960],[130,950]]],"cutouts":[{"cls":"sky","look":"pop","poly":[[0,0],[800,0],[800,390],[730,380],[690,440],[650,455],[600,458],[560,455],[535,455],[500,400],[480,395],[420,395],[380,375],[340,395],[280,390],[215,400],[170,350],[130,300],[80,292],[40,265],[0,250]]},{"cls":"rock","look":"bw","poly":[[0,330],[40,345],[100,390],[160,440],[230,500],[300,540],[360,580],[390,600],[350,610],[300,600],[250,635],[200,632],[120,625],[60,628],[0,610]]},{"cls":"veg","look":"lc","poly":[[215,400],[260,395],[300,392],[340,395],[390,378],[430,392],[470,400],[480,470],[460,500],[400,560],[350,550],[300,500],[250,460]]},{"cls":"rock","look":"bw","poly":[[380,580],[400,555],[430,540],[470,500],[500,475],[530,462],[535,458],[540,410],[560,406],[565,456],[580,452],[620,455],[665,490],[690,530],[705,580],[722,620],[640,615],[560,610],[480,600],[430,590]]},{"cls":"water","look":"col","poly":[[0,640],[100,630],[200,640],[300,640],[390,610],[500,605],[600,615],[722,622],[800,615],[800,880],[600,880],[400,885],[200,880],[0,870]],"ring":[570,700],"shore":2},{"cls":"rock","look":"bw","poly":[[0,880],[100,880],[130,858],[190,855],[230,875],[260,900],[400,895],[600,900],[700,905],[800,880],[800,1000],[0,1000]]}]},
 palouse:{"W":800,"H":1000,"mesh":[[[410,620],[440,607],[480,610],[498,630],[492,650],[450,655],[415,645]]],"cutouts":[{"cls":"sky","look":"pop","poly":[[0,0],[800,0],[800,240],[700,252],[600,248],[500,258],[400,262],[300,268],[200,254],[120,262],[50,268],[0,270]]},{"cls":"fall","look":"bw","poly":[[378,625],[400,620],[430,622],[438,700],[444,800],[455,885],[420,900],[360,900],[368,800],[372,700]]},{"cls":"rock","look":"bw","poly":[[800,350],[765,370],[735,420],[710,480],[700,560],[698,650],[660,680],[625,700],[608,760],[600,830],[585,900],[640,885],[700,880],[800,870]]},{"cls":"rock","look":"lc","poly":[[0,350],[300,345],[600,350],[700,362],[712,470],[650,505],[560,525],[480,560],[420,600],[380,600],[330,570],[270,545],[262,440],[200,410],[60,415],[0,415]]},{"cls":"rock","look":"bw","poly":[[0,420],[50,425],[62,470],[62,555],[130,575],[250,565],[330,575],[378,600],[372,700],[365,790],[340,850],[300,882],[200,886],[100,900],[0,910]]},{"cls":"water","look":"col","poly":[[0,925],[60,915],[160,900],[260,892],[350,895],[450,890],[540,890],[585,900],[580,1000],[0,1000]],"ring":[400,925],"shore":2}]},
 hurricane:{"W":800,"H":1000,"mesh":[[[470,795],[500,780],[540,785],[580,800],[570,830],[520,840],[470,830]]],"cutouts":[{"cls":"sky","look":"pop","poly":[[0,0],[800,0],[800,215],[760,222],[740,235],[690,240],[640,190],[600,200],[540,180],[500,185],[460,200],[400,180],[350,178],[300,185],[240,172],[200,170],[150,185],[100,185],[70,178],[40,180],[0,200]]},{"cls":"snow","look":"bw","poly":[[0,205],[40,180],[80,180],[150,185],[200,172],[240,175],[300,185],[350,178],[400,185],[460,200],[500,190],[540,180],[600,190],[640,195],[690,240],[740,222],[800,238],[800,260],[760,250],[700,265],[650,245],[610,270],[560,260],[500,255],[470,240],[420,225],[380,235],[330,245],[310,255],[280,230],[240,215],[200,225],[150,220],[100,215],[40,225],[0,235]]},{"cls":"mountain","look":"lc","poly":[[0,235],[100,215],[200,225],[280,230],[330,250],[420,225],[500,255],[560,260],[650,250],[700,265],[800,260],[800,400],[700,395],[600,390],[500,380],[400,385],[300,370],[240,375],[200,370],[150,350],[80,330],[0,320]]},{"cls":"veg","look":"bw","poly":[[0,430],[100,420],[200,405],[300,385],[400,385],[450,420],[430,520],[420,620],[400,700],[330,740],[270,790],[240,870],[200,890],[100,900],[0,900]]},{"cls":"veg","look":"lc","poly":[[500,450],[560,470],[640,480],[720,500],[800,540],[800,640],[700,610],[600,620],[520,640],[480,700],[400,760],[330,780],[280,740],[300,700],[400,640],[440,560],[460,480]]},{"cls":"rock","look":"bw","poly":[[800,720],[740,735],[680,745],[620,760],[560,775],[490,790],[440,810],[420,850],[480,830],[560,840],[640,850],[720,850],[800,860]]}]},
 solduc:{"W":800,"H":1000,"mesh":[[[560,790],[600,770],[650,790],[660,830],[640,870],[585,875],[555,840]]],"cutouts":[{"cls":"water","look":"col","poly":[[300,345],[360,340],[440,350],[470,370],[470,430],[478,500],[510,555],[500,620],[475,680],[470,760],[480,840],[486,920],[490,1000],[388,1000],[385,900],[375,800],[350,720],[335,640],[350,570],[345,500],[335,420]],"ring":[430,860],"shore":2,"rings":3},{"cls":"veg","look":"bw","poly":[[0,0],[290,0],[300,150],[270,300],[300,345],[335,420],[345,500],[350,560],[335,640],[350,720],[0,720]]},{"cls":"veg","look":"bw","poly":[[520,0],[800,0],[800,300],[700,300],[560,330],[520,250],[480,130]]},{"cls":"veg","look":"lc","poly":[[470,370],[560,330],[700,300],[800,300],[800,560],[600,560],[510,555],[478,500],[470,430]]},{"cls":"rock","look":"bw","poly":[[0,720],[350,720],[375,800],[385,900],[388,1000],[0,1000]]},{"cls":"veg","look":"pop","poly":[[500,620],[800,600],[800,1000],[490,1000],[486,920],[480,840],[470,760],[475,680]]}]},
 proxy:{"W":800,"H":1000,"mesh":[[[675,600],[710,585],[745,600],[750,650],[735,690],[690,695],[670,650]]],"cutouts":[{"cls":"fall","look":"bw","poly":[[380,0],[470,0],[490,100],[500,250],[510,380],[540,480],[580,600],[600,700],[615,800],[620,900],[590,940],[470,935],[440,880],[430,800],[405,700],[385,640],[355,560],[345,450],[300,350],[300,150],[340,60]]},{"cls":"veg","look":"bw","poly":[[0,0],[380,0],[340,60],[300,150],[300,350],[345,450],[350,500],[0,500]]},{"cls":"veg","look":"lc","poly":[[0,500],[350,500],[355,560],[385,640],[405,700],[430,800],[440,880],[460,930],[470,1000],[0,1000]]},{"cls":"veg","look":"lc","poly":[[470,0],[800,0],[800,200],[700,230],[500,210],[500,130],[490,100]]},{"cls":"veg","look":"bw","poly":[[500,210],[700,230],[800,200],[800,420],[740,450],[620,430],[540,440],[510,380],[500,250]]},{"cls":"veg","look":"pop","poly":[[540,440],[620,430],[740,450],[800,420],[800,900],[700,890],[620,900],[615,800],[600,700],[580,600],[550,500]]}]},
 tumalo:{"W":800,"H":1000,"mesh":[[[440,930],[490,905],[550,915],[570,960],[540,1000],[450,1000],[420,970]]],"cutouts":[{"cls":"fall","look":"bw","poly":[[150,200],[200,160],[290,140],[330,150],[370,250],[430,360],[480,460],[500,540],[520,620],[555,700],[620,740],[690,790],[700,860],[620,880],[500,870],[420,830],[340,760],[300,680],[280,600],[250,520],[205,420],[195,330],[170,260]]},{"cls":"veg","look":"bw","poly":[[470,0],[800,0],[800,440],[740,420],[700,330],[600,300],[540,260],[500,150]]},{"cls":"veg","look":"lc","poly":[[450,350],[540,290],[610,305],[680,370],[730,440],[740,520],[745,700],[735,800],[690,790],[620,740],[555,700],[520,620],[500,540],[480,460],[430,360]]},{"cls":"veg","look":"pop","poly":[[0,720],[80,710],[130,790],[200,830],[240,900],[330,880],[390,930],[330,1000],[0,1000]]},{"cls":"veg","look":"lc","poly":[[0,0],[150,0],[150,200],[170,260],[195,330],[205,420],[250,520],[280,600],[300,680],[340,760],[300,820],[240,900],[200,830],[130,790],[80,710],[0,720]]},{"cls":"veg","look":"bw","poly":[[330,1000],[390,930],[420,860],[500,880],[620,880],[700,870],[740,900],[800,930],[800,1000]]}]},
 brandywine:{"W":800,"H":1000,"avoid":[],"mesh":[[[600,795],[640,778],[685,790],[680,850],[650,900],[620,960],[590,990],[565,930],[560,860],[575,815]]],"cutouts":[{"cls":"fall","look":"bw","poly":[[402,315],[450,310],[498,318],[500,400],[500,520],[500,700],[498,820],[490,890],[430,905],[360,890],[350,800],[350,650],[355,500],[370,400],[385,340]]},{"cls":"veg","look":"bw","poly":[[0,265],[100,255],[200,265],[300,290],[390,305],[385,340],[370,380],[250,385],[100,380],[0,375]]},{"cls":"veg","look":"bw","poly":[[500,318],[550,300],[600,330],[640,380],[620,470],[630,560],[600,620],[640,700],[600,760],[560,760],[520,700],[500,640],[502,520],[500,400]]},{"cls":"veg","look":"pop","poly":[[700,150],[790,130],[800,700],[760,720],[690,640],[640,560],[620,480],[640,380],[620,330],[690,250]]},{"cls":"veg","look":"lc","poly":[[0,380],[100,385],[250,390],[370,385],[355,500],[350,600],[300,640],[200,640],[100,650],[0,660]]},{"cls":"water","look":"col","poly":[[100,1000],[130,970],[200,935],[290,905],[360,890],[430,905],[490,890],[550,880],[570,930],[580,1000]],"ring":[430,910],"shore":2}]},
 capelookout:{"W":800,"H":1000,"avoid":[],"mesh":[[[255,780],[270,830],[300,900],[330,960],[300,1000],[210,1000],[205,940],[240,900],[250,840]]],"cutouts":[{"cls":"sky","look":"lc","poly":[[0,0],[800,0],[800,250],[600,230],[300,140],[0,130]]},{"cls":"sky","look":"pop","poly":[[0,130],[300,140],[600,230],[800,250],[800,330],[700,335],[600,345],[520,365],[460,358],[400,355],[330,370],[275,400],[180,405],[0,395]]},{"cls":"mountain","look":"bw","poly":[[275,400],[330,370],[400,355],[460,358],[520,365],[600,345],[700,335],[800,330],[800,410],[720,412],[600,408],[480,408],[400,405]]},{"cls":"water","look":"col","poly":[[0,410],[170,410],[400,405],[600,410],[700,420],[680,500],[640,560],[580,620],[500,670],[420,720],[330,770],[250,820],[160,875],[80,920],[0,950]],"ring":[430,520],"shore":3},{"cls":"rock","look":"lc","poly":[[700,415],[780,440],[800,470],[800,520],[740,575],[690,595],[630,640],[590,690],[550,740],[510,800],[470,850],[420,900],[380,960],[330,1000],[0,1000],[0,950],[80,920],[160,875],[250,820],[330,770],[420,720],[500,670],[580,620],[640,560],[680,500]]},{"cls":"veg","look":"bw","poly":[[800,520],[800,1000],[330,1000],[380,960],[420,900],[470,850],[510,800],[550,740],[590,690],[630,640],[690,595],[740,575]]}]},
 latourell:{"W":800,"H":1000,"avoid":[],"mesh":[[[175,790],[215,775],[240,810],[245,850],[225,870],[185,860],[170,830]]],"cutouts":[{"cls":"fall","look":"bw","poly":[[388,100],[432,96],[440,200],[442,300],[444,420],[447,560],[448,700],[452,800],[448,880],[430,930],[390,930],[392,850],[390,700],[386,560],[380,420],[378,300],[382,200]]},{"cls":"veg","look":"bw","poly":[[90,500],[200,480],[385,520],[390,700],[160,705],[110,680],[80,600]]},{"cls":"veg","look":"pop","poly":[[488,140],[545,105],[620,140],[690,230],[720,300],[680,370],[620,420],[540,430],[505,350],[490,250]]},{"cls":"veg","look":"bw","poly":[[449,440],[540,430],[600,480],[600,560],[585,680],[560,760],[450,750],[447,560]]},{"cls":"veg","look":"lc","poly":[[700,300],[740,290],[770,400],[800,470],[800,1000],[560,1000],[520,900],[560,840],[600,770],[610,600],[650,460]]},{"cls":"water","look":"col","poly":[[300,905],[370,930],[440,925],[500,935],[545,940],[550,1000],[330,1000],[290,950]],"ring":[430,950],"shore":2}]}
};
const PLACE_MATCH=[['garibaldi',/Garibaldi Lake/i],['falls',/Silver Falls/i],['rooster',/Rooster Rock/i]];

const ROUTES={
 trillium:[[70,968],[136,778],[202,555],[258,333]],
 hurricane:[[99,968],[172,732],[246,457],[309,182]],
 palouse:[[202,968],[276,945],[349,917],[412,890]],
 latourell:[[200,968],[274,954],[347,937],[410,920]],
 brandywine:[[217,968],[290,946],[364,921],[427,895]],
 tumalo:[[397,968],[470,939],[544,904],[607,870]],
 proxy:[[320,968],[394,954],[467,937],[530,920]],
 garibaldi:[[240,732],[222,690],[204,620],[200,550],[228,480],[288,412],[340,352],[372,300],[392,232],[398,176]],
 falls:[[270,650],[300,590],[330,552],[420,546],[560,532],[700,516],[800,506]],
 rooster:[[150,925],[190,820],[250,700],[300,590],[318,500],[350,420],[430,330],[500,250],[570,170],[625,118],[640,100]],
 hero:[[400,550],[470,520],[550,490],[620,445],[668,390],[655,330],[668,268],[690,205],[700,152],[702,128]]
};
const largest2=ls=>ls.sort((a,b)=>b.length-a.length)[0];
const insetPoly=(poly,g,dpx)=>{const m=raster(poly,g),D=chamfer(m,g.gw,g.gh),pl=largest2(isoLines(D,g,dpx/g.sx));return pl&&pl.length>=6?pl:null};
const qa=()=>({});
async function build(rec,name,art,real){
 const W0=rec.W,H0=rec.H,g=mkGrid(rec),S=await samplePhoto(real.src,g);
 RW=W0;ROUTE=null;const rt=ROUTES[name];if(rt){ROUTE=[];for(let i=0;i<rt.length-1;i++){const a=rt[i],b=rt[i+1],n=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/12));for(let j=0;j<n;j++)ROUTE.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n])}}
 const subj=rec.cutouts.find(c=>c.subject),fall=rec.cutouts.find(c=>c.cls==='fall');
 const focusOf=c=>{if(c.ring)return c.ring;if(c.focusFrom==='person'&&subj){const b=bbox(subj.poly);return [(b.x0+b.x1)/2,b.y1+3]}if(c.focusFrom==='fall'&&fall){const b=bbox(fall.poly);return [(b.x0+b.x1)/2,b.y1+10]}return null};
 EXCL=(rec.mesh||[]).map(objCircle).concat(rec.avoid||[]);SWEEP='';
 const stats={topo:0,water:0};

 // Clouds: die-cut to their real shape from bright, unsaturated sky, drawn in Zaylist orange, black and white; they glitch in and out.
 try{
  const LAND=['mountain','snow','rock','veg','water','person','fall'],land=new Uint8Array(g.gw*g.gh);
  for(const c of rec.cutouts)if(LAND.includes(c.cls)){const m=raster(c.poly,g);for(let i=0;i<land.length;i++)if(m[i])land[i]=1}
  const field=new Float32Array(g.gw*g.gh).fill(-1);let skyCells=0;
  for(let x=0;x<g.gw;x++){let y=0;while(y<g.gh&&!land[y*g.gw+x])y++;for(let k=0;k<Math.max(0,y-1);k++){const i=k*g.gw+x;field[i]=S.B[i]-.45*S.Sa[i];skyCells++}}
  if(skyCells>g.gw*g.gh*.03){
   const sm=new Float32Array(field);for(let y=1;y<g.gh-1;y++)for(let x=1;x<g.gw-1;x++){const i=y*g.gw+x;if(field[i]<0)continue;let a=0,n=0;for(const j of [-1,0,1,-g.gw,g.gw]){if(field[i+j]>=0){a+=field[i+j];n++}}sm[i]=a/n}
   const loops=isoLines(sm,g,.58).filter(pl=>pl.length>=8&&area(pl)>W0*H0*.0012);
   if(loops.length){
    const id='zc'+(uid++),d=loops.map(pl=>'M'+pl.map(q=>f1(q[0])+','+f1(q[1])).join('L')+'Z').join('');
    ensureDefs().insertAdjacentHTML('beforeend','<svg width="0" height="0" style="position:absolute"><clipPath id="'+id+'" clipPathUnits="objectBoundingBox"><path transform="scale('+(1/W0)+' '+(1/H0)+')" d="'+d+'"/></clipPath></svg>');
    art.insertAdjacentHTML('beforeend','<div class="xc zor k2" style="--d:'+(6.5+rnd()*3).toFixed(1)+'s;--o:-'+(rnd()*6).toFixed(1)+'s;clip-path:url(#'+id+')"><img src="'+real.src+'" alt=""></div>');
   }
  }
 }catch(e){}
 let lines=terrain(rec,g,W0>1000?10:9);stats.topo=(lines.match(/<path/g)||[]).length;
 for(const c of rec.cutouts){
  if(c.cls==='fall')lines+=fallLines(c.poly,6);
  if(c.cls==='water'){const w=waterLines(c,rec,g,S,{focus:focusOf(c),shore:c.shore,rings:c.rings,skip:subj?[subj.poly]:[]});stats.water+=(w.match(/<path/g)||[]).length;lines+=w}
 }
 EXCL=[];
 // meshes: each reveals bottom-up on its own clock
 let meshes='',meshPlain='',defs='';
 (rec.mesh||[]).forEach((P,i)=>{const mo=meshObj(P,g,S),id='mw'+(uid++);
  defs+=`<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W0}" height="${H0}"><rect class="mwr" x="${f1(mo.bb.x0-12)}" y="${f1(mo.bb.y0-12)}" width="${f1(mo.bb.x1-mo.bb.x0+24)}" height="${f1(mo.bb.y1-mo.bb.y0+24)}" fill="#fff" style="animation-delay:${(-rnd()*9).toFixed(1)}s"/></mask>`;
  meshes+=`<g mask="url(#${id})">${mo.svg}</g>`;meshPlain+=mo.svg});
 // (4) scan sweep: a bright band crosses the card; the white copy of the terrain lines shows only inside it
 const smask='sm'+(uid++);
 defs+=`<linearGradient id="sg${smask}" x1="0" x2="1"><stop offset="0" stop-color="#000"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><mask id="${smask}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W0}" height="${H0}"><rect class="swr" x="${-W0*.4}" y="0" width="${W0*.4}" height="${H0}" fill="url(#sg${smask})" style="--sw:${W0*1.8}px;animation-delay:${(-rnd()*8).toFixed(1)}s"/></mask>`;
 const main=`<svg class="xfl" viewBox="0 0 ${W0} ${H0}" preserveAspectRatio="none" aria-hidden="true"><defs>${defs}</defs><g filter="url(#xglow)">${lines}${meshes}</g><g mask="url(#${smask})">${SWEEP}</g></svg>`;
 art.insertAdjacentHTML('beforeend',main);
 // (6) tear: three clipped copies of the static lines slip with the glitch (columns for Silver Falls)
 const plain=`<svg class="xfl tear${name==='falls'?' v':''}" viewBox="0 0 ${W0} ${H0}" preserveAspectRatio="none" aria-hidden="true"__STYLE__><g filter="url(#xglow)">${lines}${meshPlain}</g></svg>`;
 const cuts=name==='falls'?[[10,0,70,0,-3],[40,0,40,0,4],[70,0,10,0,-3]]:[[8,86,0,0,-7],[38,52,0,0,6],[62,28,0,0,-5]];
 cuts.forEach(([a,b,c2,d,dx],i)=>{const clip=name==='falls'?`inset(0 ${100-a-30}% 0 ${a}%)`:`inset(${a}% 0 ${b}% 0)`;
  art.insertAdjacentHTML('beforeend',plain.replace('__STYLE__',` style="clip-path:${clip};--dx:${dx}cqw;--dy:${dx*.6}cqw;--sd:${(i*.05).toFixed(2)}s"`))});
 return qa(rec,name,stats);
}

// ======== public API ========
// Places with blended art. variant 'tall' is the 200x236 card art, 'wide' the drawer card and open-card hero.
const BLEND_KEYS={'bc-garibaldi':{tall:'garibaldi',wide:'hero'},'silver-falls':{tall:'falls'},'rooster-rock':{tall:'rooster',wide:'roosterHero'},'dayuse-or-smith-rock-state-park':{tall:'smithrock'},'usfs-5435010324':{tall:'trillium'},'usfs-6485821010602':{tall:'tamolitch'},'cape-disappointment':{tall:'capedis'},'dayuse-wa-palouse-falls-state-park-heritage-site':{tall:'palouse'},'hurricane-hill':{tall:'hurricane'},'sol-duc-falls':{tall:'solduc'},'usfs-5250.005571':{tall:'proxy'},'usfs-7682.004621':{tall:'tumalo'},'bc-brandywine':{tall:'brandywine'},'cape-lookout':{tall:'capelookout'},'dayuse-or-latourell-falls-trailhead-guy-w-talbot':{tall:'latourell'}};
const BLEND_PHOTO={garibaldi:'garibaldi',falls:'falls',rooster:'rooster',hero:'hero',roosterHero:'rooster-wide',smithrock:'smithrock',trillium:'trillium',tamolitch:'tamolitch',capedis:'capedis',palouse:'palouse',hurricane:'hurricane',solduc:'solduc',proxy:'proxy',tumalo:'tumalo',brandywine:'brandywine',capelookout:'capelookout',latourell:'latourell'};
const HUD_LABEL={trillium:"MT HOOD 11,249 FT",hurricane:"HURRICANE HILL 5,757 FT",palouse:"PALOUSE FALLS 198 FT",latourell:"LATOURELL FALLS 224 FT",brandywine:"BRANDYWINE FALLS 70 M",tumalo:"TUMALO FALLS 97 FT",proxy:"PROXY FALLS 226 FT",garibaldi:'MT GARIBALDI 2,678 M',hero:'MT GARIBALDI 2,678 M',falls:'SOUTH FALLS 177 FT'};
export const hasBlend=(placeId,variant='tall')=>Boolean(BLEND_KEYS[placeId]&&BLEND_KEYS[placeId][variant]);
const photoUrl=key=>`/outzide-map/assets/photos/blend/${BLEND_PHOTO[key]}.webp`;
const setVars=(box,rec)=>{const W=box.clientWidth,H=box.clientHeight;if(!W||!H)return false;const ph=W*rec.H/rec.W;box.style.setProperty('--xt',((H-ph)/2).toFixed(1)+'px');box.style.setProperty('--xh',ph.toFixed(1)+'px');return true};
// A route with a travelling dot, a target ring and a lock-on label, drawn in the recipe's own coordinates.
function hudMarkup(rec,key){
 const rt=ROUTES[key];if(!rt)return '';const W=rec.W,H=rec.H,e=rt[rt.length-1],tx=clamp(e[0],W*.12,W*.88),ty=clamp(e[1],H*.1,H*.9),d='M'+rt.map(q=>f1(q[0])+','+f1(q[1])).join('L');
 const label=HUD_LABEL[key],fs=Math.round(W*.034),lw=label?label.length*fs*.62+fs*1.2:0,lx=clamp(tx-lw/2,W*.03,W-lw-W*.03),ly=clamp(ty+W*.1,H*.06,H-fs*2.4);
 return `<svg class="bl-hud" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="bl-hud-glow-${key}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${(W/200).toFixed(1)}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#bl-hud-glow-${key})"><path class="bl-route" d="${d}" fill="none" stroke="var(--neon-orange,#FF6600)" stroke-width="${(W/130).toFixed(1)}" stroke-linecap="round" stroke-dasharray="${(W/20).toFixed(0)} ${(W/32).toFixed(0)}"/><circle r="${(W/110).toFixed(1)}" fill="var(--text-hi,#fff)"><animateMotion dur="6s" repeatCount="indefinite" path="${d}"/></circle><g transform="translate(${f1(tx)} ${f1(ty)})"><circle class="bl-ring" r="${(W/16).toFixed(0)}" fill="none" stroke="var(--text-hi,#fff)" stroke-width="${(W/260).toFixed(1)}" stroke-dasharray="${(W/60).toFixed(0)} ${(W/80).toFixed(0)}"/><path d="M${-W/12} ${-W/30}V${-W/12}H${-W/30}M${W/12} ${-W/30}V${-W/12}H${W/30}M${-W/12} ${W/30}V${W/12}H${-W/30}M${W/12} ${W/30}V${W/12}H${W/30}" fill="none" stroke="var(--neon-orange,#FF6600)" stroke-width="${(W/200).toFixed(1)}"/></g>${label?`<g transform="translate(${f1(lx)} ${f1(ly)})"><rect width="${f1(lw)}" height="${f1(fs*1.7)}" fill="var(--z-black,#050506)" stroke="var(--neon-orange,#FF6600)" stroke-width="${(W/400).toFixed(1)}"/><text x="${f1(fs*.6)}" y="${f1(fs*1.2)}" font-family="'JetBrains Mono',ui-monospace,monospace" font-weight="600" font-size="${fs}" fill="var(--text-hi,#fff)" letter-spacing="1">${label}</text></g>`:''}</g></svg>`;
}
/** Mount the blended art into `container` (position:relative, sized by its owner). Returns a disposer. */
export async function mountBlend(container,placeId,{variant='tall',hud=true}={}){
 const key=BLEND_KEYS[placeId]&&BLEND_KEYS[placeId][variant];if(!key)return()=>{};
 const rec=RECIPES[key],src=photoUrl(key);if(!rec)return()=>{};
 ensureDefs();
 const W0=rec.W,H0=rec.H,g=mkGrid(rec);
 const box=document.createElement('div');box.className='bl';box.dataset.blend=placeId;container.prepend(box);
 let disposed=false,ro=null;
 for(let i=0;i<30&&!setVars(box,rec);i++){await new Promise(r=>requestAnimationFrame(r));if(disposed)return()=>{}}
 ro=new ResizeObserver(()=>setVars(box,rec));ro.observe(box);
 box.insertAdjacentHTML('beforeend',`<img class="bl-base" src="${src}" alt="" decoding="async">`);
 box.insertAdjacentHTML('beforeend',rec.cutouts.map((c,ci)=>{
  const long=!!c.subject,sync=!long&&(ci===1||ci===4),d=long?10:(sync?7:+(5.5+rnd()*8).toFixed(1)),o=long?.4:(sync?0:-+(rnd()*d).toFixed(1)),
   k=long?'long':(sync?'ksync':(c.look==='bw'?'kbw':'k'+(1+Math.floor(rnd()*3))));
  const terr=c.look==='bw'&&['mountain','rock','snow'].includes(c.cls);let inner='';
  if(terr){const L=[.035,.075].map(v=>insetPoly(c.poly,g,v*W0));
   inner=`<div class="xt"><img src="${src}" style="clip-path:${cssPoly(c.poly,W0,H0)}" alt="">`+L.map((pl,li)=>pl?`<img class="m${li+1}" src="${src}" style="clip-path:${cssPoly(pl,W0,H0)}" alt="">`:'').join('')+'</div>'}
  else inner=`<img src="${src}" style="clip-path:${cssPoly(c.poly,W0,H0)}" alt="">`;
  return `<div class="xc ${c.look} ${k}${terr?' terr':''}" style="--d:${d}s;--o:${o}s">${inner}</div>`}).join(''));
 await build(rec,key,box,{src});
 if(hud&&!disposed)box.insertAdjacentHTML('beforeend',hudMarkup(rec,key));
 return ()=>{disposed=true;ro&&ro.disconnect();box.remove()};
}

// The React cards load this file as a module script and read the API from here.
if(typeof window!=="undefined")window.__outzBlendArt={hasBlend,mountBlend};
