import type { CardSize } from '@/components/cards/CardAPI';
import PunkBoardCard from './punk/PunkBoardCard';
import {BoardArchiveAction} from './BoardArchiveList';
import BoardMapPlacement from './BoardMapPlacement';
import type {BoardPost} from '@/lib/allBoards';
export default function BoardBrowseCard({post,small=false,size=small?"small":"wide",isSaved=false,saveDisabled=false,showStatus=false,onSave,onOpen,style,expanded=false,children}:{style?:React.CSSProperties;expanded?:boolean;children?:React.ReactNode;post:BoardPost;small?:boolean;size?:CardSize;isSaved?:boolean;saveDisabled?:boolean;showStatus?:boolean;onSave:()=>void;onOpen:(target:HTMLButtonElement)=>void}){
 return <div className={`boardz-production-card${expanded ? " boardz-production-card--expanded" : ""}`} data-card-size={expanded?undefined:size} data-card-category={post.category} style={style}><PunkBoardCard post={post} size={size} small={size==="small"} saved={isSaved} saveDisabled={saveDisabled} showStatus={showStatus} onSave={onSave} onOpen={onOpen}/>{children}{!expanded&&post.isMine&&post.category!=="outz"&&<div className="board-card-owner-controls"><BoardMapPlacement board={post.category} postId={post.id}/><BoardArchiveAction board={post.category} postId={post.id} title={post.title}/></div>}</div>;
}
