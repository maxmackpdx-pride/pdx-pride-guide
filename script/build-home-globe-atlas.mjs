import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module'; const require=createRequire(import.meta.url); const sharp=require('sharp');
import {logoCoverage} from '../client/public/home-flight/logo-mask.js';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..'), pub=path.join(root,'client/public');
const source=await fs.readFile(path.join(root,'client/src/components/ui/portland-metro-globe.tsx'),'utf8');
const colors=['#00ffff','#ff00cc','#ccff00','#ff6600','#ab75ff'];
const originals=JSON.parse(await fs.readFile(path.join(pub,'home-flight/waypoints.json'),'utf8'));
const products=[...source.matchAll(/\{ id: "([^"]+)", name: "([^"]+)", logo: "([^"]+)", color: "([^"]+)" \}/g)].map(m=>({id:m[1],name:m[2],logo:m[3],color:m[4],coordinates:[0,0],logoMode:'alpha',product:true}));
const rows=[...originals,...products].map((r,i)=>({...r,phase:i*2.39996,color:r.color||colors[i%colors.length]})).filter(r=>r.logo&&(r.product||r.coordinates[0]>=-122.704&&r.coordinates[0]<=-122.555&&r.coordinates[1]>=45.475&&r.coordinates[1]<=45.588)&&(!/^taboo\b/i.test(r.name)||r.id==='96-0')&&(!/^fantasy\b/i.test(r.name)||r.id==='98-0'));
const composites=[],manifest=[];let before=0;
for(const [index,r] of rows.entries()){
 let input=await fs.readFile(path.join(pub,r.logo.startsWith('/')?r.logo.slice(1):'home-flight/'+r.logo));before+=input.length;
 if(r.logo.endsWith('.svg')){const embedded=input.toString().match(/data:image\/png;base64,([^"']+)/);if(embedded)input=Buffer.from(embedded[1],'base64');}
 const {data,info}=await sharp(input).resize({width:512,height:512,fit:'inside'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let i=0;i<data.length;i+=4){const a=logoCoverage(data[i],data[i+1],data[i+2],data[i+3],r.logoMode);const tone=r.logoMode==='grayscale'?Math.round(.2126*data[i]+.7152*data[i+1]+.0722*data[i+2]):255;data[i]=data[i+1]=data[i+2]=tone;data[i+3]=Math.round(a*255);}
 const ink=await sharp(data,{raw:info}).trim({threshold:8}).resize({width:248,height:248,fit:'inside'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const w=ink.info.width+8,h=ink.info.height+8,out=Buffer.alloc(w*h*4);
 for(let y=0;y<ink.info.height;y++)for(let x=0;x<ink.info.width;x++){const a=ink.data[(y*ink.info.width+x)*4+3];for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const i=((y+4+dy)*w+x+4+dx)*4;out[i+3]=Math.max(out[i+3],a);}}
 const png=await sharp(out,{raw:{width:w,height:h,channels:4}}).composite([{input:await sharp(ink.data,{raw:ink.info}).png().toBuffer(),left:4,top:4}]).png().toBuffer();
 const x=index%4*256,y=Math.floor(index/4)*256;composites.push({input:png,left:x,top:y});manifest.push({id:r.id,coordinates:r.coordinates,phase:r.phase,color:r.color,product:!!r.product,x,y,w,h});
}
const output=path.join(pub,'home-globe');await sharp({create:{width:1024,height:Math.ceil(rows.length/4)*256,channels:4,background:'#00000000'}}).composite(composites).webp({lossless:true}).toFile(path.join(output,'holograms.webp'));
await fs.writeFile(path.join(root,'client/src/components/ui/portland-globe-holograms.json'),JSON.stringify(manifest));console.log({logos:rows.length,sourceBytes:before,atlasBytes:(await fs.stat(path.join(output,'holograms.webp'))).size});
