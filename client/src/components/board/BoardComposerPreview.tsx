import {useEffect,useState} from 'react';
import {useAuth} from '@/context/AuthContext';
import {toBoardPosts,type BoardCategory,type BoardPayload} from '@/lib/allBoards';
import PunkBoardCard from './punk/PunkBoardCard';

/** Uses the same API-to-card adapter as published posts. Local file URLs never leave this preview. */
export default function BoardComposerPreview({category,fields,files}:{category:BoardCategory;fields:Record<string,unknown>;files?:FileList|null}){
 const {user}=useAuth();const [photos,setPhotos]=useState<string[]>([]);
 useEffect(()=>{const urls=Array.from(files||[]).map(file=>URL.createObjectURL(file));setPhotos(urls);return()=>urls.forEach(url=>URL.revokeObjectURL(url));},[files]);
 const raw:Record<string,unknown>={id:0,createdAt:'',title:'Your post title',description:'',body:'',status:'ACTIVE',areas:[],household:[],openSlots:0,displayName:user?.displayName||'',author:{userId:user?.id,displayName:user?.displayName,photoUrl:user?.photoUrl},photos:[],photoUrls:[],...fields};
 if(files)raw.photoUrls=photos;
 if(category==='gigz')raw.status='LIVE';
 const post=toBoardPosts(category,(category==='housing'?{posts:[raw]}:[raw]) as BoardPayload,true)[0];
 post.title=post.title||'Your post title';
 return <details className="boardz-composer-preview"><summary>Preview your cards</summary><p>The same title, price, location, photos and artwork appear when posted. Open cards show your full description.</p><div className="boardz-preview-pair"><PunkBoardCard post={post} calm/><PunkBoardCard post={post} small calm/></div></details>;
}
