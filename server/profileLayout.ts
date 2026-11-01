import type Database from 'better-sqlite3';
import type {Express,RequestHandler} from 'express';
import {defaultProfileLayout,profileLayoutSchema,type ProfileLayout,type ProfileSource} from '../shared/profileLayout';

export function createProfileLayoutStore(db:Database.Database){
 db.exec(`CREATE TABLE IF NOT EXISTS profile_layouts (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,schema_version INTEGER NOT NULL DEFAULT 1,revision INTEGER NOT NULL DEFAULT 1,document TEXT NOT NULL,updated_at TEXT NOT NULL)`);
 const rowFor=(id:number)=>db.prepare('SELECT document,revision,schema_version FROM profile_layouts WHERE user_id=?').get(id) as {document:string;revision:number;schema_version:number}|undefined;
 const supported=(id:number)=>{const row=rowFor(id);if(!row)return true;try{return row.schema_version===1&&profileLayoutSchema.safeParse({...JSON.parse(row.document),revision:row.revision}).success;}catch{return false;}};
 const read=(id:number):ProfileLayout=>{const row=rowFor(id);if(!row)return defaultProfileLayout();if(!supported(id))return {...defaultProfileLayout(),revision:row.revision};return {...JSON.parse(row.document),revision:row.revision};};
 const save=db.transaction((id:number,document:ProfileLayout)=>{
  const current=read(id);if(!supported(id))return {conflict:true as const,current,unsupported:true};if(current.revision!==document.revision)return {conflict:true as const,current};
  const next={...document,revision:current.revision+1};db.prepare(`INSERT INTO profile_layouts(user_id,schema_version,revision,document,updated_at) VALUES(?,1,?,?,?) ON CONFLICT(user_id) DO UPDATE SET revision=excluded.revision,document=excluded.document,updated_at=excluded.updated_at`).run(id,next.revision,JSON.stringify(next),new Date().toISOString());return {conflict:false as const,current:next};
 });return {read,save,supported};
}
export function registerProfileLayoutRoutes(app:Express,requireAuth:RequestHandler,store:ReturnType<typeof createProfileLayoutStore>,eligible:(userId:number,source:ProfileSource)=>boolean){
 app.get('/api/users/me/profile-layout',requireAuth,(req:any,res)=>{res.set('Cache-Control','private, no-store');if(!store.supported(req.session.userId))return res.status(409).json({error:'This saved wall requires a newer version. It has been preserved.'});res.json(store.read(req.session.userId));});
 app.put('/api/users/me/profile-layout',requireAuth,(req:any,res)=>{
  res.set('Cache-Control','private, no-store');if(Buffer.byteLength(JSON.stringify(req.body??{}))>64000)return res.status(413).json({error:'Layout is too large'});
  const parsed=profileLayoutSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Invalid profile layout',issues:parsed.error.issues});
  // A removed source must not trap its owner in an unsaveable layout. Only discard
  // disabled references already saved by this owner; newly supplied references remain strict.
  const prior=store.read(req.session.userId);
  const widgets=parsed.data.widgets.filter(w=>w.enabled||eligible(req.session.userId,w.source)||!prior.widgets.some(old=>old.id===w.id&&JSON.stringify(old.source)===JSON.stringify(w.source)));
  if(widgets.some(w=>!eligible(req.session.userId,w.source)))return res.status(403).json({error:'That source cannot be added to this profile'});
  const result=store.save(req.session.userId,{...parsed.data,widgets});if(result.conflict)return res.status(409).json({error:'unsupported' in result?'This saved wall requires a newer version. It has been preserved.':'Your profile changed on another device',current:result.current,unsupported:'unsupported' in result});res.json(result.current);
 });
}
