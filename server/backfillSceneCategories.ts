import type Database from 'better-sqlite3';
import {communitySlug} from '../shared/community';

/** Recover missing categories for imported directory records only.
 * Evidence: owner-approved SceneZ card identities (Bearracuda, Pink Ponies,
 * Yes Coach, Lesbian Culture Club) and the directory's existing nonprofit type.
 * Unknown groups and every explicitly saved category remain untouched.
 */
export function backfillSceneCategories(db: Database.Database): number {
 const rows=db.prepare(`SELECT c.id,c.slug,c.name,b.name sourceName,b.type sourceType
   FROM communities c JOIN businesses b ON b.id=c.source_business_id
   WHERE c.scene_category IS NULL AND b.active=1`).all() as Array<{id:string;slug:string;name:string;sourceName:string;sourceType:string}>;
 const update=db.prepare('UPDATE communities SET scene_category=? WHERE id=? AND scene_category IS NULL');
 const normalize=(s:string)=>s.trim().toLowerCase();
 const known:Record<string,string>={bearracuda:'party-collective','pink ponies':'party-collective','yes coach':'party-collective','yes coach productions':'party-collective','lesbian culture club':'club'};
 return db.transaction(()=>{let changed=0;for(const row of rows){
  // A renamed/repurposed community must be categorized by its owner, not history.
  if(normalize(row.name)!==normalize(row.sourceName)||row.slug!==communitySlug(row.sourceName))continue;
  const category=known[normalize(row.sourceName)]||(row.sourceType==='nonprofit'?'organization':null);
  if(category)changed+=update.run(category,row.id).changes;
 }return changed;})();
}
