import PunkBoardCard from './punk/PunkBoardCard';
import {BoardArchiveAction} from './BoardArchiveList';
import BoardMapPlacement from './BoardMapPlacement';
import type {BoardPost} from '@/lib/allBoards';
export default function BoardBrowseCard({post,isSaved=false,saveDisabled=false,showStatus=false,onSave,onOpen}:{post:BoardPost;isSaved?:boolean;saveDisabled?:boolean;showStatus?:boolean;onSave:()=>void;onOpen:(target:HTMLButtonElement)=>void}){
 return <div className="boardz-production-card"><PunkBoardCard post={post} saved={isSaved} saveDisabled={saveDisabled} showStatus={showStatus} onSave={onSave} onOpen={onOpen}/>{post.isMine&&<div className="board-card-owner-controls"><BoardMapPlacement board={post.category} postId={post.id}/><BoardArchiveAction board={post.category} postId={post.id} title={post.title}/></div>}</div>;
}
