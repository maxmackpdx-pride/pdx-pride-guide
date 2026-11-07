import type {Express,Request,Response} from 'express';
import type Database from 'better-sqlite3';
import afterzSeed from './data/maps/afterz.json';
import zaydarkSeed from './data/maps/zaydark.json';
import {createMapSocialContentStore,type ContentEnvelope} from './mapSocialContent';

const CONSENT_VERSION='zaydark18/v1' as const;
declare module 'express-session' {
 interface SessionData {
  zaydarkMapConsent?:{userId:number;confirmedAt:string;version:typeof CONSENT_VERSION};
 }
}
type SocialUser={id:number;status:string};
export type MapSocialRouteOptions={
 db:Database.Database;
 getUserById(id:number):SocialUser|null|undefined|Promise<SocialUser|null|undefined>;
 now?:()=>number;
};
function noStore(res:Response){res.setHeader('Cache-Control','private, no-store');res.setHeader('Vary','Cookie');}
function saveSession(req:Request):Promise<void>{
 return new Promise((resolve,reject)=>{
  if(!req.session||typeof req.session.save!=='function')return reject(new Error('Session unavailable'));
  req.session.save(error=>error?reject(error):resolve());
 });
}
/** JSON fetch POSTs must originate from this exact origin. No Referer fallback,
 * permissive CORS, caller-supplied domain or browser-header-only adult grant. */
function sameOrigin(req:Request):boolean{
 if(req.get('Sec-Fetch-Site')==='cross-site')return false;
 const origin=req.get('Origin');if(!origin)return false;
 try{return new URL(origin).origin===`${req.protocol}://${req.get('Host')}`;}catch{return false;}
}
export function registerMapSocialRoutes(app:Express,options:MapSocialRouteOptions){
 const now=options.now??Date.now;
 const store=createMapSocialContentStore(options.db,[afterzSeed,zaydarkSeed] as unknown as ContentEnvelope[]);
 const gate=async(req:Request)=>{
  const id=req.session?.userId;
  const user=Number.isSafeInteger(id)&&Number(id)>0?await options.getUserById(id!):null;
  const signedIn=!!user&&user.id===id&&user.status==='active';
  const consent=req.session?.zaydarkMapConsent;
  const timestamp=Date.parse(consent?.confirmedAt??'');
  const adultOptIn=signedIn&&consent?.userId===id&&consent.version===CONSENT_VERSION&&Number.isFinite(timestamp)&&timestamp<=now()+60000;
  if(consent&&!adultOptIn){delete req.session.zaydarkMapConsent;await saveSession(req);}
  return {signedIn,adultOptIn};
 };
 app.get('/api/maps/v1/zaydark/consent',async(req,res)=>{
  noStore(res);
  try{res.json(await gate(req));}catch{res.status(503).json({error:'Session unavailable'});}
 });
 app.post('/api/maps/v1/zaydark/consent',async(req,res)=>{
  noStore(res);
  if(!sameOrigin(req))return res.status(403).json({error:'Same-origin confirmation required'});
  if(!req.is('application/json')||req.body?.confirmed18!==true)return res.status(400).json({error:'Explicit 18+ acknowledgment required'});
  try{
   const current=await gate(req);
   if(!current.signedIn)return res.status(401).json({error:'Sign in to your Zaylist account',signedIn:false,adultOptIn:false});
   req.session.zaydarkMapConsent={userId:req.session.userId!,confirmedAt:new Date(now()).toISOString(),version:CONSENT_VERSION};
   try{await saveSession(req);}catch{delete req.session.zaydarkMapConsent;return res.status(503).json({error:'Could not save consent',signedIn:true,adultOptIn:false});}
   return res.json({signedIn:true,adultOptIn:true});
  }catch{return res.status(503).json({error:'Session unavailable'});}
 });
 app.get('/api/maps/v1/social/:mode',async(req,res)=>{
  noStore(res);
  const mode=req.params.mode;
  if(mode!=='afterz'&&mode!=='zaydark')return res.status(404).json({error:'Unknown social mode'});
  try{
   if(mode==='zaydark'){
    const state=await gate(req);
    if(!state.adultOptIn)return res.status(403).json({error:'adult-gate-required',adultGateRequired:true});
   }
   const payload=store.read(mode);
   if(!payload)return res.status(404).json({error:'Content unavailable'});
   return res.json(payload);
  }catch{return res.status(503).json({error:'Content unavailable'});}
 });
 return store;
}
