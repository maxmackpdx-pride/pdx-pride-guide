import fs from 'node:fs';
import path from 'node:path';
import { renderSocialCardArtwork } from './socialCardArtwork';

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
  // Artwork paths come only from the shipped catalog. Location photography
  // fills the art zone (cover), like profile cards; the contained treatment
  // is for logos and posters.
  return renderSocialCardArtwork(fs.readFileSync(asset('outzide-map/'+p.art)), "cover");
}
