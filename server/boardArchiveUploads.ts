import type Database from "better-sqlite3";
import {realpath} from "node:fs/promises";
import {lstatSync,realpathSync,unlinkSync} from "node:fs";
import path from "node:path";
import {setImmediate as yieldToRequests} from "node:timers/promises";
const quote=(name:string)=>`"${name.replaceAll('"','""')}"`;
/** Only orphaned post uploads are deleted. Profile photos and inbox attachments
 * remain protected by references anywhere else in the application database. */
export async function cleanBoardArchiveUploads(db:Database.Database,uploadsDirectory:string) {
 if(!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='board_archive_upload_cleanup'").get())return;
 const rows=db.prepare("SELECT upload_path FROM board_archive_upload_cleanup ORDER BY queued_at LIMIT 25").all() as {upload_path:string}[];
 if(!rows.length)return;
 let root:string;try{root=await realpath(uploadsDirectory);}catch{return;}
 const tables=(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name!='board_archive_upload_cleanup'").all() as {name:string}[]).map(({name})=>({name,columns:(db.prepare(`PRAGMA table_info(${quote(name)})`).all() as {name:string;type:string}[]).filter(c=>!c.type||/TEXT|CHAR|CLOB|JSON/i.test(c.type)).map(c=>c.name)}));
 for(const row of rows){
  let decoded:string;try{decoded=decodeURIComponent(row.upload_path);}catch{continue;}
  if(!decoded.startsWith('/uploads/')||decoded.includes('\\')||decoded.includes('\0'))continue;
  const file=path.resolve(root,decoded.slice('/uploads/'.length));
  if(!file.startsWith(root+path.sep))continue;
  const version=()=>`${db.pragma("data_version",{simple:true})}:${db.prepare("SELECT total_changes()").pluck().get()}`;
  const scannedVersion=version();
  let referenced=false;
  for(const table of tables){
   await yieldToRequests();
   if(!table.columns.length)continue;
   const clauses=table.columns.map(column=>`(instr(replace(CAST(${quote(column)} AS TEXT),'\\/','/'),@encoded)>0 OR instr(replace(CAST(${quote(column)} AS TEXT),'\\/','/'),@decoded)>0)`);
   if(db.prepare(`SELECT 1 FROM ${quote(table.name)} WHERE ${clauses.join(' OR ')} LIMIT 1`).get({encoded:row.upload_path,decoded})){referenced=true;break;}
  }
  if(referenced){db.prepare("UPDATE board_archive_upload_cleanup SET queued_at=? WHERE upload_path=?").run(new Date().toISOString(),row.upload_path);continue;}
  // A writer may add a reference while the scan yields. Lock writers and
  // compare both external and same-connection changes before deleting.
  db.transaction(()=>{
   if(version()!==scannedVersion)return;
   try{const stat=lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink())return;const resolved=realpathSync(file);if(!resolved.startsWith(root+path.sep))return;unlinkSync(resolved);}
   catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;}
   db.prepare("DELETE FROM board_archive_upload_cleanup WHERE upload_path=?").run(row.upload_path);
  }).immediate();
 }
}
