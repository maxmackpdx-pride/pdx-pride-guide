/** Keep generated artwork intact; compose its transparency and authored exclusions in SVG. */
export function wrapOutzideArtwork({webp,width,height,exclusions=[]}){
 if(!Buffer.isBuffer(webp)||webp.toString('ascii',0,4)!=='RIFF'||webp.toString('ascii',8,12)!=='WEBP')throw new Error('Expected an embedded WebP artwork buffer');
 if(![width,height].every(n=>Number.isInteger(n)&&n>0&&n<=16384))throw new Error('Invalid artwork dimensions');
 if(!Array.isArray(exclusions)||exclusions.some(p=>!Array.isArray(p)||p.length<3||p.some(v=>!Array.isArray(v)||v.length!==2||!v.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1))))throw new Error('Invalid normalized artwork exclusion');
 const polygons=exclusions.map(p=>`<polygon points="${p.map(([x,y])=>`${(x*width).toFixed(3)},${(y*height).toFixed(3)}`).join(' ')}" fill="black"/>`).join('');
 // Static alpha transfer removes faint substrate haze while retaining luminous cores.
 const alpha='<filter id="ink" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncA type="table" tableValues="0 0 .08 .15 .23 .30 .37 .44 .51 .58 .65 .72 .79 .85 .91 .96 1"/></feComponentTransfer></filter>';
 const mask=polygons?`<mask id="allowed" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}" style="mask-type:luminance"><rect width="${width}" height="${height}" fill="white"/>${polygons}</mask>`:'';
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${alpha}${mask}</defs><image width="${width}" height="${height}" preserveAspectRatio="none" filter="url(#ink)"${polygons?' mask="url(#allowed)"':''} href="data:image/webp;base64,${webp.toString('base64')}"/></svg>`;
}
