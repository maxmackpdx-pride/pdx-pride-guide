import type Database from 'better-sqlite3';
export type InboxWorkState = {kind:string; entityId:number; status:'review'|'waiting'|'escalated'; reason:string; version:number; updatedAt:string; actor:string};
export function createInboxWorkflow(db: Database.Database) {
 db.exec(`CREATE TABLE IF NOT EXISTS inbox_case_workflow(kind TEXT NOT NULL, entity_id INTEGER NOT NULL, status TEXT NOT NULL, reason TEXT NOT NULL, version INTEGER NOT NULL, updated_at TEXT NOT NULL, actor TEXT NOT NULL, PRIMARY KEY(kind,entity_id));
 CREATE TABLE IF NOT EXISTS inbox_case_history(id INTEGER PRIMARY KEY AUTOINCREMENT,kind TEXT NOT NULL,entity_id INTEGER NOT NULL,status TEXT NOT NULL,reason TEXT NOT NULL,version INTEGER NOT NULL,updated_at TEXT NOT NULL,actor TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS inbox_case_history_case ON inbox_case_history(kind,entity_id,id);`);
 const fields='kind, entity_id AS entityId, status, reason, version, updated_at AS updatedAt, actor';
 const get=(kind:string,id:number)=>db.prepare(`SELECT ${fields} FROM inbox_case_workflow WHERE kind=? AND entity_id=?`).get(kind,id) as InboxWorkState|undefined;
 return {
  get,
  list:()=>db.prepare(`SELECT ${fields} FROM inbox_case_workflow`).all() as InboxWorkState[],
  history:(kind:string,id:number)=>db.prepare(`SELECT ${fields} FROM inbox_case_history WHERE kind=? AND entity_id=? ORDER BY id DESC LIMIT 30`).all(kind,id) as InboxWorkState[],
  change: db.transaction((input:{kind:string;entityId:number;status:string;reason:string;version:number;actor:string;primaryOwner:boolean})=>{
   if(!['review','waiting','escalated'].includes(input.status)) throw Error('Invalid workflow status');
   if(!Number.isSafeInteger(input.entityId)||input.entityId<=0||!Number.isSafeInteger(input.version)||input.version<0) throw Error('Invalid case or version');
   const current=get(input.kind,input.entityId);
   if((current?.version??0)!==input.version) throw Error('This case changed. Refresh and try again.');
   if(current?.status==='escalated'&&!input.primaryOwner) throw Error('Only the primary owner can return an escalation to review.');
   const reason=String(input.reason||'').trim();
   if(input.status!=='review'&&!reason) throw Error('Add a reason and the next step.');
   if(reason.length>2000) throw Error('Keep the reason under 2,000 characters.');
   const version=input.version+1,at=new Date().toISOString();
   const values=[input.kind,input.entityId,input.status,reason,version,at,input.actor];
   db.prepare(`INSERT INTO inbox_case_workflow VALUES(?,?,?,?,?,?,?) ON CONFLICT(kind,entity_id) DO UPDATE SET status=excluded.status,reason=excluded.reason,version=excluded.version,updated_at=excluded.updated_at,actor=excluded.actor`).run(...values);
   db.prepare(`INSERT INTO inbox_case_history(kind,entity_id,status,reason,version,updated_at,actor) VALUES(?,?,?,?,?,?,?)`).run(...values);
   return get(input.kind,input.entityId)!;
  }),
 };
}

/** All mutation routes used by the shared case reviewer. */
export function inboxCaseForMutation(path:string): {kind:string;entityId:number}|null {
 const routes: [RegExp,string][]=[
 [/^\/api\/admin\/submissions\/(\d+)(?:\/|$)/i,'submission'],
 [/^\/api\/admin\/promoter-requests\/(\d+)(?:\/|$)/i,'promoter'],
 [/^\/api\/admin\/business-claims\/(\d+)(?:\/|$)/i,'business_claim'],
 [/^\/api\/admin\/business-submissions\/(\d+)(?:\/|$)/i,'business_submission'],
 [/^\/api\/admin\/moderation\/(\d+)(?:\/|$)/i,'moderation'],
 [/^\/api\/admin\/missed-connections\/(\d+)(?:\/|$)/i,'missed_connection'],
 [/^\/api\/admin\/gifting\/reports\/(\d+)(?:\/|$)/i,'gifting_report'],
 [/^\/api\/admin\/gifting\/(\d+)(?:\/|$)/i,'gifting_flagged'],
 [/^\/api\/admin\/river-brats\/reports\/(\d+)(?:\/|$)/i,'river_brats'],
 [/^\/api\/admin\/gigs\/(\d+)(?:\/|$)/i,'gig_pending'],
 ];
 for(const [pattern,kind] of routes){const match=path.match(pattern);if(match)return {kind,entityId:Number(match[1])}}
 return null;
}
