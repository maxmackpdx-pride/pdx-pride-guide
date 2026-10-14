import { cleanBoardArchiveUploads } from "./boardArchiveUploads";
import path from "node:path";
import type { Express, RequestHandler } from "express";
import type { Server } from "node:http";
import type Database from "better-sqlite3";
import { createBoardArchive } from "./boardArchive";
import { isSavedBoard, type SavedBoard } from "./boardSaves";

const roots: Record<string,SavedBoard> = {housing:"housing",gigs:"gigz",gifting:"giftz",sellz:"sellz","missed-connections":"mizzed"};
const content: Record<string,SavedBoard> = {GIG:"gigz",GIFTING:"giftz",SPOTTED:"mizzed",SELLZ:"sellz",HOUSING:"housing"};
export function archivedRequestTarget(path:string): {board:SavedBoard;id:number}|null {
 try{path=decodeURIComponent(path);}catch{return null;}
 const direct=path.match(/^\/api\/(housing|gigs|gifting|sellz|missed-connections)\/([^/]+)(?:\/|$)/i);
 const pin=path.match(/^\/api\/boards\/(housing|houz|gigz|giftz|sellz|mizzed)\/posts\/([^/]+)(?:\/|$)/i);
 const reply=path.match(/^\/api\/content\/([^/]+)\/([^/]+)(?:\/|$)/i);
 const match=direct||pin||reply;
 if(!match)return null;
 const id=Number(match[2]);
 const key=match[1].toLowerCase();
 const board=direct?roots[key]:pin?(key==="houz"?"housing":key) as SavedBoard:content[key.trim().toUpperCase()];
 return board&&Number.isSafeInteger(id)&&id>0?{board,id}:null;
}
export function registerBoardArchiveRoutes(app:Express,db:Database.Database,requireAuth:RequestHandler,httpServer:Server) {
 const archive=createBoardArchive(db);
 let lastSweep=0;
 let cleaning=false;
 const cleanup=()=>{if(cleaning)return;cleaning=true;void cleanBoardArchiveUploads(db,path.resolve(process.env.UPLOADS_DIR||"uploads")).catch(error=>console.error("Board archive upload cleanup failed",error)).finally(()=>{cleaning=false;});};
 const sweep=()=>{if(Date.now()-lastSweep<3600000)return;lastSweep=Date.now();try{archive.sweep();cleanup();}catch(error){console.error("Board archive maintenance failed",error);}};
 const timer=setInterval(sweep,3600000);timer.unref();
 const initial=setImmediate(sweep);
 httpServer.once("close",()=>{clearInterval(timer);clearImmediate(initial);});
 app.use((req,res,next)=>{
  if(req.path.startsWith("/api/"))sweep();
  const target=archivedRequestTarget(req.path);
  if(target&&archive.isArchived(target.board,target.id))return res.status(404).json({error:"This post is archived."});
  next();
 });
 app.get("/api/board-archive",requireAuth,(req,res)=>{res.setHeader("Cache-Control","private, no-store");res.json(archive.list(req.session.userId!));});
 app.get("/api/board-collection",requireAuth,(req,res)=>{res.setHeader("Cache-Control","private, no-store");res.json(archive.memories(req.session.userId!));});
 const manual:RequestHandler=(req,res)=>{
  const board=String(req.params.board||"housing"),id=Number(req.params.postId||req.params.id);
  if(!isSavedBoard(board)||!Number.isSafeInteger(id)||id<1)return res.status(400).json({error:"Choose a valid post."});
  try{archive.archive(board,id,req.session.userId!);res.json({ok:true});}
  catch(error){const message=error instanceof Error?error.message:"Could not archive this post.";res.status(/owner|not found|not your|not allowed/i.test(message)?404:400).json({error:message});}
 };
 app.post("/api/board-archive/:board/:postId",requireAuth,manual);
 // Keep the existing housing action on the same lifecycle and retention clock.
 app.post("/api/housing/:id/archive",requireAuth,manual);
 return archive;
}
