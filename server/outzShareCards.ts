import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export type SharedOutzPlace = {id:string; name:string; region:string; state?:string; kind:string; art:string; accent:string};
const roots = () => [path.resolve('dist/public'), path.resolve('client/public')];
function asset(relative: string) {
  for (const root of roots()) { const file=path.join(root,relative); if(fs.existsSync(file))return file; }
  throw new Error('Missing Outzide share asset: '+relative);
}
let catalog: Map<string,SharedOutzPlace> | undefined;
export function getOutzSharePlace(id: string | null): SharedOutzPlace | null {
  if(!id)return null;
  catalog ??= new Map((JSON.parse(fs.readFileSync(asset('outzide-map/places.json'),'utf8')).places as SharedOutzPlace[]).map(p=>[p.id,p]));
  return catalog.get(id) ?? null;
}
const xml = (s:string) => s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
const labels: Record<string,string> = {trail:'HIKES',camp:'CAMP + HIKE',stay:'COMMUNITY STAYS',beach:'BEACHES',spring:'HOT SPRINGS',watercamp:'LAKE + RIVER CAMPS',coastcamp:'COASTAL CAMPS',fishing:'FISHING',boating:'BOATING',atv:'ATV',winter:'WINTER SPORTS',dayuse:'DAY USE'};
const pending = new Map<string,Promise<Buffer>>();
const cache = new Map<string,Buffer>();
export async function renderOutzShareCard(id:string): Promise<Buffer|null> {
  const p=getOutzSharePlace(id); if(!p)return null;
  if(cache.has(id))return cache.get(id)!;
  if(pending.has(id))return pending.get(id)!;
  const work=render(p).then(buffer=>{if(cache.size>=32)cache.delete(cache.keys().next().value!);cache.set(id,buffer);return buffer;}).finally(()=>pending.delete(id));
  pending.set(id,work);return work;
}
async function render(p:SharedOutzPlace) {
  // Artwork paths come only from the shipped catalog, never from request paths.
  const accent=/^#[0-9a-f]{6}$/i.test(p.accent)?p.accent:'#ff8c00';
  const contours=Array.from({length:9},(_,i)=>`<ellipse cx="960" cy="310" rx="${155+i*36}" ry="${185+i*27}" fill="none" stroke="${accent}" stroke-opacity="${.14-i*.01}" stroke-width="2" transform="rotate(-24 960 310)"/>`).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#172923"/><stop offset="1" stop-color="#071310"/></linearGradient></defs><rect width="1200" height="630" fill="url(#bg)"/>${contours}<path d="M54 169H1146" stroke="#b4ccb4" stroke-opacity=".2"/><rect x="54" y="217" width="4" height="30" rx="2" fill="${accent}"/><text x="74" y="240" font-family="sans-serif" font-size="22" letter-spacing="3" fill="${accent}">${xml(labels[p.kind]||'EXPLORE')}</text><text x="56" y="514" font-family="sans-serif" font-size="22" fill="#bbccbf">${xml(p.region).slice(0,180)}</text><path d="M54 554H1146" stroke="#b4ccb4" stroke-opacity=".2"/><text x="56" y="593" font-family="sans-serif" font-size="18" fill="#bbccbf">Find your next escape.</text><text x="1144" y="593" text-anchor="end" font-family="sans-serif" font-size="18" fill="#bbccbf">zaylist.com/outzide</text></svg>`;
  const transparent={r:0,g:0,b:0,alpha:0};
  const [outz,zay,art,title]=await Promise.all([
    sharp(asset('outzide-map/assets/outzide.png')).resize(390,110,{fit:'contain',background:transparent}).png().toBuffer(),
    sharp(asset('brand/zaylist-logo-alpha.png')).trim().resize(250,92,{fit:'contain',background:transparent}).png().toBuffer(),
    sharp(asset('outzide-map/'+p.art)).resize(380,380,{fit:'contain',background:transparent}).png().toBuffer(),
    sharp({text:{text:`<span foreground="#f0eee4" weight="bold">${xml(p.name)}</span>`,font:'sans-serif 60',width:640,height:205,rgba:true,wrap:'word'}}).png().toBuffer(),
  ]);
  return sharp(Buffer.from(svg)).composite([{input:outz,left:54,top:35},{input:zay,left:896,top:44},{input:art,left:778,top:179},{input:title,left:54,top:274}]).png().toBuffer();
}
