import PunkBoardCard from './punk/PunkBoardCard';
import {BoardArchiveAction} from './BoardArchiveList';
import BoardMapPlacement from './BoardMapPlacement';
import type {BoardPost} from '@/lib/allBoards';
export default function BoardBrowseCard({post,small=false,isSaved=false,saveDisabled=false,showStatus=false,onSave,onOpen,style,expanded=false,children}:{style?:React.CSSProperties;expanded?:boolean;children?:React.ReactNode;post:BoardPost;small?:boolean;isSaved?:boolean;saveDisabled?:boolean;showStatus?:boolean;onSave:()=>void;onOpen:(target:HTMLButtonElement)=>void}){
 return <div className={`boardz-production-card${expanded ? " boardz-production-card--expanded" : ""}`} style={style}><PunkBoardCard post={post} small={small} saved={isSaved} saveDisabled={saveDisabled} showStatus={showStatus} onSave={onSave} onOpen={onOpen}/>{children}{!expanded&&post.isMine&&post.category!=="outz"&&<div className="board-card-owner-controls"><BoardMapPlacement board={post.category} postId={post.id}/><BoardArchiveAction board={post.category} postId={post.id} title={post.title}/></div>}</div>;
}
